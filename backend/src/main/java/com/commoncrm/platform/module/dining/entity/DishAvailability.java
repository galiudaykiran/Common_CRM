package com.commoncrm.platform.module.dining.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "dish_availabilities", indexes = {
        @Index(name = "idx_avail_dish", columnList = "dish_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DishAvailability extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dish_id", nullable = false, foreignKey = @ForeignKey(name = "fk_dish_avail_dish"))
    private Dish dish;

    /**
     * AVAILABLE, UNAVAILABLE, TEMP_UNAVAILABLE, OUT_OF_STOCK
     */
    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "AVAILABLE";

    @Column(length = 255)
    private String reason;

    @Column(name = "updated_by_user_id")
    private Long updatedByUserId;

    @Column(name = "updated_by_username", length = 100)
    private String updatedByUsername;

    @Column(name = "status_updated_at", nullable = false)
    @Builder.Default
    private Instant statusUpdatedAt = Instant.now();
}
