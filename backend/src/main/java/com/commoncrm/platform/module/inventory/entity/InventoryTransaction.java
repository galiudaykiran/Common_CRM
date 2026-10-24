package com.commoncrm.platform.module.inventory.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import com.commoncrm.platform.module.shop.entity.Shop;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "inventory_transactions", indexes = {
        @Index(name = "idx_tx_tenant_shop", columnList = "tenant_id, shop_id"),
        @Index(name = "idx_tx_product_time", columnList = "shop_id, product_id, created_at"),
        @Index(name = "idx_tx_type", columnList = "shop_id, transaction_type"),
        @Index(name = "idx_tx_reference", columnList = "reference_type, reference_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTransaction extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false, foreignKey = @ForeignKey(name = "fk_tx_shop"))
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inventory_id", nullable = false, foreignKey = @ForeignKey(name = "fk_tx_inventory"))
    private Inventory inventory;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, foreignKey = @ForeignKey(name = "fk_tx_product"))
    private Product product;

    /**
     * OPENING_STOCK, PURCHASE_RECEIPT, SALE_DEDUCTION, RETURN_RESTOCK,
     * MANUAL_ADJUSTMENT, DAMAGE_WRITE_OFF, THEFT_SHRINKAGE
     */
    @Column(name = "transaction_type", nullable = false, length = 50)
    private String transactionType;

    @Column(name = "reference_type", length = 50)
    private String referenceType; // INVOICE, SALE_ORDER, PURCHASE_ORDER, AUDIT_COUNT

    @Column(name = "reference_id", length = 100)
    private String referenceId; // e.g., INV-10023, PO-9941, AUDIT-2026-10

    @Column(name = "quantity_delta", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantityDelta;

    @Column(name = "quantity_before", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantityBefore;

    @Column(name = "quantity_after", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantityAfter;

    @Column(name = "unit_cost", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal unitCost = BigDecimal.ZERO;

    @Column(name = "total_valuation", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalValuation = BigDecimal.ZERO;

    @Column(length = 255)
    private String notes;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;
}
