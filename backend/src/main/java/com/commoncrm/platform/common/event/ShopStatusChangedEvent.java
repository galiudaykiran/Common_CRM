package com.commoncrm.platform.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ShopStatusChangedEvent extends PlatformEvent {

    private Long shopId;
    private String shopCode;
    private Long tenantId;
    private String oldStatus;
    private String newStatus;
    private String updatedBy;
}
