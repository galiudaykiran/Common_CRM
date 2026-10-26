package com.commoncrm.platform.module.reports.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import com.commoncrm.platform.module.shop.entity.Shop;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "shop_expenses", indexes = {
        @Index(name = "idx_expense_shop_date", columnList = "shop_id, expense_date"),
        @Index(name = "idx_expense_category", columnList = "shop_id, category")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopExpense extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @Column(nullable = false, length = 60)
    private String category; // RENT, UTILITIES, STAFF_WAGES, MAINTENANCE, PACKAGING, TRANSPORT, MISCELLANEOUS

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Column(name = "payment_mode", length = 30)
    private String paymentMode; // CASH, UPI, BANK_TRANSFER, CARD

    @Column(name = "receipt_reference", length = 100)
    private String receiptReference;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(name = "created_by_name", length = 100)
    private String createdByName;
}
