package com.commoncrm.platform.module.dining.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import com.commoncrm.platform.module.shop.entity.Shop;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "dining_orders", indexes = {
        @Index(name = "idx_order_session", columnList = "session_id"),
        @Index(name = "idx_order_shop_status", columnList = "shop_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiningOrder extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false, foreignKey = @ForeignKey(name = "fk_dining_order_shop"))
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false, foreignKey = @ForeignKey(name = "fk_dining_order_session"))
    private DiningSession session;

    @Column(name = "order_number", nullable = false, length = 60)
    private String orderNumber;

    @Column(length = 255)
    private String notes;

    /**
     * PLACED, ACCEPTED, PREPARING, READY, SERVED, COMPLETED, CANCELLED
     */
    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PLACED";

    @Column(name = "placed_at", nullable = false)
    @Builder.Default
    private Instant placedAt = Instant.now();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @org.hibernate.annotations.BatchSize(size = 30)
    @Builder.Default
    private List<DiningOrderItem> items = new ArrayList<>();
}
