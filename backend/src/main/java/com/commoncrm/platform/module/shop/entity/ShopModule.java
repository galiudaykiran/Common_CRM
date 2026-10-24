package com.commoncrm.platform.module.shop.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "shop_modules", uniqueConstraints = {
        @UniqueConstraint(name = "uk_shop_module", columnNames = {"shop_id", "module_id"})
}, indexes = {
        @Index(name = "idx_sm_shop_id", columnList = "shop_id"),
        @Index(name = "idx_sm_enabled", columnList = "enabled")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopModule extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false, foreignKey = @ForeignKey(name = "fk_sm_shop"))
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "module_id", nullable = false, foreignKey = @ForeignKey(name = "fk_sm_module"))
    private Module module;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Lob
    @Column(name = "module_settings", columnDefinition = "TEXT")
    private String moduleSettings;

    @Column(name = "enabled_at", nullable = false)
    @Builder.Default
    private Instant enabledAt = Instant.now();
}
