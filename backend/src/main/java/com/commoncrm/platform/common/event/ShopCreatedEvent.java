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
public class ShopCreatedEvent extends PlatformEvent {

    private Long shopId;
    private String shopCode;
    private String shopName;
    private Long tenantId;
    private String tenantCode;
    private Long ownerUserId;
    private String ownerUsername;
    private String ownerEmail;
    private String businessTypeCode;
}
