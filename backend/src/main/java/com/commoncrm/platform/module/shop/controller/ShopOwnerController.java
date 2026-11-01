package com.commoncrm.platform.module.shop.controller;

import com.commoncrm.platform.common.api.ApiResponse;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.shop.dto.ShopDetailResponse;
import com.commoncrm.platform.module.shop.dto.ShopOwnerDashboardResponse;
import com.commoncrm.platform.module.shop.dto.UpdateShopOwnerProfileRequest;
import com.commoncrm.platform.module.shop.service.ShopOwnerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/shop")
@Tag(name = "Shop Operations", description = "Shop holder operational dashboard, profile, and business operations")
public class ShopOwnerController {

    private final ShopOwnerService shopOwnerService;

    public ShopOwnerController(ShopOwnerService shopOwnerService) {
        this.shopOwnerService = shopOwnerService;
    }

    @GetMapping("/info")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'SHOP_EMPLOYEE')")
    @Operation(summary = "Get basic store branding and enabled module codes for store staff")
    public ResponseEntity<ApiResponse<com.commoncrm.platform.module.shop.dto.ShopBasicInfoResponse>> getBasicInfo(
            @AuthenticationPrincipal UserPrincipal principal) {
        com.commoncrm.platform.module.shop.dto.ShopBasicInfoResponse response = shopOwnerService.getBasicInfo(principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Store basic info retrieved successfully"));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('SHOP_OWNER') or hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Get aggregated dashboard, active modules, and KPIs for current store")
    public ResponseEntity<ApiResponse<ShopOwnerDashboardResponse>> getDashboard(
            @AuthenticationPrincipal UserPrincipal principal) {
        ShopOwnerDashboardResponse response = shopOwnerService.getDashboard(principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Store dashboard loaded successfully"));
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasRole('SHOP_OWNER') or hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Get paginated audit trail for current store")
    public ResponseEntity<ApiResponse<com.commoncrm.platform.common.api.PageResponse<com.commoncrm.platform.common.audit.dto.AuditLogResponse>>> getStoreAuditLogs(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String actorUsername,
            @org.springframework.data.web.PageableDefault(size = 10, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) org.springframework.data.domain.Pageable pageable) {
        com.commoncrm.platform.common.api.PageResponse<com.commoncrm.platform.common.audit.dto.AuditLogResponse> response =
                shopOwnerService.getStoreAuditLogs(principal, action, resourceType, actorUsername, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Store audit logs loaded successfully"));
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('SHOP_OWNER') or hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Get current store profile, business configuration, and active modules")
    public ResponseEntity<ApiResponse<ShopDetailResponse>> getProfile(
            @AuthenticationPrincipal UserPrincipal principal) {
        ShopDetailResponse response = shopOwnerService.getProfile(principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Store profile retrieved successfully"));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasAuthority('PERM_SHOP_UPDATE') or hasRole('SHOP_OWNER')")
    @Operation(summary = "Update store contact details, tax info, and invoice settings")
    public ResponseEntity<ApiResponse<ShopDetailResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateShopOwnerProfileRequest request) {
        ShopDetailResponse response = shopOwnerService.updateProfile(principal, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Store profile updated successfully"));
    }
}
