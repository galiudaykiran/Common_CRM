package com.commoncrm.platform.module.shop.dto;

import com.commoncrm.platform.common.audit.dto.AuditLogResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopOwnerDashboardResponse {
    private Long shopId;
    private String shopName;
    private String shopCode;
    private Long tenantId;
    private String tenantName;
    private String address;
    private String city;
    private String state;
    private String postalCode;
    private String phone;
    private String email;
    private String currency;
    private String timezone;
    private String status;

    private Long businessTypeId;
    private String businessTypeCode;
    private String businessTypeName;

    private List<String> enabledModuleCodes;
    private List<ModuleDto> modules;

    private ShopStatsDto stats;
    private List<AuditLogResponse> recentActivity;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModuleDto {
        private Long moduleId;
        private String code;
        private String name;
        private String description;
        private boolean core;
        private boolean enabled;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShopStatsDto {
        private long todaySalesCount;
        private BigDecimal todayRevenue;
        private BigDecimal yesterdayRevenue;
        private Double revenueGrowthPercent;
        private long totalProducts;
        private long lowStockCount;
        private long activeEmployees;
        private long activeCustomers;
        private long pendingOrders;
    }
}
