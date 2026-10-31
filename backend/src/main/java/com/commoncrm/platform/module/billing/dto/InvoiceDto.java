package com.commoncrm.platform.module.billing.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class InvoiceDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateInvoiceItemRequest {
        @NotNull(message = "Product ID is required")
        private Long productId;

        @NotNull(message = "Quantity is required")
        @DecimalMin(value = "0.001", message = "Quantity must be greater than zero")
        private BigDecimal quantity;

        private BigDecimal unitPrice; // Optional override; defaults to product.sellingPrice

        private BigDecimal discountAmount; // Optional line discount
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateInvoicePaymentRequest {
        @NotNull(message = "Payment mode is required")
        private String paymentMode; // CASH, UPI, CARD, STORE_CREDIT

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        private BigDecimal amount;

        @JsonAlias({"transactionReference", "referenceNumber"})
        private String referenceNumber;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateInvoiceRequest {
        private Long customerId;
        private String customerName;
        private String customerPhone;

        @NotEmpty(message = "At least one item is required to generate a bill")
        @Builder.Default
        private List<CreateInvoiceItemRequest> items = new ArrayList<>();

        private BigDecimal invoiceDiscountTotal;

        @Builder.Default
        private List<CreateInvoicePaymentRequest> payments = new ArrayList<>();

        @JsonAlias({"paymentMode", "primaryPaymentMode"})
        @Builder.Default
        private String primaryPaymentMode = "CASH";

        private BigDecimal amountPaid;

        private String notes;

        @Builder.Default
        private boolean sendReceiptNotification = true;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvoiceItemResponse {
        private Long id;
        private Long productId;
        private String productName;
        private String sku;
        private String barcode;
        private String hsnSacCode;
        private String unitOfMeasure;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal unitCost;
        private BigDecimal discountAmount;
        private BigDecimal taxRate;
        private boolean taxInclusive;
        private BigDecimal cgstAmount;
        private BigDecimal sgstAmount;
        private BigDecimal igstAmount;
        private BigDecimal lineTotal;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvoicePaymentResponse {
        private Long id;
        private String paymentMode;
        private BigDecimal amount;
        private String referenceNumber;
        private Instant createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvoiceResponse {
        private Long id;
        private String invoiceNumber;
        private Long customerId;
        private String customerName;
        private String customerPhone;
        private Long cashierUserId;
        private String cashierName;
        private BigDecimal subtotal;
        private BigDecimal itemDiscountTotal;
        private BigDecimal invoiceDiscountTotal;
        private BigDecimal cgstTotal;
        private BigDecimal sgstTotal;
        private BigDecimal igstTotal;
        private BigDecimal totalTax;
        private BigDecimal roundOff;
        private BigDecimal grandTotal;
        private BigDecimal amountPaid;
        private BigDecimal changeReturned;
        private String paymentStatus;
        private String primaryPaymentMode;
        private String status;
        private String notes;
        private Instant createdAt;

        @Builder.Default
        private List<InvoiceItemResponse> items = new ArrayList<>();

        @Builder.Default
        private List<InvoicePaymentResponse> payments = new ArrayList<>();
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ThermalReceiptResponse {
        // Store Details
        private String storeName;
        private String storeCode;
        private String storeAddress;
        private String storePhone;
        private String storeEmail;
        private String storeGstin;
        private String storeState;

        // Bill Header
        private String invoiceNumber;
        private String dateFormatted;
        private String timeFormatted;
        private String cashierName;

        // Customer
        private String customerName;
        private String customerPhone;

        // Items
        @Builder.Default
        private List<ThermalItem> items = new ArrayList<>();

        // Math
        private BigDecimal subtotal;
        private BigDecimal discountTotal;
        private BigDecimal cgstTotal;
        private BigDecimal sgstTotal;
        private BigDecimal igstTotal;
        private BigDecimal totalTax;
        private BigDecimal roundOff;
        private BigDecimal grandTotal;
        private BigDecimal amountPaid;
        private BigDecimal changeReturned;
        private String paymentMode;

        // Footer
        private String returnPolicyText;
        private String footerThankYou;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ThermalItem {
        private String name;
        private String sku;
        private String hsnSacCode;
        private BigDecimal quantity;
        private String unitOfMeasure;
        private BigDecimal rate;
        private BigDecimal taxRate;
        private BigDecimal discount;
        private BigDecimal lineTotal;
    }
}
