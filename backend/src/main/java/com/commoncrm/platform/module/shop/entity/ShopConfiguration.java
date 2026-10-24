package com.commoncrm.platform.module.shop.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "shop_configurations", uniqueConstraints = {
        @UniqueConstraint(name = "uk_shop_config_shop", columnNames = "shop_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopConfiguration extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false, foreignKey = @ForeignKey(name = "fk_shop_config_shop"))
    private Shop shop;

    @Column(name = "tax_number", length = 50)
    private String taxNumber;

    @Column(name = "default_tax_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal defaultTaxRate = BigDecimal.ZERO;

    @Column(name = "invoice_prefix", length = 20)
    @Builder.Default
    private String invoicePrefix = "INV-";

    @Lob
    @Column(name = "settings_json", columnDefinition = "TEXT")
    private String settingsJson;
}
