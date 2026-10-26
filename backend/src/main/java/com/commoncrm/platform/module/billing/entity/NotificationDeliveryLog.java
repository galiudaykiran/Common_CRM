package com.commoncrm.platform.module.billing.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import com.commoncrm.platform.module.shop.entity.Shop;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notification_delivery_logs", indexes = {
        @Index(name = "idx_notif_log_shop", columnList = "shop_id, created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDeliveryLog extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false, foreignKey = @ForeignKey(name = "fk_notif_log_shop"))
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", foreignKey = @ForeignKey(name = "fk_notif_log_cust"))
    private Customer customer;

    /**
     * BILL_RECEIPT, MONTHLY_REMINDER, PROMOTIONAL
     */
    @Column(name = "notification_type", nullable = false, length = 50)
    private String notificationType;

    @Column(name = "reference_invoice_number", length = 60)
    private String referenceInvoiceNumber;

    @Column(name = "recipient_phone", length = 20)
    private String recipientPhone;

    @Column(name = "recipient_email", length = 150)
    private String recipientEmail;

    @Column(nullable = false, length = 30)
    private String channel; // SMS, WHATSAPP, EMAIL

    @Column(name = "message_content", nullable = false, length = 1000)
    private String messageContent;

    /**
     * SENT, FAILED, PENDING
     */
    @Column(name = "delivery_status", nullable = false, length = 30)
    @Builder.Default
    private String deliveryStatus = "SENT";

    @Column(name = "failure_reason", length = 255)
    private String failureReason;
}
