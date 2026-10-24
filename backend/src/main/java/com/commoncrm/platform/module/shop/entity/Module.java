package com.commoncrm.platform.module.shop.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "modules", uniqueConstraints = {
        @UniqueConstraint(name = "uk_module_code", columnNames = "code")
}, indexes = {
        @Index(name = "idx_module_active", columnList = "active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Module extends BaseEntity {

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "core_module", nullable = false)
    @Builder.Default
    private boolean coreModule = false;
}
