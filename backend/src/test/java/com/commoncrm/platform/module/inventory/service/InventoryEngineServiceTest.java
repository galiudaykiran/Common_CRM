package com.commoncrm.platform.module.inventory.service;

import com.commoncrm.platform.common.audit.service.AuditService;
import com.commoncrm.platform.common.exception.BusinessException;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.inventory.dto.StockAdjustmentRequest;
import com.commoncrm.platform.module.inventory.dto.StockMovementResponse;
import com.commoncrm.platform.module.inventory.dto.StockReceiveRequest;
import com.commoncrm.platform.module.inventory.entity.Inventory;
import com.commoncrm.platform.module.inventory.entity.InventoryTransaction;
import com.commoncrm.platform.module.inventory.entity.Product;
import com.commoncrm.platform.module.inventory.repository.InventoryRepository;
import com.commoncrm.platform.module.inventory.repository.InventoryTransactionRepository;
import com.commoncrm.platform.module.inventory.repository.ProductRepository;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.service.ShopContextService;
import com.commoncrm.platform.module.tenant.entity.Tenant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryEngineServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;
    @Mock
    private InventoryTransactionRepository transactionRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private ShopContextService shopContextService;
    @Mock
    private AuditService auditService;

    private InventoryEngineService inventoryEngineService;

    private Tenant tenant;
    private Shop shop;
    private Product product;
    private Inventory inventory;
    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        inventoryEngineService = new InventoryEngineService(
                inventoryRepository,
                transactionRepository,
                productRepository,
                shopContextService,
                auditService
        );

        tenant = Tenant.builder().name("Retail Corp").build();
        tenant.setId(10L);

        shop = Shop.builder().tenant(tenant).name("Flagship Store").code("SHP-001").status("ACTIVE").build();
        shop.setId(100L);

        product = Product.builder()
                .tenantId(10L)
                .shop(shop)
                .name("Organic Green Tea 100g")
                .sku("TEA-GRN-100")
                .costPrice(new BigDecimal("120.00"))
                .sellingPrice(new BigDecimal("180.00"))
                .reorderLevel(10)
                .unitOfMeasure("PCS")
                .build();
        product.setId(500L);

        inventory = Inventory.builder()
                .tenantId(10L)
                .shop(shop)
                .product(product)
                .currentStock(new BigDecimal("25.000"))
                .reservedStock(BigDecimal.ZERO)
                .build();
        inventory.setId(800L);

        principal = UserPrincipal.builder()
                .id(1L)
                .username("store_manager")
                .tenantId(10L)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_STORE_MANAGER")))
                .build();
    }

    @Test
    @DisplayName("Pessimistic stock deduction should reject sale when stock is insufficient (zero-overselling defense)")
    void deductStockForSale_insufficientStock_throwsBusinessException() {
        when(inventoryRepository.findForUpdate(100L, 500L)).thenReturn(Optional.of(inventory));

        // Attempt to deduct 30 items when only 25 are in stock
        assertThrows(BusinessException.class, () ->
                inventoryEngineService.deductStockForSale(100L, 500L, new BigDecimal("30"), "POS-ORDER-001", 1L)
        );

        verify(inventoryRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Pessimistic stock deduction should succeed and append ledger record when stock is available")
    void deductStockForSale_success() {
        when(inventoryRepository.findForUpdate(100L, 500L)).thenReturn(Optional.of(inventory));
        when(transactionRepository.save(any(InventoryTransaction.class))).thenAnswer(inv -> {
            InventoryTransaction tx = inv.getArgument(0);
            tx.setId(999L);
            return tx;
        });

        StockMovementResponse res = inventoryEngineService.deductStockForSale(100L, 500L, new BigDecimal("5"), "POS-ORDER-001", 1L);

        assertNotNull(res);
        assertEquals(new BigDecimal("25.000"), res.getQuantityBefore());
        assertEquals(new BigDecimal("-5"), res.getQuantityDelta());
        assertEquals(new BigDecimal("20.000"), res.getQuantityAfter());

        verify(inventoryRepository).save(inventory);
        verify(transactionRepository).save(any(InventoryTransaction.class));
    }

    @Test
    @DisplayName("Stock physical audit correction should reconcile count and append auditable transaction")
    void adjustStock_physicalAudit_success() {
        when(shopContextService.requireCurrentShop(principal)).thenReturn(shop);
        when(inventoryRepository.findForUpdate(100L, 500L)).thenReturn(Optional.of(inventory));
        when(transactionRepository.save(any(InventoryTransaction.class))).thenAnswer(inv -> {
            InventoryTransaction tx = inv.getArgument(0);
            tx.setId(1001L);
            return tx;
        });

        StockAdjustmentRequest req = StockAdjustmentRequest.builder()
                .productId(500L)
                .adjustmentType("CORRECTION")
                .quantity(new BigDecimal("30.000"))
                .notes("Reconciled with weekend physical audit")
                .build();

        StockMovementResponse res = inventoryEngineService.adjustStock(principal, req);

        assertNotNull(res);
        assertEquals(new BigDecimal("25.000"), res.getQuantityBefore());
        assertEquals(new BigDecimal("5.000"), res.getQuantityDelta());
        assertEquals(new BigDecimal("30.000"), res.getQuantityAfter());

        verify(inventoryRepository).save(inventory);
        verify(transactionRepository).save(any(InventoryTransaction.class));
    }

    @Test
    @DisplayName("Goods receipt inward intake should increment stock and track invoice reference in ledger")
    void receiveStock_purchaseInward_success() {
        when(shopContextService.requireCurrentShop(principal)).thenReturn(shop);
        when(inventoryRepository.findForUpdate(100L, 500L)).thenReturn(Optional.of(inventory));
        when(transactionRepository.save(any(InventoryTransaction.class))).thenAnswer(inv -> {
            InventoryTransaction tx = inv.getArgument(0);
            tx.setId(1002L);
            return tx;
        });

        StockReceiveRequest req = StockReceiveRequest.builder()
                .productId(500L)
                .quantity(new BigDecimal("50.000"))
                .unitCost(new BigDecimal("115.00"))
                .invoiceNumber("SUPPLIER-INV-4410")
                .notes("New shipment received")
                .build();

        StockMovementResponse res = inventoryEngineService.receiveStock(principal, req);

        assertNotNull(res);
        assertEquals(new BigDecimal("25.000"), res.getQuantityBefore());
        assertEquals(new BigDecimal("50.000"), res.getQuantityDelta());
        assertEquals(new BigDecimal("75.000"), res.getQuantityAfter());

        verify(inventoryRepository).save(inventory);
        verify(transactionRepository).save(any(InventoryTransaction.class));
    }
}
