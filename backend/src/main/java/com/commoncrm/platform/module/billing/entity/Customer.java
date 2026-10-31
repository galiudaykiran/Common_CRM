package com.commoncrm.platform.module.billing.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import com.commoncrm.platform.module.shop.entity.Shop;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "customers", indexes = {
        @Index(name = "idx_cust_shop_phone", columnList = "shop_id, phone"),
        @Index(name = "idx_cust_shop_name", columnList = "shop_id, name"),
        @Index(name = "idx_cust_tenant_shop", columnList = "tenant_id, shop_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false, foreignKey = @ForeignKey(name = "fk_cust_shop"))
    private Shop shop;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 150)
    private String email;

    @Column(length = 255)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 20)
    private String gstin;

    @Column(name = "total_spent", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalSpent = BigDecimal.ZERO;

    @Column(name = "credit_balance", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal creditBalance = BigDecimal.ZERO;
}
