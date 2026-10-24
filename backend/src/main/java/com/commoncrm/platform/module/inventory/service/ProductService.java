package com.commoncrm.platform.module.inventory.service;

import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.common.exception.BusinessException;
import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.common.audit.service.AuditService;
import com.commoncrm.platform.module.inventory.dto.CreateProductRequest;
import com.commoncrm.platform.module.inventory.dto.ProductResponse;
import com.commoncrm.platform.module.inventory.dto.UpdateProductRequest;
import com.commoncrm.platform.module.inventory.entity.Category;
import com.commoncrm.platform.module.inventory.entity.Inventory;
import com.commoncrm.platform.module.inventory.entity.InventoryTransaction;
import com.commoncrm.platform.module.inventory.entity.Product;
import com.commoncrm.platform.module.inventory.repository.CategoryRepository;
import com.commoncrm.platform.module.inventory.repository.InventoryRepository;
import com.commoncrm.platform.module.inventory.repository.InventoryTransactionRepository;
import com.commoncrm.platform.module.inventory.repository.ProductRepository;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.service.ShopContextService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final ShopContextService shopContextService;
    private final AuditService auditService;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          InventoryRepository inventoryRepository,
                          InventoryTransactionRepository transactionRepository,
                          ShopContextService shopContextService,
                          AuditService auditService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.inventoryRepository = inventoryRepository;
        this.transactionRepository = transactionRepository;
        this.shopContextService = shopContextService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> searchProducts(UserPrincipal principal,
                                                        String search,
                                                        Long categoryId,
                                                        String status,
                                                        int page,
                                                        int size) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), Sort.by("id").descending());

        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) ? status.trim().toUpperCase() : null;

        Page<Product> productPage = productRepository.searchProducts(shop.getId(), cleanSearch, categoryId, cleanStatus, pageable);

        List<ProductResponse> responses = productPage.getContent().stream()
                .map(p -> {
                    Inventory inv = inventoryRepository.findByShopIdAndProductId(shop.getId(), p.getId()).orElse(null);
                    return toProductResponse(p, inv);
                })
                .collect(Collectors.toList());

        return PageResponse.<ProductResponse>builder()
                .content(responses)
                .page(productPage.getNumber())
                .size(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .first(productPage.isFirst())
                .last(productPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(UserPrincipal principal, Long id) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Product product = productRepository.findByShopIdAndId(shop.getId(), id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        Inventory inv = inventoryRepository.findByShopIdAndProductId(shop.getId(), product.getId()).orElse(null);
        return toProductResponse(product, inv);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductByBarcode(UserPrincipal principal, String barcode) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        if (barcode == null || barcode.trim().isEmpty()) {
            throw new BusinessException("Barcode cannot be empty");
        }

        Product product = productRepository.findByShopIdAndBarcode(shop.getId(), barcode.trim())
                .orElseThrow(() -> new ResourceNotFoundException("No active product registered with barcode: " + barcode));

        Inventory inv = inventoryRepository.findByShopIdAndProductId(shop.getId(), product.getId()).orElse(null);
        return toProductResponse(product, inv);
    }

    @Transactional
    public ProductResponse createProduct(UserPrincipal principal, CreateProductRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Long tenantId = shop.getTenant().getId();

        // 1. Resolve SKU
        String sku = request.getSku();
        if (sku == null || sku.trim().isEmpty()) {
            sku = generateSequentialSku(shop.getId());
        } else {
            sku = sku.trim().toUpperCase();
            if (productRepository.existsByShopIdAndSkuIgnoreCase(shop.getId(), sku)) {
                throw new BusinessException("Product SKU '" + sku + "' already exists in this store");
            }
        }

        // 2. Validate Barcode
        String barcode = (request.getBarcode() != null && !request.getBarcode().trim().isEmpty())
                ? request.getBarcode().trim() : null;
        if (barcode != null && productRepository.existsByShopIdAndBarcode(shop.getId(), barcode)) {
            throw new BusinessException("Barcode '" + barcode + "' is already assigned to another product in this store");
        }

        // 3. Resolve Category
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findByShopIdAndId(shop.getId(), request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
        }

        // 4. Create Product
        Product product = Product.builder()
                .tenantId(tenantId)
                .shop(shop)
                .category(category)
                .name(request.getName().trim())
                .sku(sku)
                .barcode(barcode)
                .hsnSacCode(request.getHsnSacCode())
                .unitOfMeasure(request.getUnitOfMeasure() != null ? request.getUnitOfMeasure().toUpperCase() : "PCS")
                .costPrice(request.getCostPrice() != null ? request.getCostPrice() : BigDecimal.ZERO)
                .sellingPrice(request.getSellingPrice() != null ? request.getSellingPrice() : BigDecimal.ZERO)
                .mrp(request.getMrp())
                .taxRate(request.getTaxRate() != null ? request.getTaxRate() : BigDecimal.ZERO)
                .taxInclusive(Boolean.TRUE.equals(request.getTaxInclusive()))
                .reorderLevel(request.getReorderLevel() != null ? request.getReorderLevel() : 10)
                .safetyStock(request.getSafetyStock() != null ? request.getSafetyStock() : 5)
                .status(request.getStatus() != null ? request.getStatus().toUpperCase() : "ACTIVE")
                .description(request.getDescription())
                .build();

        product = productRepository.save(product);

        // 5. Initialize Linked Inventory Record
        BigDecimal initialStock = request.getInitialStock() != null ? request.getInitialStock() : BigDecimal.ZERO;
        Inventory inventory = Inventory.builder()
                .tenantId(tenantId)
                .shop(shop)
                .product(product)
                .currentStock(initialStock)
                .reservedStock(BigDecimal.ZERO)
                .binLocation(request.getBinLocation())
                .lastRestockedAt(initialStock.compareTo(BigDecimal.ZERO) > 0 ? Instant.now() : null)
                .build();

        inventory = inventoryRepository.save(inventory);

        // 6. Record Opening Stock Transaction in Ledger if initialStock > 0
        if (initialStock.compareTo(BigDecimal.ZERO) > 0) {
            InventoryTransaction openingTx = InventoryTransaction.builder()
                    .tenantId(tenantId)
                    .shop(shop)
                    .inventory(inventory)
                    .product(product)
                    .transactionType("OPENING_STOCK")
                    .referenceType("INITIAL_INTAKE")
                    .referenceId("INIT-" + product.getSku())
                    .quantityBefore(BigDecimal.ZERO)
                    .quantityDelta(initialStock)
                    .quantityAfter(initialStock)
                    .unitCost(product.getCostPrice())
                    .totalValuation(product.getCostPrice().multiply(initialStock))
                    .notes("Initial stock entered during product catalog creation")
                    .createdByUserId(principal.getId())
                    .build();
            transactionRepository.save(openingTx);
        }

        auditService.logAction(
                principal.getId(),
                principal.getUsername(),
                tenantId,
                "PRODUCT_CREATED",
                "Product",
                String.valueOf(product.getId()),
                null,
                "Created product " + product.getName() + " (SKU: " + product.getSku() + ") with initial stock: " + initialStock
        );

        return toProductResponse(product, inventory);
    }

    @Transactional
    public ProductResponse updateProduct(UserPrincipal principal, Long id, UpdateProductRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);

        Product product = productRepository.findByShopIdAndId(shop.getId(), id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        // 1. Validate SKU if changed
        if (request.getSku() != null && !request.getSku().trim().isEmpty()) {
            String cleanSku = request.getSku().trim().toUpperCase();
            if (productRepository.existsByShopIdAndSkuIgnoreCaseAndIdNot(shop.getId(), cleanSku, id)) {
                throw new BusinessException("Product SKU '" + cleanSku + "' is already assigned to another product");
            }
            product.setSku(cleanSku);
        }

        // 2. Validate Barcode if changed
        String cleanBarcode = (request.getBarcode() != null && !request.getBarcode().trim().isEmpty())
                ? request.getBarcode().trim() : null;
        if (cleanBarcode != null && productRepository.existsByShopIdAndBarcodeAndIdNot(shop.getId(), cleanBarcode, id)) {
            throw new BusinessException("Barcode '" + cleanBarcode + "' is already assigned to another product");
        }
        product.setBarcode(cleanBarcode);

        // 3. Category
        if (request.getCategoryId() != null) {
            Category cat = categoryRepository.findByShopIdAndId(shop.getId(), request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
            product.setCategory(cat);
        } else {
            product.setCategory(null);
        }

        product.setName(request.getName().trim());
        product.setHsnSacCode(request.getHsnSacCode());
        if (request.getUnitOfMeasure() != null) {
            product.setUnitOfMeasure(request.getUnitOfMeasure().toUpperCase());
        }
        product.setCostPrice(request.getCostPrice());
        product.setSellingPrice(request.getSellingPrice());
        product.setMrp(request.getMrp());
        if (request.getTaxRate() != null) {
            product.setTaxRate(request.getTaxRate());
        }
        if (request.getTaxInclusive() != null) {
            product.setTaxInclusive(request.getTaxInclusive());
        }
        if (request.getReorderLevel() != null) {
            product.setReorderLevel(request.getReorderLevel());
        }
        if (request.getSafetyStock() != null) {
            product.setSafetyStock(request.getSafetyStock());
        }
        if (request.getStatus() != null) {
            product.setStatus(request.getStatus().toUpperCase());
        }
        product.setDescription(request.getDescription());

        product = productRepository.save(product);

        // Update bin location if inventory exists
        Inventory inv = inventoryRepository.findByShopIdAndProductId(shop.getId(), product.getId()).orElse(null);
        if (inv != null && request.getBinLocation() != null) {
            inv.setBinLocation(request.getBinLocation().trim());
            inventoryRepository.save(inv);
        }

        auditService.logAction(
                principal.getId(),
                principal.getUsername(),
                shop.getTenant().getId(),
                "PRODUCT_UPDATED",
                "Product",
                String.valueOf(product.getId()),
                null,
                "Updated product details for " + product.getName() + " (SKU: " + product.getSku() + ")"
        );

        return toProductResponse(product, inv);
    }

    private String generateSequentialSku(Long shopId) {
        long count = productRepository.countByShopId(shopId) + 1;
        String candidate = String.format("SKU-%04d", count);
        while (productRepository.existsByShopIdAndSkuIgnoreCase(shopId, candidate)) {
            count++;
            candidate = String.format("SKU-%04d", count);
        }
        return candidate;
    }

    private ProductResponse toProductResponse(Product p, Inventory inv) {
        BigDecimal current = inv != null ? inv.getCurrentStock() : BigDecimal.ZERO;
        BigDecimal reserved = inv != null ? inv.getReservedStock() : BigDecimal.ZERO;
        BigDecimal available = inv != null ? inv.getAvailableStock() : BigDecimal.ZERO;
        String bin = inv != null ? inv.getBinLocation() : null;
        Instant restocked = inv != null ? inv.getLastRestockedAt() : null;

        boolean isOut = current.compareTo(BigDecimal.ZERO) <= 0;
        boolean isLow = !isOut && p.getReorderLevel() != null && current.compareTo(BigDecimal.valueOf(p.getReorderLevel())) <= 0;

        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .sku(p.getSku())
                .barcode(p.getBarcode())
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .hsnSacCode(p.getHsnSacCode())
                .unitOfMeasure(p.getUnitOfMeasure())
                .costPrice(p.getCostPrice())
                .sellingPrice(p.getSellingPrice())
                .mrp(p.getMrp())
                .taxRate(p.getTaxRate())
                .taxInclusive(p.getTaxInclusive())
                .reorderLevel(p.getReorderLevel())
                .safetyStock(p.getSafetyStock())
                .status(p.getStatus())
                .imageUrl(p.getImageUrl())
                .description(p.getDescription())
                .currentStock(current)
                .reservedStock(reserved)
                .availableStock(available)
                .binLocation(bin)
                .isLowStock(isLow)
                .isOutOfStock(isOut)
                .lastRestockedAt(restocked)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
