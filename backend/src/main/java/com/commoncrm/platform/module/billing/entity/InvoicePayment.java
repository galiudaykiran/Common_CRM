package com.commoncrm.platform.module.billing.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "invoice_payments", indexes = {
        @Index(name = "idx_payment_invoice", columnList = "invoice_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoicePayment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false, foreignKey = @ForeignKey(name = "fk_payment_invoice"))
    private Invoice invoice;

    /**
     * CASH, UPI, CARD, STORE_CREDIT
     */
    @Column(name = "payment_mode", nullable = false, length = 30)
    private String paymentMode;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber; // e.g., UPI txn ID, Card authorization code
}
