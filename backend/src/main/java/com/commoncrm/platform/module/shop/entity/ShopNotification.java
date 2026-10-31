package com.commoncrm.platform.module.shop.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "shop_notifications", uniqueConstraints = {
        @UniqueConstraint(name = "uk_shop_notif_key", columnNames = {"tenant_id", "shop_id", "alert_key"})
}, indexes = {
        @Index(name = "idx_shop_notif_shop", columnList = "tenant_id, shop_id, dismissed"),
        @Index(name = "idx_shop_notif_read", columnList = "shop_id, is_read")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopNotification extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false, foreignKey = @ForeignKey(name = "fk_shop_notification_shop"))
    private Shop shop;

    @Column(name = "alert_key", nullable = false, length = 120)
    private String alertKey; // e.g. "low-stock-42", "damage-high-2026-10-31", "closing-reminder-2026-10-31"

    @Column(name = "alert_type", nullable = false, length = 50)
    private String alertType; // "LOW_STOCK", "DAMAGE_WARNING", "DAILY_CLOSING_REMINDER", "REVENUE_TARGET", "GENERAL"

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "message", nullable = false, length = 1000)
    private String message;

    @Column(name = "severity", nullable = false, length = 20)
    @Builder.Default
    private String severity = "info"; // "critical", "warning", "info"

    @Column(name = "action_label", length = 60)
    private String actionLabel;

    @Column(name = "action_url", length = 255)
    private String actionUrl;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean read = false;

    @Column(name = "dismissed", nullable = false)
    @Builder.Default
    private boolean dismissed = false;

    @Column(name = "dismissed_at")
    private Instant dismissedAt;
}
