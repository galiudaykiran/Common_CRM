package com.commoncrm.platform.module.dining.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import com.commoncrm.platform.module.shop.entity.Shop;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "dining_payments", indexes = {
        @Index(name = "idx_pay_bill", columnList = "bill_id"),
        @Index(name = "idx_pay_shop", columnList = "shop_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiningPayment extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false, foreignKey = @ForeignKey(name = "fk_dining_pay_shop"))
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bill_id", nullable = false, foreignKey = @ForeignKey(name = "fk_dining_pay_bill"))
    private DiningBill bill;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal amount = BigDecimal.ZERO;

    /**
     * CASH, UPI, CARD, OTHER
     */
    @Column(name = "payment_mode", nullable = false, length = 30)
    @Builder.Default
    private String paymentMode = "CASH";

    @Column(name = "transaction_reference", length = 100)
    private String transactionReference;

    @Column(name = "recorded_by_username", length = 100)
    private String recordedByUsername;
}
