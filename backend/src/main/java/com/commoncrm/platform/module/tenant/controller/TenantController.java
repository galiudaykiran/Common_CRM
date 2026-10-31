package com.commoncrm.platform.module.tenant.controller;

import com.commoncrm.platform.common.api.ApiResponse;
import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.module.tenant.dto.TenantRequest;
import com.commoncrm.platform.module.tenant.dto.TenantResponse;
import com.commoncrm.platform.module.tenant.service.TenantService;
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
@RequestMapping("/api/v1/admin/tenants")
@Tag(name = "Tenants", description = "Multi-tenant company and group account management")
public class TenantController {

    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @GetMapping
    @Operation(summary = "Search and filter tenants with pagination")
    public ResponseEntity<ApiResponse<PageResponse<TenantResponse>>> searchTenants(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<TenantResponse> response = tenantService.searchTenants(search, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Tenants retrieved successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get tenant details by ID")
    public ResponseEntity<ApiResponse<TenantResponse>> getById(@PathVariable Long id) {
        TenantResponse response = tenantService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Tenant retrieved successfully"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_TENANT_CREATE') or hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Create a new tenant")
    public ResponseEntity<ApiResponse<TenantResponse>> create(@Valid @RequestBody TenantRequest request) {
        TenantResponse response = tenantService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Tenant created successfully"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('PERM_TENANT_STATUS') or hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Change tenant status (ACTIVE, INACTIVE, SUSPENDED)")
    public ResponseEntity<ApiResponse<TenantResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        TenantResponse response = tenantService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(response, "Tenant status updated successfully"));
    }
}
