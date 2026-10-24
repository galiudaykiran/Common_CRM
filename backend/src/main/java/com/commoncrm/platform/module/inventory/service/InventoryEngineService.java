package com.commoncrm.platform.module.inventory.service;

import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.common.exception.BusinessException;
import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.common.audit.service.AuditService;
import com.commoncrm.platform.module.inventory.dto.*;
import com.commoncrm.platform.module.inventory.entity.Inventory;
import com.commoncrm.platform.module.inventory.entity.InventoryTransaction;
import com.commoncrm.platform.module.inventory.entity.Product;
import com.commoncrm.platform.module.inventory.repository.InventoryRepository;
import com.commoncrm.platform.module.inventory.repository.InventoryTransactionRepository;
import com.commoncrm.platform.module.inventory.repository.ProductRepository;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.service.ShopContextService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class InventoryEngineService {

    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final ProductRepository productRepository;
    private final ShopContextService shopContextService;
    private final AuditService auditService;

    public InventoryEngineService(InventoryRepository inventoryRepository,
                                  InventoryTransactionRepository transactionRepository,
                                  ProductRepository productRepository,
                                  ShopContextService shopContextService,
                                  AuditService auditService) {
        this.inventoryRepository = inventoryRepository;
        this.transactionRepository = transactionRepository;
        this.productRepository = productRepository;
        this.shopContextService = shopContextService;
        this.auditService = auditService;
    }

    /**
     * Concurrency-safe stock adjustment using pessimistic write locking (SELECT ... FOR UPDATE).
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public StockMovementResponse adjustStock(UserPrincipal principal, StockAdjustmentRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);

        // 1. Acquire exclusive lock on the inventory row
        Inventory inventory = inventoryRepository.findForUpdate(shop.getId(), request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory record not found for product id: " + request.getProductId()));

        Product product = inventory.getProduct();
        BigDecimal beforeStock = inventory.getCurrentStock() != null ? inventory.getCurrentStock() : BigDecimal.ZERO;
        BigDecimal delta;
        BigDecimal afterStock;
        String type = request.getAdjustmentType().toUpperCase();

        switch (type) {
            case "CORRECTION" -> {
                // Reconciliation to exact target count
                afterStock = request.getQuantity();
                delta = afterStock.subtract(beforeStock);
            }
            case "DAMAGE_LOSS", "THEFT_SHRINKAGE" -> {
                // Deduct damaged / stolen stock
                BigDecimal deduct = request.getQuantity().abs();
                delta = deduct.negate();
                afterStock = beforeStock.subtract(deduct);
            }
            case "FOUND_STOCK" -> {
                // Surplus discovered
                BigDecimal add = request.getQuantity().abs();
                delta = add;
                afterStock = beforeStock.add(add);
            }
            default -> throw new BusinessException("Unsupported adjustment type: " + type +
                    ". Allowed: CORRECTION, DAMAGE_LOSS, THEFT_SHRINKAGE, FOUND_STOCK");
        }

        if (afterStock.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Stock adjustment would result in negative balance (" + afterStock +
                    ") for product: " + product.getName() + " (SKU: " + product.getSku() + "). Current verified stock: " + beforeStock);
        }

        // 2. Mutate inventory hot balance
        inventory.setCurrentStock(afterStock);
        if (delta.compareTo(BigDecimal.ZERO) > 0) {
            inventory.setLastRestockedAt(Instant.now());
        }
        inventoryRepository.save(inventory);

        // 3. Write immutable audit ledger entry
        BigDecimal unitCost = product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO;
        BigDecimal valuation = unitCost.multiply(delta.abs());

        InventoryTransaction tx = InventoryTransaction.builder()
                .tenantId(shop.getTenant().getId())
                .shop(shop)
                .inventory(inventory)
                .product(product)
                .transactionType(type)
                .referenceType("STOCK_ADJUSTMENT")
                .referenceId(request.getReferenceId() != null ? request.getReferenceId() : "ADJ-" + System.currentTimeMillis())
                .quantityBefore(beforeStock)
                .quantityDelta(delta)
                .quantityAfter(afterStock)
                .unitCost(unitCost)
                .totalValuation(valuation)
                .notes(request.getNotes())
                .createdByUserId(principal.getId())
                .build();

        tx = transactionRepository.save(tx);

        auditService.logAction(
                principal.getId(),
                principal.getUsername(),
                shop.getTenant().getId(),
                "STOCK_ADJUSTED",
                "Inventory",
                String.valueOf(inventory.getId()),
                String.valueOf(beforeStock),
                "Stock adjusted for " + product.getName() + " (" + type + "): " + beforeStock + " -> " + afterStock + " (delta: " + delta + ")"
        );

        return StockMovementResponse.builder()
                .transactionId(tx.getId())
                .productId(product.getId())
                .sku(product.getSku())
                .productName(product.getName())
                .transactionType(type)
                .quantityBefore(beforeStock)
                .quantityDelta(delta)
                .quantityAfter(afterStock)
                .notes(request.getNotes())
                .build();
    }

    /**
     * Inward stock receiving (Goods Receipt / Purchase Inward) with row-level lock.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public StockMovementResponse receiveStock(UserPrincipal principal, StockReceiveRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);

        Inventory inventory = inventoryRepository.findForUpdate(shop.getId(), request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory record not found for product id: " + request.getProductId()));

        Product product = inventory.getProduct();
        BigDecimal beforeStock = inventory.getCurrentStock() != null ? inventory.getCurrentStock() : BigDecimal.ZERO;
        BigDecimal delta = request.getQuantity().abs();
        BigDecimal afterStock = beforeStock.add(delta);

        // Mutate inventory
        inventory.setCurrentStock(afterStock);
        inventory.setLastRestockedAt(Instant.now());
        inventoryRepository.save(inventory);

        // Unit cost resolution
        BigDecimal unitCost = (request.getUnitCost() != null && request.getUnitCost().compareTo(BigDecimal.ZERO) > 0)
                ? request.getUnitCost()
                : (product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO);

        BigDecimal valuation = unitCost.multiply(delta);

        // Append to ledger
        InventoryTransaction tx = InventoryTransaction.builder()
                .tenantId(shop.getTenant().getId())
                .shop(shop)
                .inventory(inventory)
                .product(product)
                .transactionType("PURCHASE_RECEIPT")
                .referenceType("SUPPLIER_INVOICE")
                .referenceId(request.getInvoiceNumber() != null ? request.getInvoiceNumber() : "GRN-" + System.currentTimeMillis())
                .quantityBefore(beforeStock)
                .quantityDelta(delta)
                .quantityAfter(afterStock)
                .unitCost(unitCost)
                .totalValuation(valuation)
                .notes(request.getNotes() != null ? request.getNotes() : "Goods received from supplier")
                .createdByUserId(principal.getId())
                .build();

        tx = transactionRepository.save(tx);

        auditService.logAction(
                principal.getId(),
                principal.getUsername(),
                shop.getTenant().getId(),
                "STOCK_RECEIVED",
                "Inventory",
                String.valueOf(inventory.getId()),
                String.valueOf(beforeStock),
                "Received " + delta + " units for " + product.getName() + " (SKU: " + product.getSku() + ")"
        );

        return StockMovementResponse.builder()
                .transactionId(tx.getId())
                .productId(product.getId())
                .sku(product.getSku())
                .productName(product.getName())
                .transactionType("PURCHASE_RECEIPT")
                .quantityBefore(beforeStock)
                .quantityDelta(delta)
                .quantityAfter(afterStock)
                .notes(request.getNotes())
                .build();
    }

    /**
     * Point-of-Sale / Order stock deduction with row-level lock.
     * Prevents overselling when 2 cashiers submit simultaneously.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public StockMovementResponse deductStockForSale(Long shopId, Long productId, BigDecimal quantity, String orderRef, Long userId) {
        Inventory inventory = inventoryRepository.findForUpdate(shopId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory record not found for product id: " + productId));

        Product product = inventory.getProduct();
        BigDecimal beforeStock = inventory.getCurrentStock() != null ? inventory.getCurrentStock() : BigDecimal.ZERO;
        BigDecimal delta = quantity.abs().negate();
        BigDecimal afterStock = beforeStock.add(delta);

        if (afterStock.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Cannot complete sale: Insufficient stock for '" + product.getName() +
                    "' (SKU: " + product.getSku() + "). Current available: " + beforeStock + ", Requested: " + quantity);
        }

        inventory.setCurrentStock(afterStock);
        inventoryRepository.save(inventory);

        InventoryTransaction tx = InventoryTransaction.builder()
                .tenantId(inventory.getTenantId())
                .shop(inventory.getShop())
                .inventory(inventory)
                .product(product)
                .transactionType("SALE_DEDUCTION")
                .referenceType("POS_SALE")
                .referenceId(orderRef)
                .quantityBefore(beforeStock)
                .quantityDelta(delta)
                .quantityAfter(afterStock)
                .unitCost(product.getCostPrice())
                .totalValuation(product.getCostPrice().multiply(quantity.abs()))
                .notes("Deducted for POS Order " + orderRef)
                .createdByUserId(userId)
                .build();

        tx = transactionRepository.save(tx);

        return StockMovementResponse.builder()
                .transactionId(tx.getId())
                .productId(product.getId())
                .sku(product.getSku())
                .productName(product.getName())
                .transactionType("SALE_DEDUCTION")
                .quantityBefore(beforeStock)
                .quantityDelta(delta)
                .quantityAfter(afterStock)
                .notes("Sale: " + orderRef)
                .build();
    }

    @Transactional(readOnly = true)
    public InventorySummaryResponse getInventorySummary(UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Long shopId = shop.getId();

        long totalProducts = productRepository.countByShopId(shopId);
        long activeProducts = productRepository.countByShopIdAndStatus(shopId, "ACTIVE");
        BigDecimal totalUnits = inventoryRepository.calculateTotalStockCount(shopId);
        BigDecimal totalCost = inventoryRepository.calculateTotalCostValuation(shopId);
        BigDecimal totalRetail = inventoryRepository.calculateTotalRetailValuation(shopId);
        long lowStockCount = inventoryRepository.countLowStock(shopId);
        long outOfStockCount = inventoryRepository.countOutOfStock(shopId);

        return InventorySummaryResponse.builder()
                .totalProducts(totalProducts)
                .activeProducts(activeProducts)
                .totalStockUnits(totalUnits != null ? totalUnits : BigDecimal.ZERO)
                .totalCostValuation(totalCost != null ? totalCost : BigDecimal.ZERO)
                .totalRetailValuation(totalRetail != null ? totalRetail : BigDecimal.ZERO)
                .lowStockCount(lowStockCount)
                .outOfStockCount(outOfStockCount)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getLowStockAlerts(UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        List<Inventory> lowStockList = inventoryRepository.findLowStockInventories(shop.getId());

        return lowStockList.stream()
                .map(inv -> {
                    Product p = inv.getProduct();
                    BigDecimal current = inv.getCurrentStock();
                    boolean isOut = current.compareTo(BigDecimal.ZERO) <= 0;
                    return ProductResponse.builder()
                            .id(p.getId())
                            .name(p.getName())
                            .sku(p.getSku())
                            .barcode(p.getBarcode())
                            .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                            .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                            .unitOfMeasure(p.getUnitOfMeasure())
                            .costPrice(p.getCostPrice())
                            .sellingPrice(p.getSellingPrice())
                            .reorderLevel(p.getReorderLevel())
                            .safetyStock(p.getSafetyStock())
                            .status(p.getStatus())
                            .currentStock(current)
                            .reservedStock(inv.getReservedStock())
                            .availableStock(inv.getAvailableStock())
                            .binLocation(inv.getBinLocation())
                            .isLowStock(true)
                            .isOutOfStock(isOut)
                            .lastRestockedAt(inv.getLastRestockedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<InventoryTransactionResponse> getProductLedger(UserPrincipal principal, Long productId, int page, int size) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)));

        Page<InventoryTransaction> txPage = (productId != null)
                ? transactionRepository.findByShopIdAndProductId(shop.getId(), productId, pageable)
                : transactionRepository.findAllByShopId(shop.getId(), pageable);

        List<InventoryTransactionResponse> items = txPage.getContent().stream()
                .map(this::toTxResponse)
                .collect(Collectors.toList());

        return PageResponse.<InventoryTransactionResponse>builder()
                .content(items)
                .page(txPage.getNumber())
                .size(txPage.getSize())
                .totalElements(txPage.getTotalElements())
                .totalPages(txPage.getTotalPages())
                .first(txPage.isFirst())
                .last(txPage.isLast())
                .build();
    }

    private InventoryTransactionResponse toTxResponse(InventoryTransaction tx) {
        return InventoryTransactionResponse.builder()
                .id(tx.getId())
                .productId(tx.getProduct().getId())
                .productName(tx.getProduct().getName())
                .sku(tx.getProduct().getSku())
                .transactionType(tx.getTransactionType())
                .referenceType(tx.getReferenceType())
                .referenceId(tx.getReferenceId())
                .quantityBefore(tx.getQuantityBefore())
                .quantityDelta(tx.getQuantityDelta())
                .quantityAfter(tx.getQuantityAfter())
                .unitCost(tx.getUnitCost())
                .totalValuation(tx.getTotalValuation())
                .notes(tx.getNotes())
                .createdByUserId(tx.getCreatedByUserId())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
