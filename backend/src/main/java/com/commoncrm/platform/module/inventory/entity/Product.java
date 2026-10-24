package com.commoncrm.platform.module.inventory.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import com.commoncrm.platform.module.shop.entity.Shop;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "products", uniqueConstraints = {
        @UniqueConstraint(name = "uk_shop_product_sku", columnNames = {"tenant_id", "shop_id", "sku"}),
        @UniqueConstraint(name = "uk_shop_product_barcode", columnNames = {"tenant_id", "shop_id", "barcode"})
}, indexes = {
        @Index(name = "idx_prod_tenant_shop", columnList = "tenant_id, shop_id"),
        @Index(name = "idx_prod_shop_cat", columnList = "shop_id, category_id"),
        @Index(name = "idx_prod_shop_status", columnList = "shop_id, status"),
        @Index(name = "idx_prod_barcode", columnList = "barcode"),
        @Index(name = "idx_prod_sku", columnList = "sku"),
        @Index(name = "idx_prod_name", columnList = "name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false, foreignKey = @ForeignKey(name = "fk_product_shop"))
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", foreignKey = @ForeignKey(name = "fk_product_category"))
    private Category category;

    @Column(nullable = false, length = 180)
    private String name;

    @Column(nullable = false, length = 80)
    private String sku;

    @Column(length = 100)
    private String barcode;

    @Column(name = "hsn_sac_code", length = 40)
    private String hsnSacCode;

    @Column(name = "unit_of_measure", nullable = false, length = 30)
    @Builder.Default
    private String unitOfMeasure = "PCS"; // PCS, KG, LTR, BOX, METER, PACK

    @Column(name = "cost_price", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal costPrice = BigDecimal.ZERO;

    @Column(name = "selling_price", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal sellingPrice = BigDecimal.ZERO;

    @Column(name = "mrp", precision = 15, scale = 2)
    private BigDecimal mrp;

    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxRate = BigDecimal.ZERO; // e.g. 0.00, 5.00, 12.00, 18.00, 28.00

    @Column(name = "tax_inclusive", nullable = false)
    @Builder.Default
    private Boolean taxInclusive = false;

    @Column(name = "reorder_level", nullable = false)
    @Builder.Default
    private Integer reorderLevel = 10;

    @Column(name = "safety_stock", nullable = false)
    @Builder.Default
    private Integer safetyStock = 5;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, DISCONTINUED

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(length = 1000)
    private String description;
}
