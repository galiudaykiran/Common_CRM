package com.commoncrm.platform.module.billing.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import com.commoncrm.platform.module.shop.entity.Shop;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "customer_notification_schedules", indexes = {
        @Index(name = "idx_notif_shop_due", columnList = "shop_id, is_active, next_run_date"),
        @Index(name = "idx_notif_customer", columnList = "customer_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerNotificationSchedule extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false, foreignKey = @ForeignKey(name = "fk_notif_shop"))
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false, foreignKey = @ForeignKey(name = "fk_notif_cust"))
    private Customer customer;

    @Column(nullable = false, length = 150)
    private String title;

    /**
     * SAME_DAY_MONTHLY, CUSTOM_INTERVAL, ONE_TIME
     */
    @Column(name = "schedule_type", nullable = false, length = 50)
    @Builder.Default
    private String scheduleType = "SAME_DAY_MONTHLY";

    /**
     * 1 to 31 - Day of the month to send reminder (e.g., 5th of every month)
     */
    @Column(name = "day_of_month", nullable = false)
    private int dayOfMonth;

    /**
     * SMS, WHATSAPP, EMAIL
     */
    @Column(nullable = false, length = 30)
    @Builder.Default
    private String channel = "SMS";

    @Column(name = "message_template", nullable = false, length = 1000)
    private String messageTemplate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "created_by_user_id", nullable = false)
    private Long createdByUserId;

    @Column(name = "created_by_name", length = 100)
    private String createdByName;

    @Column(name = "last_sent_at")
    private Instant lastSentAt;

    @Column(name = "next_run_date", nullable = false)
    private LocalDate nextRunDate;
}
