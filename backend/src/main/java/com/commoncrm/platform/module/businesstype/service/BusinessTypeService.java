package com.commoncrm.platform.module.businesstype.service;

import com.commoncrm.platform.common.audit.service.AuditService;
import com.commoncrm.platform.common.exception.DuplicateResourceException;
import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.businesstype.dto.BusinessTypeRequest;
import com.commoncrm.platform.module.businesstype.dto.BusinessTypeResponse;
import com.commoncrm.platform.module.businesstype.entity.BusinessType;
import com.commoncrm.platform.module.businesstype.repository.BusinessTypeRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class BusinessTypeService {

    private final BusinessTypeRepository repository;
    private final AuditService auditService;

    public BusinessTypeService(BusinessTypeRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Cacheable(value = "businessTypes", key = "'all_' + #activeOnly")
    @Transactional(readOnly = true)
    public List<BusinessTypeResponse> getAll(boolean activeOnly) {
        List<BusinessType> list = activeOnly
                ? repository.findAllByActiveTrueOrderByDisplayOrderAsc()
                : repository.findAllByOrderByDisplayOrderAsc();

        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BusinessTypeResponse getById(Long id) {
        BusinessType entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BusinessType", "id", id));
        return mapToDto(entity);
    }

    @CacheEvict(value = "businessTypes", allEntries = true)
    @Transactional
    public BusinessTypeResponse create(BusinessTypeRequest request) {
        String normalizedCode = request.getCode().trim().toUpperCase(Locale.ROOT);

        if (repository.existsByCode(normalizedCode)) {
            throw new DuplicateResourceException("BusinessType", "code", normalizedCode);
        }

        BusinessType entity = BusinessType.builder()
                .code(normalizedCode)
                .name(request.getName().trim())
                .description(request.getDescription())
                .active(request.isActive())
                .displayOrder(request.getDisplayOrder())
                .build();

        BusinessType saved = repository.save(entity);

        auditAction("ADMIN_CREATED_BUSINESS_TYPE", saved.getId().toString(), null, saved.getName());

        return mapToDto(saved);
    }

    @CacheEvict(value = "businessTypes", allEntries = true)
    @Transactional
    public BusinessTypeResponse update(Long id, BusinessTypeRequest request) {
        BusinessType entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BusinessType", "id", id));

        String oldName = entity.getName();
        entity.setName(request.getName().trim());
        entity.setDescription(request.getDescription());
        entity.setActive(request.isActive());
        entity.setDisplayOrder(request.getDisplayOrder());

        BusinessType updated = repository.save(entity);

        auditAction("ADMIN_UPDATED_BUSINESS_TYPE", updated.getId().toString(), oldName, updated.getName());

        return mapToDto(updated);
    }

    @CacheEvict(value = "businessTypes", allEntries = true)
    @Transactional
    public void delete(Long id) {
        BusinessType entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BusinessType", "id", id));

        repository.delete(entity);
        auditAction("ADMIN_DELETED_BUSINESS_TYPE", id.toString(), entity.getName(), null);
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
                        "BUSINESS_TYPE",
                        resourceId,
                        oldValue,
                        newValue
                );
            }
        } catch (Exception ignored) {}
    }

    private BusinessTypeResponse mapToDto(BusinessType entity) {
        return BusinessTypeResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .active(entity.isActive())
                .displayOrder(entity.getDisplayOrder())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
