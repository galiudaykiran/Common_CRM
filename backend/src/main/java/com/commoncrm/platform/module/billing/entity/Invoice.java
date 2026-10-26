package com.commoncrm.platform.module.billing.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import com.commoncrm.platform.module.shop.entity.Shop;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoices", indexes = {
        @Index(name = "idx_inv_shop_date", columnList = "shop_id, created_at"),
        @Index(name = "idx_inv_tenant_shop", columnList = "tenant_id, shop_id"),
        @Index(name = "idx_inv_number", columnList = "invoice_number", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false, foreignKey = @ForeignKey(name = "fk_inv_shop"))
    private Shop shop;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 60)
    private String invoiceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", foreignKey = @ForeignKey(name = "fk_inv_customer"))
    private Customer customer;

    @Column(name = "customer_name", length = 150)
    private String customerName;

    @Column(name = "customer_phone", length = 20)
    private String customerPhone;

    @Column(name = "cashier_user_id", nullable = false)
    private Long cashierUserId;

    @Column(name = "cashier_name", nullable = false, length = 100)
    private String cashierName;

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "item_discount_total", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal itemDiscountTotal = BigDecimal.ZERO;

    @Column(name = "invoice_discount_total", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal invoiceDiscountTotal = BigDecimal.ZERO;

    @Column(name = "cgst_total", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal cgstTotal = BigDecimal.ZERO;

    @Column(name = "sgst_total", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal sgstTotal = BigDecimal.ZERO;

    @Column(name = "igst_total", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal igstTotal = BigDecimal.ZERO;

    @Column(name = "total_tax", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalTax = BigDecimal.ZERO;

    @Column(name = "round_off", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal roundOff = BigDecimal.ZERO;

    @Column(name = "grand_total", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal grandTotal = BigDecimal.ZERO;

    @Column(name = "amount_paid", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(name = "change_returned", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal changeReturned = BigDecimal.ZERO;

    /**
     * PAID, PARTIAL, UNPAID
     */
    @Column(name = "payment_status", nullable = false, length = 30)
    @Builder.Default
    private String paymentStatus = "PAID";

    /**
     * CASH, UPI, CARD, SPLIT
     */
    @Column(name = "primary_payment_mode", nullable = false, length = 30)
    @Builder.Default
    private String primaryPaymentMode = "CASH";

    /**
     * COMPLETED, VOIDED, REFUNDED
     */
    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "COMPLETED";

    @Column(length = 255)
    private String notes;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InvoicePayment> payments = new ArrayList<>();

    public void addItem(InvoiceItem item) {
        items.add(item);
        item.setInvoice(this);
    }

    public void addPayment(InvoicePayment payment) {
        payments.add(payment);
        payment.setInvoice(this);
    }
}
