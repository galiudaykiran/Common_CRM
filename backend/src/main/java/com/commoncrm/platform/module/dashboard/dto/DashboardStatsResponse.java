package com.commoncrm.platform.module.dashboard.dto;

import com.commoncrm.platform.common.audit.dto.AuditLogResponse;
import com.commoncrm.platform.module.shop.dto.ShopSummaryResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse implements Serializable {

    private long totalShops;
    private long activeShops;
    private long inactiveShops;
    private long totalTenants;
    private long activeTenants;
    private long totalUsers;
    private long activeUsers;
    private long businessTypesCount;

    private List<ShopSummaryResponse> recentShops;
    private List<AuditLogResponse> recentActivity;
}
