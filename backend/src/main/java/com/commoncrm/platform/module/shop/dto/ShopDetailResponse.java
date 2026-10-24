package com.commoncrm.platform.module.shop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopDetailResponse {
    private Long id;
    private String code;
    private String name;
    private Long tenantId;
    private String tenantName;
    private String tenantCode;
    private Long businessTypeId;
    private String businessTypeCode;
    private String businessTypeName;
    private String phone;
    private String email;
    private String address;
    private String city;
    private String state;
    private String postalCode;
    private String status;
    private String currency;
    private String timezone;
    private Integer version;
    private Instant createdAt;
    private Instant updatedAt;

    // Shop Holder / Owner Details
    private ShopOwnerDto owner;

    // Configuration
    private ShopConfigDto configuration;

    // Modules
    private List<ShopModuleDto> modules;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShopOwnerDto {
        private Long userId;
        private String username;
        private String fullName;
        private String email;
        private String phone;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShopConfigDto {
        private String taxNumber;
        private BigDecimal defaultTaxRate;
        private String invoicePrefix;
        private String settingsJson;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShopModuleDto {
        private Long moduleId;
        private String moduleCode;
        private String moduleName;
        private boolean enabled;
    }
}
