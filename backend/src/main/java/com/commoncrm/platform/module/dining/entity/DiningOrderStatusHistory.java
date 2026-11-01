package com.commoncrm.platform.module.dining.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "dining_order_status_history", indexes = {
        @Index(name = "idx_hist_order", columnList = "order_id"),
        @Index(name = "idx_hist_item", columnList = "order_item_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiningOrderStatusHistory extends BaseEntity {

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "order_item_id")
    private Long orderItemId;

    @Column(name = "previous_status", length = 30)
    private String previousStatus;

    @Column(name = "new_status", nullable = false, length = 30)
    private String newStatus;

    @Column(name = "changed_by_username", length = 100)
    private String changedByUsername;

    @Column(length = 255)
    private String remarks;
}
