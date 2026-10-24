package com.commoncrm.platform.module.employee.controller;

import com.commoncrm.platform.common.api.ApiResponse;
import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.employee.dto.*;
import com.commoncrm.platform.module.employee.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/shop/employees")
@PreAuthorize("hasRole('SHOP_OWNER') or hasRole('PLATFORM_ADMIN')")
@Tag(name = "Store Employees", description = "Shop holder staff management, salaries, roles, and records")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_EMPLOYEE_VIEW') or hasRole('SHOP_OWNER')")
    @Operation(summary = "Search and filter store staff records with pagination")
    public ResponseEntity<ApiResponse<PageResponse<EmployeeResponse>>> getEmployees(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String designation,
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<EmployeeResponse> response = employeeService.getEmployees(principal, search, status, designation, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Staff records retrieved successfully"));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('PERM_EMPLOYEE_VIEW') or hasRole('SHOP_OWNER')")
    @Operation(summary = "Get aggregated employee headcount and monthly payroll metrics")
    public ResponseEntity<ApiResponse<EmployeeStatsResponse>> getStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        EmployeeStatsResponse response = employeeService.getStats(principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Staff metrics retrieved successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_EMPLOYEE_VIEW') or hasRole('SHOP_OWNER')")
    @Operation(summary = "Get full detailed employee file by ID")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getEmployeeById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        EmployeeResponse response = employeeService.getEmployeeById(principal, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Employee details retrieved successfully"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_EMPLOYEE_CREATE') or hasRole('SHOP_OWNER')")
    @Operation(summary = "Add a new staff member and provision login credentials")
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateEmployeeRequest request) {
        EmployeeResponse response = employeeService.createEmployee(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Staff member onboarded successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_EMPLOYEE_UPDATE') or hasRole('SHOP_OWNER')")
    @Operation(summary = "Update employee contact details, salary, address, and job title")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmployeeRequest request) {
        EmployeeResponse response = employeeService.updateEmployee(principal, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Staff member records updated successfully"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('PERM_EMPLOYEE_DISABLE') or hasRole('SHOP_OWNER')")
    @Operation(summary = "Change employee active/inactive/leave/terminated status")
    public ResponseEntity<ApiResponse<EmployeeResponse>> changeStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam String status) {
        EmployeeResponse response = employeeService.changeStatus(principal, id, status);
        return ResponseEntity.ok(ApiResponse.success(response, "Employee status updated to " + status));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasAuthority('PERM_EMPLOYEE_UPDATE') or hasRole('SHOP_OWNER')")
    @Operation(summary = "Reset login credentials password for a staff member")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ResetEmployeePasswordRequest request) {
        employeeService.resetPassword(principal, id, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Employee password reset successfully"));
    }
}
