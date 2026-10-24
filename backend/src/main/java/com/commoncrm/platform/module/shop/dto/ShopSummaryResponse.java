package com.commoncrm.platform.module.shop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopSummaryResponse {
    private Long id;
    private String code;
    private String name;
    private Long tenantId;
    private String tenantName;
    private Long businessTypeId;
    private String businessTypeCode;
    private String businessTypeName;
    private String phone;
    private String email;
    private String city;
    private String status;
    private String currency;
    private String ownerFullName;
    private String ownerUsername;
    private Instant createdAt;
}
