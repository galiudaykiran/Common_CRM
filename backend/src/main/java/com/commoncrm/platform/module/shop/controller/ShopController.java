package com.commoncrm.platform.module.shop.controller;

import com.commoncrm.platform.common.api.ApiResponse;
import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.module.shop.dto.CreateShopRequest;
import com.commoncrm.platform.module.shop.dto.ResetOwnerPasswordRequest;
import com.commoncrm.platform.module.shop.dto.ShopDetailResponse;
import com.commoncrm.platform.module.shop.dto.ShopSummaryResponse;
import com.commoncrm.platform.module.shop.dto.UpdateShopOwnerRequest;
import com.commoncrm.platform.module.shop.dto.UpdateShopProfileRequest;
import com.commoncrm.platform.module.shop.service.ShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/shops")
@Tag(name = "Shops", description = "Shop onboarding, lifecycle, and configuration management")
public class ShopController {

    private final ShopService shopService;

    public ShopController(ShopService shopService) {
        this.shopService = shopService;
    }

    @GetMapping
    @Operation(summary = "Search and filter shops with pagination")
    public ResponseEntity<ApiResponse<PageResponse<ShopSummaryResponse>>> searchShops(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long businessTypeId,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<ShopSummaryResponse> response = shopService.searchShops(search, businessTypeId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Shops retrieved successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get full shop details including configuration and active modules")
    public ResponseEntity<ApiResponse<ShopDetailResponse>> getShopDetails(@PathVariable Long id) {
        ShopDetailResponse response = shopService.getShopDetails(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Shop details retrieved successfully"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_SHOP_CREATE') or hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Create and onboard a new shop with owner and modules")
    public ResponseEntity<ApiResponse<ShopDetailResponse>> createShop(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody CreateShopRequest request) {
        ShopDetailResponse response = shopService.createShop(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Shop created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Update shop profile, contact info, and physical address")
    public ResponseEntity<ApiResponse<ShopDetailResponse>> updateShopProfile(
            @PathVariable Long id,
            @Valid @RequestBody UpdateShopProfileRequest request) {
        ShopDetailResponse response = shopService.updateShopProfile(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Shop profile and address updated successfully"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('PERM_SHOP_STATUS') or hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Update shop operational status (ACTIVE, INACTIVE, SUSPENDED) with optional OTP verification")
    public ResponseEntity<ApiResponse<ShopDetailResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String otp) {
        ShopDetailResponse response = shopService.updateStatus(id, status, otp);
        return ResponseEntity.ok(ApiResponse.success(response, "Shop status updated successfully"));
    }

    @PostMapping("/{id}/owner/reset-password")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Reset password for shop owner with OTP verification")
    public ResponseEntity<ApiResponse<ShopDetailResponse>> resetOwnerPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetOwnerPasswordRequest request) {
        ShopDetailResponse response = shopService.resetOwnerPassword(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Shop owner password reset successfully"));
    }

    @PutMapping("/{id}/owner")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Update or transfer shop ownership with OTP verification")
    public ResponseEntity<ApiResponse<ShopDetailResponse>> updateShopOwnership(
            @PathVariable Long id,
            @Valid @RequestBody UpdateShopOwnerRequest request) {
        ShopDetailResponse response = shopService.updateShopOwnership(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Shop ownership updated successfully"));
    }
}
