package com.commoncrm.platform.module.dashboard.service;

import com.commoncrm.platform.common.audit.service.AuditService;
import com.commoncrm.platform.module.businesstype.repository.BusinessTypeRepository;
import com.commoncrm.platform.module.dashboard.dto.DashboardStatsResponse;
import com.commoncrm.platform.module.shop.dto.ShopSummaryResponse;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.repository.ShopRepository;
import com.commoncrm.platform.module.tenant.repository.TenantRepository;
import com.commoncrm.platform.module.user.repository.UserRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final ShopRepository shopRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final BusinessTypeRepository businessTypeRepository;
    private final AuditService auditService;

    public DashboardService(
            ShopRepository shopRepository,
            TenantRepository tenantRepository,
            UserRepository userRepository,
            BusinessTypeRepository businessTypeRepository,
            AuditService auditService) {
        this.shopRepository = shopRepository;
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.businessTypeRepository = businessTypeRepository;
        this.auditService = auditService;
    }

    @Cacheable(value = "dashboardStats", key = "'summary'")
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        long totalShops = shopRepository.count();
        long activeShops = shopRepository.countByStatus("ACTIVE");
        long inactiveShops = totalShops - activeShops;

        long totalTenants = tenantRepository.count();
        long activeTenants = tenantRepository.countByStatus("ACTIVE");

        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus("ACTIVE");

        long businessTypesCount = businessTypeRepository.countByActiveTrue();

        List<Shop> recentShopEntities = shopRepository.findTop5ByOrderByCreatedAtDesc();
        List<ShopSummaryResponse> recentShops = recentShopEntities.stream()
                .map(this::mapToSummaryDto)
                .collect(Collectors.toList());

        var recentActivity = auditService.getRecentActivity();

        return DashboardStatsResponse.builder()
                .totalShops(totalShops)
                .activeShops(activeShops)
                .inactiveShops(inactiveShops)
                .totalTenants(totalTenants)
                .activeTenants(activeTenants)
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .businessTypesCount(businessTypesCount)
                .recentShops(recentShops)
                .recentActivity(recentActivity)
                .build();
    }

    private ShopSummaryResponse mapToSummaryDto(Shop shop) {
        String ownerFullName = null;
        String ownerUsername = null;
        if (shop.getTenant() != null) {
            var ownerOpt = userRepository.findFirstByTenantIdOrderByIdAsc(shop.getTenant().getId());
            if (ownerOpt.isPresent()) {
                ownerFullName = ownerOpt.get().getFullName();
                ownerUsername = ownerOpt.get().getUsername();
            }
        }

        return ShopSummaryResponse.builder()
                .id(shop.getId())
                .code(shop.getCode())
                .name(shop.getName())
                .tenantId(shop.getTenant().getId())
                .tenantName(shop.getTenant().getName())
                .businessTypeId(shop.getBusinessType().getId())
                .businessTypeCode(shop.getBusinessType().getCode())
                .businessTypeName(shop.getBusinessType().getName())
                .phone(shop.getPhone())
                .email(shop.getEmail())
                .city(shop.getCity())
                .status(shop.getStatus())
                .currency(shop.getCurrency())
                .ownerFullName(ownerFullName)
                .ownerUsername(ownerUsername)
                .createdAt(shop.getCreatedAt())
                .build();
    }
}
