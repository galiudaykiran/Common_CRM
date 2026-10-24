package com.commoncrm.platform.module.shop.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import com.commoncrm.platform.module.businesstype.entity.BusinessType;
import com.commoncrm.platform.module.tenant.entity.Tenant;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "shops", uniqueConstraints = {
        @UniqueConstraint(name = "uk_tenant_shop_code", columnNames = {"tenant_id", "code"})
}, indexes = {
        @Index(name = "idx_shop_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_shop_status", columnList = "status"),
        @Index(name = "idx_shop_business_type", columnList = "business_type_id"),
        @Index(name = "idx_shop_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shop extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false, foreignKey = @ForeignKey(name = "fk_shop_tenant"))
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_type_id", nullable = false, foreignKey = @ForeignKey(name = "fk_shop_business_type"))
    private BusinessType businessType;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 20)
    private String phone;

    @Column(length = 120)
    private String email;

    @Column(length = 255)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, SUSPENDED

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String timezone = "Asia/Kolkata";

    @Version
    @Column(name = "version", nullable = false)
    private Integer version;

    @OneToOne(mappedBy = "shop", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private ShopConfiguration configuration;

    @OneToMany(mappedBy = "shop", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<ShopModule> modules = new HashSet<>();
}
