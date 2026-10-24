package com.commoncrm.platform.module.shop.controller;

import com.commoncrm.platform.common.api.ApiResponse;
import com.commoncrm.platform.module.shop.dto.ModuleRequest;
import com.commoncrm.platform.module.shop.dto.ModuleResponse;
import com.commoncrm.platform.module.shop.service.ModuleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/modules")
@Tag(name = "Platform Modules", description = "System feature modules management")
public class ModuleController {

    private final ModuleService moduleService;

    public ModuleController(ModuleService moduleService) {
        this.moduleService = moduleService;
    }

    @GetMapping
    @Operation(summary = "List all platform modules")
    public ResponseEntity<ApiResponse<List<ModuleResponse>>> getAll(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        List<ModuleResponse> list = moduleService.getAll(activeOnly);
        return ResponseEntity.ok(ApiResponse.success(list, "Modules retrieved successfully"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_MODULE_MANAGE') or hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Create a new platform module")
    public ResponseEntity<ApiResponse<ModuleResponse>> create(@Valid @RequestBody ModuleRequest request) {
        ModuleResponse response = moduleService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Module created successfully"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('PERM_MODULE_MANAGE') or hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Update module active/inactive status")
    public ResponseEntity<ApiResponse<ModuleResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam boolean active) {
        ModuleResponse response = moduleService.updateStatus(id, active);
        return ResponseEntity.ok(ApiResponse.success(response, "Module status updated successfully"));
    }
}
