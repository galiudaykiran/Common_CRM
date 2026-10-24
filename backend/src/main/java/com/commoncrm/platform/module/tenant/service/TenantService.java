package com.commoncrm.platform.module.tenant.service;

import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.common.audit.service.AuditService;
import com.commoncrm.platform.common.exception.DuplicateResourceException;
import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.tenant.dto.TenantRequest;
import com.commoncrm.platform.module.tenant.dto.TenantResponse;
import com.commoncrm.platform.module.tenant.entity.Tenant;
import com.commoncrm.platform.module.tenant.repository.TenantRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class TenantService {

    private final TenantRepository tenantRepository;
    private final AuditService auditService;

    public TenantService(TenantRepository tenantRepository, AuditService auditService) {
        this.tenantRepository = tenantRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PageResponse<TenantResponse> searchTenants(String search, String status, Pageable pageable) {
        Page<Tenant> page = tenantRepository.searchTenants(search, status, pageable);
        return PageResponse.from(page.map(this::mapToDto));
    }

    @Transactional(readOnly = true)
    public TenantResponse getById(Long id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "id", id));
        return mapToDto(tenant);
    }

    @Transactional
    public TenantResponse create(TenantRequest request) {
        String normalizedCode = request.getCode().trim().toUpperCase(Locale.ROOT);
        if (tenantRepository.existsByCode(normalizedCode)) {
            throw new DuplicateResourceException("Tenant", "code", normalizedCode);
        }

        Tenant tenant = Tenant.builder()
                .code(normalizedCode)
                .name(request.getName().trim())
                .status(request.getStatus() != null ? request.getStatus().toUpperCase(Locale.ROOT) : "ACTIVE")
                .build();

        Tenant saved = tenantRepository.save(tenant);
        auditAction("ADMIN_CREATED_TENANT", saved.getId().toString(), null, saved.getName());

        return mapToDto(saved);
    }

    @Transactional
    public TenantResponse updateStatus(Long id, String status) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "id", id));

        String oldStatus = tenant.getStatus();
        tenant.setStatus(status.toUpperCase(Locale.ROOT));
        Tenant updated = tenantRepository.save(tenant);

        auditAction("ADMIN_UPDATED_TENANT_STATUS", updated.getId().toString(), oldStatus, status);

        return mapToDto(updated);
    }

    private void auditAction(String action, String resourceId, String oldValue, String newValue) {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
                auditService.logAction(
                        principal.getId(),
                        principal.getUsername(),
                        null,
                        action,
                        "TENANT",
                        resourceId,
                        oldValue,
                        newValue
                );
            }
        } catch (Exception ignored) {}
    }

    private TenantResponse mapToDto(Tenant tenant) {
        return TenantResponse.builder()
                .id(tenant.getId())
                .code(tenant.getCode())
                .name(tenant.getName())
                .status(tenant.getStatus())
                .createdAt(tenant.getCreatedAt())
                .updatedAt(tenant.getUpdatedAt())
                .build();
    }
}
