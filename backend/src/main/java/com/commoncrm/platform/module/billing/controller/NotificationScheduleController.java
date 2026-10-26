package com.commoncrm.platform.module.billing.controller;

import com.commoncrm.platform.common.api.ApiResponse;
import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.billing.dto.NotificationDto.*;
import com.commoncrm.platform.module.billing.service.NotificationScheduleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/shop/notifications")
public class NotificationScheduleController {

    private final NotificationScheduleService scheduleService;

    public NotificationScheduleController(NotificationScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @PostMapping("/schedules")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    public ResponseEntity<ApiResponse<ScheduleResponse>> createSchedule(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateScheduleRequest request) {
        ScheduleResponse response = scheduleService.createSchedule(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Notification schedule created"));
    }

    @GetMapping("/schedules")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    public ResponseEntity<ApiResponse<PageResponse<ScheduleResponse>>> getSchedules(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        PageResponse<ScheduleResponse> response = scheduleService.getSchedules(principal, page, size);
        return ResponseEntity.ok(ApiResponse.success(response, "Scheduled notifications"));
    }

    @PatchMapping("/schedules/{id}/toggle")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    public ResponseEntity<ApiResponse<ScheduleResponse>> toggleSchedule(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        ScheduleResponse response = scheduleService.toggleSchedule(principal, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Schedule active status updated"));
    }

    @DeleteMapping("/schedules/{id}")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        scheduleService.deleteSchedule(principal, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Schedule deleted successfully"));
    }

    @PostMapping("/schedules/trigger-now")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    public ResponseEntity<ApiResponse<Integer>> triggerNow(
            @AuthenticationPrincipal UserPrincipal principal) {
        int count = scheduleService.triggerDueSchedulesNow(principal);
        return ResponseEntity.ok(ApiResponse.success(count, "Dispatched " + count + " due customer notifications"));
    }

    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    public ResponseEntity<ApiResponse<PageResponse<DeliveryLogResponse>>> getDeliveryLogs(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<DeliveryLogResponse> response = scheduleService.getDeliveryLogs(principal, page, size);
        return ResponseEntity.ok(ApiResponse.success(response, "Notification delivery logs"));
    }
}
