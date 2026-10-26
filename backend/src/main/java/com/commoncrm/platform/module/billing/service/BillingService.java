package com.commoncrm.platform.module.billing.service;

import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.common.audit.service.AuditService;
import com.commoncrm.platform.common.exception.BusinessException;
import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.billing.dto.InvoiceDto.*;
import com.commoncrm.platform.module.billing.entity.*;
import com.commoncrm.platform.module.billing.repository.CustomerRepository;
import com.commoncrm.platform.module.billing.repository.InvoiceRepository;
import com.commoncrm.platform.module.billing.repository.NotificationDeliveryLogRepository;
import com.commoncrm.platform.module.inventory.entity.Product;
import com.commoncrm.platform.module.inventory.repository.ProductRepository;
import com.commoncrm.platform.module.inventory.service.InventoryEngineService;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.service.ShopContextService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BillingService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final InventoryEngineService inventoryEngineService;
    private final NotificationDeliveryLogRepository notificationDeliveryLogRepository;
    private final ShopContextService shopContextService;
    private final AuditService auditService;

    public BillingService(InvoiceRepository invoiceRepository,
                          CustomerRepository customerRepository,
                          ProductRepository productRepository,
                          InventoryEngineService inventoryEngineService,
                          NotificationDeliveryLogRepository notificationDeliveryLogRepository,
                          ShopContextService shopContextService,
                          AuditService auditService) {
        this.invoiceRepository = invoiceRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.inventoryEngineService = inventoryEngineService;
        this.notificationDeliveryLogRepository = notificationDeliveryLogRepository;
        this.shopContextService = shopContextService;
        this.auditService = auditService;
    }

    /**
     * Atomic invoice checkout with real-time pessimistic inventory deduction.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public InvoiceResponse createInvoice(UserPrincipal principal, CreateInvoiceRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);

        // 1. Resolve Customer
        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findByIdAndShopId(request.getCustomerId(), shop.getId()).orElse(null);
        } else if (request.getCustomerPhone() != null && !request.getCustomerPhone().isBlank()) {
            String cleanPhone = request.getCustomerPhone().trim();
            customer = customerRepository.findByShopIdAndPhone(shop.getId(), cleanPhone).orElse(null);
            if (customer == null && request.getCustomerName() != null && !request.getCustomerName().isBlank()) {
                // Auto-register walk-in customer profile
                customer = Customer.builder()
                        .tenantId(shop.getTenant().getId())
                        .shop(shop)
                        .name(request.getCustomerName().trim())
                        .phone(cleanPhone)
                        .totalSpent(BigDecimal.ZERO)
                        .creditBalance(BigDecimal.ZERO)
                        .build();
                customer = customerRepository.save(customer);
            }
        }

        // 2. Generate Sequence Invoice Number e.g. NAG_11-INV-202610-0001
        String invoiceNumber = generateInvoiceNumber(shop);

        // 3. Process Line Items and Atomic Stock Deduction
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal itemDiscountTotal = BigDecimal.ZERO;
        BigDecimal cgstTotal = BigDecimal.ZERO;
        BigDecimal sgstTotal = BigDecimal.ZERO;
        BigDecimal igstTotal = BigDecimal.ZERO;

        List<InvoiceItem> itemsToPersist = new ArrayList<>();

        for (CreateInvoiceItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findByShopIdAndId(shop.getId(), itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemReq.getProductId()));

            BigDecimal qty = itemReq.getQuantity();

            // Atomic stock deduction via pessimistic lock + audit ledger logging
            inventoryEngineService.deductStockForSale(shop, product.getId(), qty, invoiceNumber, principal.getId());

            BigDecimal unitPrice = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : product.getSellingPrice();
            BigDecimal unitCost = product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO;
            BigDecimal lineDiscount = itemReq.getDiscountAmount() != null ? itemReq.getDiscountAmount() : BigDecimal.ZERO;

            BigDecimal lineGross = unitPrice.multiply(qty);
            BigDecimal lineNet = lineGross.subtract(lineDiscount);
            if (lineNet.compareTo(BigDecimal.ZERO) < 0) {
                lineNet = BigDecimal.ZERO;
            }

            BigDecimal taxRate = product.getTaxRate() != null ? product.getTaxRate() : BigDecimal.ZERO;
            BigDecimal cgstAmount = BigDecimal.ZERO;
            BigDecimal sgstAmount = BigDecimal.ZERO;
            BigDecimal igstAmount = BigDecimal.ZERO;
            BigDecimal lineTotal;
            boolean isInclusive = Boolean.TRUE.equals(product.getTaxInclusive());

            if (taxRate.compareTo(BigDecimal.ZERO) > 0) {
                if (isInclusive) {
                    // Tax inclusive: tax = lineNet - [lineNet / (1 + rate/100)]
                    BigDecimal factor = BigDecimal.ONE.add(taxRate.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
                    BigDecimal baseAmt = lineNet.divide(factor, 2, RoundingMode.HALF_UP);
                    BigDecimal totalTaxAmt = lineNet.subtract(baseAmt);
                    cgstAmount = totalTaxAmt.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
                    sgstAmount = totalTaxAmt.subtract(cgstAmount);
                    lineTotal = lineNet;
                } else {
                    // Tax exclusive: add tax on top of lineNet
                    BigDecimal halfRate = taxRate.divide(BigDecimal.valueOf(2), 4, RoundingMode.HALF_UP);
                    cgstAmount = lineNet.multiply(halfRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    sgstAmount = lineNet.multiply(halfRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    lineTotal = lineNet.add(cgstAmount).add(sgstAmount);
                }
            } else {
                lineTotal = lineNet;
            }

            subtotal = subtotal.add(lineGross);
            itemDiscountTotal = itemDiscountTotal.add(lineDiscount);
            cgstTotal = cgstTotal.add(cgstAmount);
            sgstTotal = sgstTotal.add(sgstAmount);

            InvoiceItem item = InvoiceItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .sku(product.getSku())
                    .barcode(product.getBarcode())
                    .hsnSacCode(product.getHsnSacCode())
                    .unitOfMeasure(product.getUnitOfMeasure())
                    .quantity(qty)
                    .unitPrice(unitPrice)
                    .unitCost(unitCost)
                    .discountAmount(lineDiscount)
                    .taxRate(taxRate)
                    .taxInclusive(isInclusive)
                    .cgstAmount(cgstAmount)
                    .sgstAmount(sgstAmount)
                    .igstAmount(igstAmount)
                    .lineTotal(lineTotal)
                    .build();

            itemsToPersist.add(item);
        }

        // 4. Invoice-level math & rounding
        BigDecimal invoiceDiscount = request.getInvoiceDiscountTotal() != null ? request.getInvoiceDiscountTotal() : BigDecimal.ZERO;
        BigDecimal totalTax = cgstTotal.add(sgstTotal).add(igstTotal);

        BigDecimal rawGrandTotal = subtotal.subtract(itemDiscountTotal).subtract(invoiceDiscount).add(totalTax);
        if (rawGrandTotal.compareTo(BigDecimal.ZERO) < 0) {
            rawGrandTotal = BigDecimal.ZERO;
        }

        // Round to nearest integer (standard Indian retail billing)
        BigDecimal roundedGrandTotal = rawGrandTotal.setScale(0, RoundingMode.HALF_UP);
        BigDecimal roundOff = roundedGrandTotal.subtract(rawGrandTotal);

        // 5. Payment Tender Breakdown
        BigDecimal amountPaid = request.getAmountPaid() != null ? request.getAmountPaid() : roundedGrandTotal;
        BigDecimal changeReturned = amountPaid.compareTo(roundedGrandTotal) > 0 ? amountPaid.subtract(roundedGrandTotal) : BigDecimal.ZERO;

        String paymentStatus = "PAID";
        if (amountPaid.compareTo(roundedGrandTotal) < 0) {
            paymentStatus = amountPaid.compareTo(BigDecimal.ZERO) > 0 ? "PARTIAL" : "UNPAID";
        }

        String primaryMode = request.getPrimaryPaymentMode() != null ? request.getPrimaryPaymentMode().toUpperCase() : "CASH";

        // 6. Build & Persist Invoice
        Invoice invoice = Invoice.builder()
                .tenantId(shop.getTenant().getId())
                .shop(shop)
                .invoiceNumber(invoiceNumber)
                .customer(customer)
                .customerName(customer != null ? customer.getName() : request.getCustomerName())
                .customerPhone(customer != null ? customer.getPhone() : request.getCustomerPhone())
                .cashierUserId(principal.getId())
                .cashierName(principal.getUsername())
                .subtotal(subtotal)
                .itemDiscountTotal(itemDiscountTotal)
                .invoiceDiscountTotal(invoiceDiscount)
                .cgstTotal(cgstTotal)
                .sgstTotal(sgstTotal)
                .igstTotal(igstTotal)
                .totalTax(totalTax)
                .roundOff(roundOff)
                .grandTotal(roundedGrandTotal)
                .amountPaid(amountPaid)
                .changeReturned(changeReturned)
                .paymentStatus(paymentStatus)
                .primaryPaymentMode(primaryMode)
                .status("COMPLETED")
                .notes(request.getNotes())
                .build();

        for (InvoiceItem item : itemsToPersist) {
            invoice.addItem(item);
        }

        // Populate Payments
        if (request.getPayments() != null && !request.getPayments().isEmpty()) {
            for (CreateInvoicePaymentRequest pReq : request.getPayments()) {
                invoice.addPayment(InvoicePayment.builder()
                        .paymentMode(pReq.getPaymentMode().toUpperCase())
                        .amount(pReq.getAmount())
                        .referenceNumber(pReq.getReferenceNumber())
                        .build());
            }
        } else {
            // Default single tender
            invoice.addPayment(InvoicePayment.builder()
                    .paymentMode(primaryMode)
                    .amount(amountPaid)
                    .build());
        }

        invoice = invoiceRepository.save(invoice);

        // 7. Update Customer Total Spent
        if (customer != null) {
            customer.setTotalSpent(customer.getTotalSpent().add(roundedGrandTotal));
            customerRepository.save(customer);
        }

        // 8. Instant Digital Bill Receipt Notification (SMS / WhatsApp)
        if (request.isSendReceiptNotification() && invoice.getCustomerPhone() != null && !invoice.getCustomerPhone().isBlank()) {
            sendInstantReceiptNotification(shop, invoice);
        }

        // Audit Trail
        auditService.logAction(
                principal.getId(),
                principal.getUsername(),
                shop.getTenant().getId(),
                "CREATE_INVOICE",
                "INVOICE",
                String.valueOf(invoice.getId()),
                null,
                "Generated Invoice #" + invoice.getInvoiceNumber() + " (Grand Total: ₹" + invoice.getGrandTotal() + ")"
        );

        return toInvoiceResponse(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceByNumber(UserPrincipal principal, String invoiceNumber) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Invoice invoice = invoiceRepository.findByShopIdAndInvoiceNumber(shop.getId(), invoiceNumber.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceNumber));
        return toInvoiceResponse(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(UserPrincipal principal, Long id) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Invoice invoice = invoiceRepository.findByIdAndShopId(id, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        return toInvoiceResponse(invoice);
    }

    @Transactional(readOnly = true)
    public PageResponse<InvoiceResponse> searchInvoices(UserPrincipal principal, String search, int page, int size) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Invoice> invoicePage = invoiceRepository.searchInvoices(
                shop.getId(),
                (search != null && !search.isBlank()) ? search.trim() : null,
                pageable
        );

        List<InvoiceResponse> content = invoicePage.getContent().stream()
                .map(this::toInvoiceResponse)
                .collect(Collectors.toList());

        return PageResponse.<InvoiceResponse>builder()
                .content(content)
                .page(invoicePage.getNumber())
                .size(invoicePage.getSize())
                .totalElements(invoicePage.getTotalElements())
                .totalPages(invoicePage.getTotalPages())
                .first(invoicePage.isFirst())
                .last(invoicePage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public ThermalReceiptResponse getThermalReceipt(UserPrincipal principal, String invoiceNumber) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Invoice invoice = invoiceRepository.findByShopIdAndInvoiceNumber(shop.getId(), invoiceNumber.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceNumber));

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd-MMM-yyyy").withZone(ZoneId.of("Asia/Kolkata"));
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a").withZone(ZoneId.of("Asia/Kolkata"));

        List<ThermalItem> thermalItems = invoice.getItems().stream().map(it -> ThermalItem.builder()
                .name(it.getProductName())
                .sku(it.getSku())
                .hsnSacCode(it.getHsnSacCode())
                .quantity(it.getQuantity())
                .unitOfMeasure(it.getUnitOfMeasure())
                .rate(it.getUnitPrice())
                .taxRate(it.getTaxRate())
                .discount(it.getDiscountAmount())
                .lineTotal(it.getLineTotal())
                .build()
        ).collect(Collectors.toList());

        return ThermalReceiptResponse.builder()
                .storeName(shop.getName())
                .storeCode(shop.getCode())
                .storeAddress((shop.getAddress() != null ? shop.getAddress() : "") +
                        (shop.getCity() != null ? ", " + shop.getCity() : ""))
                .storePhone(shop.getPhone())
                .storeEmail(shop.getEmail())
                .storeGstin(shop.getConfiguration() != null ? shop.getConfiguration().getTaxNumber() : null)
                .storeState(shop.getState())
                .invoiceNumber(invoice.getInvoiceNumber())
                .dateFormatted(dateFormatter.format(invoice.getCreatedAt()))
                .timeFormatted(timeFormatter.format(invoice.getCreatedAt()))
                .cashierName(invoice.getCashierName())
                .customerName(invoice.getCustomerName() != null ? invoice.getCustomerName() : "Walk-in Guest")
                .customerPhone(invoice.getCustomerPhone() != null ? invoice.getCustomerPhone() : "—")
                .items(thermalItems)
                .subtotal(invoice.getSubtotal())
                .discountTotal(invoice.getItemDiscountTotal().add(invoice.getInvoiceDiscountTotal()))
                .cgstTotal(invoice.getCgstTotal())
                .sgstTotal(invoice.getSgstTotal())
                .igstTotal(invoice.getIgstTotal())
                .totalTax(invoice.getTotalTax())
                .roundOff(invoice.getRoundOff())
                .grandTotal(invoice.getGrandTotal())
                .amountPaid(invoice.getAmountPaid())
                .changeReturned(invoice.getChangeReturned())
                .paymentMode(invoice.getPrimaryPaymentMode())
                .returnPolicyText("Goods once sold can be exchanged within 7 days with original bill.")
                .footerThankYou("Thank you for shopping with us! Visit again.")
                .build();
    }

    private String generateInvoiceNumber(Shop shop) {
        String prefix = (shop.getCode() != null ? shop.getCode().toUpperCase() : "SHOP") + "-INV-";
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        long countToday = invoiceRepository.countShopInvoicesSince(shop.getId(), LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant()) + 1;
        return String.format("%s%s-%04d", prefix, datePart, countToday);
    }

    private void sendInstantReceiptNotification(Shop shop, Invoice invoice) {
        String msg = String.format("Dear %s, thank you for shopping at %s. Your bill #%s for ₹%s is confirmed paid via %s. Visit again!",
                invoice.getCustomerName() != null ? invoice.getCustomerName() : "Customer",
                shop.getName(),
                invoice.getInvoiceNumber(),
                invoice.getGrandTotal().toString(),
                invoice.getPrimaryPaymentMode());

        NotificationDeliveryLog log = NotificationDeliveryLog.builder()
                .tenantId(shop.getTenant().getId())
                .shop(shop)
                .customer(invoice.getCustomer())
                .notificationType("BILL_RECEIPT")
                .referenceInvoiceNumber(invoice.getInvoiceNumber())
                .recipientPhone(invoice.getCustomerPhone())
                .channel("SMS")
                .messageContent(msg)
                .deliveryStatus("SENT")
                .build();

        notificationDeliveryLogRepository.save(log);
    }

    public InvoiceResponse toInvoiceResponse(Invoice inv) {
        List<InvoiceItemResponse> itemDtos = inv.getItems().stream().map(it -> InvoiceItemResponse.builder()
                .id(it.getId())
                .productId(it.getProduct().getId())
                .productName(it.getProductName())
                .sku(it.getSku())
                .barcode(it.getBarcode())
                .hsnSacCode(it.getHsnSacCode())
                .unitOfMeasure(it.getUnitOfMeasure())
                .quantity(it.getQuantity())
                .unitPrice(it.getUnitPrice())
                .unitCost(it.getUnitCost())
                .discountAmount(it.getDiscountAmount())
                .taxRate(it.getTaxRate())
                .taxInclusive(it.isTaxInclusive())
                .cgstAmount(it.getCgstAmount())
                .sgstAmount(it.getSgstAmount())
                .igstAmount(it.getIgstAmount())
                .lineTotal(it.getLineTotal())
                .build()
        ).collect(Collectors.toList());

        List<InvoicePaymentResponse> paymentDtos = inv.getPayments().stream().map(p -> InvoicePaymentResponse.builder()
                .id(p.getId())
                .paymentMode(p.getPaymentMode())
                .amount(p.getAmount())
                .referenceNumber(p.getReferenceNumber())
                .createdAt(p.getCreatedAt())
                .build()
        ).collect(Collectors.toList());

        return InvoiceResponse.builder()
                .id(inv.getId())
                .invoiceNumber(inv.getInvoiceNumber())
                .customerId(inv.getCustomer() != null ? inv.getCustomer().getId() : null)
                .customerName(inv.getCustomerName())
                .customerPhone(inv.getCustomerPhone())
                .cashierUserId(inv.getCashierUserId())
                .cashierName(inv.getCashierName())
                .subtotal(inv.getSubtotal())
                .itemDiscountTotal(inv.getItemDiscountTotal())
                .invoiceDiscountTotal(inv.getInvoiceDiscountTotal())
                .cgstTotal(inv.getCgstTotal())
                .sgstTotal(inv.getSgstTotal())
                .igstTotal(inv.getIgstTotal())
                .totalTax(inv.getTotalTax())
                .roundOff(inv.getRoundOff())
                .grandTotal(inv.getGrandTotal())
                .amountPaid(inv.getAmountPaid())
                .changeReturned(inv.getChangeReturned())
                .paymentStatus(inv.getPaymentStatus())
                .primaryPaymentMode(inv.getPrimaryPaymentMode())
                .status(inv.getStatus())
                .notes(inv.getNotes())
                .createdAt(inv.getCreatedAt())
                .items(itemDtos)
                .payments(paymentDtos)
                .build();
    }
}
