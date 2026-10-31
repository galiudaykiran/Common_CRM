package com.commoncrm.platform.module.billing.service;

import com.commoncrm.platform.common.audit.service.AuditService;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.billing.dto.InvoiceDto.CreateInvoiceItemRequest;
import com.commoncrm.platform.module.billing.dto.InvoiceDto.CreateInvoicePaymentRequest;
import com.commoncrm.platform.module.billing.dto.InvoiceDto.CreateInvoiceRequest;
import com.commoncrm.platform.module.billing.dto.InvoiceDto.InvoiceResponse;
import com.commoncrm.platform.module.billing.entity.Invoice;
import com.commoncrm.platform.module.billing.repository.CustomerRepository;
import com.commoncrm.platform.module.billing.repository.InvoiceRepository;
import com.commoncrm.platform.module.billing.repository.NotificationDeliveryLogRepository;
import com.commoncrm.platform.module.inventory.entity.Product;
import com.commoncrm.platform.module.inventory.repository.ProductRepository;
import com.commoncrm.platform.module.inventory.service.InventoryEngineService;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.service.ShopContextService;
import com.commoncrm.platform.module.tenant.entity.Tenant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillingServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private InventoryEngineService inventoryEngineService;
    @Mock
    private NotificationDeliveryLogRepository notificationDeliveryLogRepository;
    @Mock
    private ShopContextService shopContextService;
    @Mock
    private AuditService auditService;

    private BillingService billingService;

    private Tenant tenant;
    private Shop shop;
    private Product product;
    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        billingService = new BillingService(
                invoiceRepository,
                customerRepository,
                productRepository,
                inventoryEngineService,
                notificationDeliveryLogRepository,
                shopContextService,
                auditService
        );

        tenant = Tenant.builder()
                .code("NAGARAJU")
                .name("Nagaraju Enterprise")
                .status("ACTIVE")
                .build();
        tenant.setId(10L);

        shop = Shop.builder()
                .tenant(tenant)
                .code("NAG_11")
                .name("Nagaraju Fancy Store")
                .status("ACTIVE")
                .build();
        shop.setId(100L);

        product = Product.builder()
                .tenantId(10L)
                .shop(shop)
                .name("Baby Doll")
                .sku("TOY-001")
                .barcode("890123456789")
                .sellingPrice(new BigDecimal("119.00"))
                .costPrice(new BigDecimal("70.00"))
                .taxRate(new BigDecimal("5.00"))
                .taxInclusive(true)
                .status("ACTIVE")
                .build();
        product.setId(500L);

        principal = UserPrincipal.builder()
                .id(1L)
                .tenantId(10L)
                .username("nagaraju")
                .email("nagaraju@example.com")
                .fullName("Nagaraju")
                .active(true)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_SHOP_OWNER")))
                .build();
    }

    @Test
    @DisplayName("createInvoice should generate collision-proof sequence when prior invoices exist")
    void testCreateInvoiceCollisionProofSequence() {
        when(shopContextService.requireCurrentShop(principal)).thenReturn(shop);
        when(productRepository.findByShopIdAndId(100L, 500L)).thenReturn(Optional.of(product));

        // Simulate latest invoice in database is NAG_11-INV-202610-0004
        when(invoiceRepository.findRecentInvoiceNumbersMatching(eq(100L), anyString(), any(Pageable.class)))
                .thenReturn(List.of("NAG_11-INV-202610-0004"));
        // Candidate 0005 is not yet in database
        when(invoiceRepository.findByInvoiceNumber("NAG_11-INV-202610-0005")).thenReturn(Optional.empty());

        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> {
            Invoice inv = invocation.getArgument(0);
            inv.setId(999L);
            return inv;
        });

        CreateInvoiceRequest request = CreateInvoiceRequest.builder()
                .customerName("Walk-in Guest")
                .primaryPaymentMode("CASH")
                .amountPaid(new BigDecimal("200.00"))
                .items(List.of(
                        CreateInvoiceItemRequest.builder()
                                .productId(500L)
                                .quantity(new BigDecimal("1"))
                                .unitPrice(new BigDecimal("119.00"))
                                .build()
                ))
                .payments(List.of(
                        CreateInvoicePaymentRequest.builder()
                                .paymentMode("CASH")
                                .amount(new BigDecimal("119.00"))
                                .build()
                ))
                .sendReceiptNotification(false)
                .build();

        InvoiceResponse response = billingService.createInvoice(principal, request);

        assertNotNull(response);
        assertEquals("NAG_11-INV-202610-0005", response.getInvoiceNumber());
        assertEquals(new BigDecimal("119"), response.getGrandTotal());
        assertEquals(new BigDecimal("200.00"), response.getAmountPaid());
        assertEquals(new BigDecimal("81.00"), response.getChangeReturned());

        // Verify inventory deduction was called with generated invoice number
        verify(inventoryEngineService, times(1)).deductStockForSale(
                eq(shop), eq(500L), eq(new BigDecimal("1")), eq("NAG_11-INV-202610-0005"), eq(1L)
        );

        // Verify audit logging
        verify(auditService, times(1)).logAction(
                eq(1L), eq("nagaraju"), eq(10L), eq("CREATE_INVOICE"), eq("INVOICE"), eq("999"), isNull(), anyString()
        );
    }

    @Test
    @DisplayName("createInvoice should handle duplicate candidate and advance sequence")
    void testCreateInvoiceHandlesCandidateAdvance() {
        when(shopContextService.requireCurrentShop(principal)).thenReturn(shop);
        when(productRepository.findByShopIdAndId(100L, 500L)).thenReturn(Optional.of(product));

        when(invoiceRepository.findRecentInvoiceNumbersMatching(eq(100L), anyString(), any(Pageable.class)))
                .thenReturn(List.of("NAG_11-INV-202610-0001"));
        // Candidate 0002 already exists in database
        when(invoiceRepository.findByInvoiceNumber("NAG_11-INV-202610-0002"))
                .thenReturn(Optional.of(Invoice.builder().invoiceNumber("NAG_11-INV-202610-0002").build()));
        // Candidate 0003 is free
        when(invoiceRepository.findByInvoiceNumber("NAG_11-INV-202610-0003")).thenReturn(Optional.empty());

        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> {
            Invoice inv = invocation.getArgument(0);
            inv.setId(1001L);
            return inv;
        });

        CreateInvoiceRequest request = CreateInvoiceRequest.builder()
                .customerName("Ramesh Kumar")
                .customerPhone("9876543210")
                .primaryPaymentMode("CASH")
                .amountPaid(new BigDecimal("119.00"))
                .items(List.of(
                        CreateInvoiceItemRequest.builder()
                                .productId(500L)
                                .quantity(new BigDecimal("1"))
                                .unitPrice(new BigDecimal("119.00"))
                                .build()
                ))
                .sendReceiptNotification(false)
                .build();

        InvoiceResponse response = billingService.createInvoice(principal, request);

        assertNotNull(response);
        assertEquals("NAG_11-INV-202610-0003", response.getInvoiceNumber());
    }
}
