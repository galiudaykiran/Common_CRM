package com.commoncrm.platform.module.shop.controller;

import com.commoncrm.platform.common.api.ApiResponse;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.shop.dto.AlertSettingsDto;
import com.commoncrm.platform.module.shop.dto.StoreAlertResponse;
import com.commoncrm.platform.module.shop.service.ShopNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Store Alerts & Notifications", description = "Real-time store alert notifications, rule engine, and threshold configuration")
public class ShopNotificationController {

    private final ShopNotificationService notificationService;

    public ShopNotificationController(ShopNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    @Operation(summary = "Fetch active non-dismissed store alert notifications")
    public ResponseEntity<ApiResponse<List<StoreAlertResponse>>> getActiveAlerts(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<StoreAlertResponse> response = notificationService.getActiveAlerts(principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Active store alerts retrieved"));
    }

    @PostMapping("/{alertKey}/dismiss")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    @Operation(summary = "Permanently dismiss a store alert notification")
    public ResponseEntity<ApiResponse<Void>> dismissAlert(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String alertKey) {
        notificationService.dismissAlert(principal, alertKey);
        return ResponseEntity.ok(ApiResponse.success(null, "Alert dismissed permanently"));
    }

    @PostMapping("/dismiss-all")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    @Operation(summary = "Dismiss all active store alert notifications")
    public ResponseEntity<ApiResponse<Void>> dismissAllAlerts(
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.dismissAll(principal);
        return ResponseEntity.ok(ApiResponse.success(null, "All alerts dismissed"));
    }

    @PatchMapping("/{alertKey}/read")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String alertKey) {
        notificationService.markAsRead(principal, alertKey);
        return ResponseEntity.ok(ApiResponse.success(null, "Alert marked as read"));
    }

    @PatchMapping("/read-all")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal);
        return ResponseEntity.ok(ApiResponse.success(null, "All alerts marked as read"));
    }

    @GetMapping("/settings")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    @Operation(summary = "Get configured store alert rules and thresholds")
    public ResponseEntity<ApiResponse<AlertSettingsDto>> getAlertSettings(
            @AuthenticationPrincipal UserPrincipal principal) {
        AlertSettingsDto response = notificationService.getAlertSettings(principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Alert settings retrieved"));
    }

    @PutMapping("/settings")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER')")
    @Operation(summary = "Save store alert rules and thresholds configured by shop holder")
    public ResponseEntity<ApiResponse<AlertSettingsDto>> updateAlertSettings(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody AlertSettingsDto request) {
        AlertSettingsDto response = notificationService.updateAlertSettings(principal, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Alert settings saved successfully"));
    }
}
