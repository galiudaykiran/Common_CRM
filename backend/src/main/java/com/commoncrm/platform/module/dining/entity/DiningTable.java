package com.commoncrm.platform.module.dining.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import com.commoncrm.platform.module.shop.entity.Shop;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "dining_tables", uniqueConstraints = {
        @UniqueConstraint(name = "uk_table_shop_number", columnNames = {"shop_id", "table_number"})
}, indexes = {
        @Index(name = "idx_dining_table_shop", columnList = "shop_id"),
        @Index(name = "idx_dining_table_status", columnList = "shop_id, status"),
        @Index(name = "idx_dining_table_qr", columnList = "qr_code_token", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiningTable extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false, foreignKey = @ForeignKey(name = "fk_dining_table_shop"))
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "area_id", foreignKey = @ForeignKey(name = "fk_dining_table_area"))
    private DiningArea area;

    @Column(name = "table_number", nullable = false, length = 50)
    private String tableNumber;

    @Column(name = "seating_capacity", nullable = false)
    @Builder.Default
    private Integer seatingCapacity = 4;

    /**
     * AVAILABLE, OCCUPIED, RESERVED, BILL_REQUESTED, CLEANING, OUT_OF_SERVICE
     */
    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "AVAILABLE";

    @Column(name = "qr_code_token", nullable = false, unique = true, length = 64)
    private String qrCodeToken;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
