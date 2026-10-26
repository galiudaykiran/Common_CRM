package com.commoncrm.platform.module.reports.controller;

import com.commoncrm.platform.common.api.ApiResponse;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.reports.dto.BusinessReportsDto.*;
import com.commoncrm.platform.module.reports.service.BusinessReportsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/shop/reports")
public class BusinessReportsController {

    private final BusinessReportsService reportsService;

    public BusinessReportsController(BusinessReportsService reportsService) {
        this.reportsService = reportsService;
    }

    @GetMapping("/financial-summary")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER')")
    public ResponseEntity<ApiResponse<FinancialSummaryResponse>> getFinancialSummary(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        FinancialSummaryResponse response = reportsService.getFinancialSummary(principal, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response, "Financial summary calculated successfully"));
    }

    @GetMapping("/daily-trends")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER')")
    public ResponseEntity<ApiResponse<List<DailyTrendPoint>>> getDailyTrends(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<DailyTrendPoint> response = reportsService.getDailyTrends(principal, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response, "Daily trends retrieved"));
    }

    @GetMapping("/product-profitability")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER')")
    public ResponseEntity<ApiResponse<List<ProductProfitabilityStat>>> getProductProfitability(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "10") int limit) {
        List<ProductProfitabilityStat> response = reportsService.getProductProfitability(principal, startDate, endDate, limit);
        return ResponseEntity.ok(ApiResponse.success(response, "Top profitable products"));
    }

    @GetMapping("/payment-modes")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER')")
    public ResponseEntity<ApiResponse<List<PaymentModeStat>>> getPaymentModes(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<PaymentModeStat> response = reportsService.getPaymentModeBreakdown(principal, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment mode breakdown"));
    }

    @GetMapping("/slow-moving-stock")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER')")
    public ResponseEntity<ApiResponse<List<SlowMovingStockStat>>> getSlowMovingStock(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "10") int limit) {
        List<SlowMovingStockStat> response = reportsService.getSlowMovingStock(principal, limit);
        return ResponseEntity.ok(ApiResponse.success(response, "Capital tied in slow-moving inventory"));
    }

    @GetMapping("/tax-summary")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER')")
    public ResponseEntity<ApiResponse<TaxGstSummaryResponse>> getTaxSummary(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        TaxGstSummaryResponse response = reportsService.getTaxGstSummary(principal, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response, "GST tax summary"));
    }
}
