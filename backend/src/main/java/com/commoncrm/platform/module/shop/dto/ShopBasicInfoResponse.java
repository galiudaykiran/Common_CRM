package com.commoncrm.platform.module.shop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopBasicInfoResponse {
    private Long shopId;
    private String shopName;
    private String shopCode;
    private Long tenantId;
    private String tenantName;
    private String status;
    private List<String> enabledModuleCodes;
}
