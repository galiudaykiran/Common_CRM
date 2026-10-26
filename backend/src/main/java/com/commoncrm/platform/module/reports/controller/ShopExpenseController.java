package com.commoncrm.platform.module.reports.controller;

import com.commoncrm.platform.common.api.ApiResponse;
import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.reports.dto.ExpenseDto.*;
import com.commoncrm.platform.module.reports.service.ShopExpenseService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/shop/expenses")
public class ShopExpenseController {

    private final ShopExpenseService expenseService;

    public ShopExpenseController(ShopExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER')")
    public ResponseEntity<ApiResponse<ExpenseResponse>> createExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateExpenseRequest request) {
        ExpenseResponse response = expenseService.createExpense(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Expense recorded successfully"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<ExpenseResponse>>> getExpenses(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<ExpenseResponse> response = expenseService.getExpenses(principal, startDate, endDate, page, size);
        return ResponseEntity.ok(ApiResponse.success(response, "Expenses retrieved successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        expenseService.deleteExpense(principal, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Expense deleted successfully"));
    }

    @GetMapping("/breakdown")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER')")
    public ResponseEntity<ApiResponse<List<CategoryExpenseBreakdown>>> getCategoryBreakdown(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<CategoryExpenseBreakdown> response = expenseService.getCategoryBreakdown(principal, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response, "Category breakdown retrieved"));
    }
}
