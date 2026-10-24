package com.commoncrm.platform.module.businesstype.controller;

import com.commoncrm.platform.common.api.ApiResponse;
import com.commoncrm.platform.module.businesstype.dto.BusinessTypeRequest;
import com.commoncrm.platform.module.businesstype.dto.BusinessTypeResponse;
import com.commoncrm.platform.module.businesstype.service.BusinessTypeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/business-types")
@Tag(name = "Business Types", description = "Platform business types configuration")
public class BusinessTypeController {

    private final BusinessTypeService service;

    public BusinessTypeController(BusinessTypeService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "List all business types")
    public ResponseEntity<ApiResponse<List<BusinessTypeResponse>>> getAll(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        List<BusinessTypeResponse> list = service.getAll(activeOnly);
        return ResponseEntity.ok(ApiResponse.success(list, "Business types retrieved successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get business type by ID")
    public ResponseEntity<ApiResponse<BusinessTypeResponse>> getById(@PathVariable Long id) {
        BusinessTypeResponse response = service.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Business type retrieved successfully"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_BUSINESS_TYPE_MANAGE') or hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Create a new business type")
    public ResponseEntity<ApiResponse<BusinessTypeResponse>> create(@Valid @RequestBody BusinessTypeRequest request) {
        BusinessTypeResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Business type created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_BUSINESS_TYPE_MANAGE') or hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Update an existing business type")
    public ResponseEntity<ApiResponse<BusinessTypeResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody BusinessTypeRequest request) {
        BusinessTypeResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Business type updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_BUSINESS_TYPE_MANAGE') or hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Delete a business type")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Business type deleted successfully"));
    }
}
