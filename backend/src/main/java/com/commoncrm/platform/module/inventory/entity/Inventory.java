package com.commoncrm.platform.module.inventory.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import com.commoncrm.platform.module.shop.entity.Shop;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "inventories", uniqueConstraints = {
        @UniqueConstraint(name = "uk_shop_product_inventory", columnNames = {"tenant_id", "shop_id", "product_id"})
}, indexes = {
        @Index(name = "idx_inv_tenant_shop", columnList = "tenant_id, shop_id"),
        @Index(name = "idx_inv_product", columnList = "product_id"),
        @Index(name = "idx_inv_current_stock", columnList = "shop_id, current_stock")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false, foreignKey = @ForeignKey(name = "fk_inventory_shop"))
    private Shop shop;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, foreignKey = @ForeignKey(name = "fk_inventory_product"))
    private Product product;

    @Column(name = "current_stock", nullable = false, precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal currentStock = BigDecimal.ZERO;

    @Column(name = "reserved_stock", nullable = false, precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal reservedStock = BigDecimal.ZERO;

    @Column(name = "bin_location", length = 60)
    private String binLocation;

    @Column(name = "last_restocked_at")
    private Instant lastRestockedAt;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Long version = 0L;

    public BigDecimal getAvailableStock() {
        BigDecimal current = currentStock != null ? currentStock : BigDecimal.ZERO;
        BigDecimal reserved = reservedStock != null ? reservedStock : BigDecimal.ZERO;
        BigDecimal available = current.subtract(reserved);
        return available.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : available;
    }
}
