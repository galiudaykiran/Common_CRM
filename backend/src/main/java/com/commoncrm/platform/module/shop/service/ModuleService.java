package com.commoncrm.platform.module.shop.service;

import com.commoncrm.platform.common.audit.service.AuditService;
import com.commoncrm.platform.common.exception.DuplicateResourceException;
import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.shop.dto.ModuleRequest;
import com.commoncrm.platform.module.shop.dto.ModuleResponse;
import com.commoncrm.platform.module.shop.entity.Module;
import com.commoncrm.platform.module.shop.repository.ModuleRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class ModuleService {

    private final ModuleRepository moduleRepository;
    private final AuditService auditService;

    public ModuleService(ModuleRepository moduleRepository, AuditService auditService) {
        this.moduleRepository = moduleRepository;
        this.auditService = auditService;
    }

    @Cacheable(value = "modules", key = "'all_' + #activeOnly")
    @Transactional(readOnly = true)
    public List<ModuleResponse> getAll(boolean activeOnly) {
        List<Module> list = activeOnly
                ? moduleRepository.findAllByActiveTrue()
                : moduleRepository.findAll();

        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @CacheEvict(value = "modules", allEntries = true)
    @Transactional
    public ModuleResponse create(ModuleRequest request) {
        String normalizedCode = request.getCode().trim().toUpperCase(Locale.ROOT);
        if (moduleRepository.existsByCode(normalizedCode)) {
            throw new DuplicateResourceException("Module", "code", normalizedCode);
        }

        Module module = Module.builder()
                .code(normalizedCode)
                .name(request.getName().trim())
                .description(request.getDescription())
                .active(request.isActive())
                .coreModule(request.isCoreModule())
                .build();

        Module saved = moduleRepository.save(module);
        auditAction("ADMIN_CREATED_MODULE", saved.getId().toString(), null, saved.getName());

        return mapToDto(saved);
    }

    @CacheEvict(value = "modules", allEntries = true)
    @Transactional
    public ModuleResponse updateStatus(Long id, boolean active) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module", "id", id));

        boolean oldStatus = module.isActive();
        module.setActive(active);
        Module updated = moduleRepository.save(module);

        auditAction("ADMIN_UPDATED_MODULE_STATUS", updated.getId().toString(), String.valueOf(oldStatus), String.valueOf(active));

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
                        "MODULE",
                        resourceId,
                        oldValue,
                        newValue
                );
            }
        } catch (Exception ignored) {}
    }

    private ModuleResponse mapToDto(Module module) {
        return ModuleResponse.builder()
                .id(module.getId())
                .code(module.getCode())
                .name(module.getName())
                .description(module.getDescription())
                .active(module.isActive())
                .coreModule(module.isCoreModule())
                .createdAt(module.getCreatedAt())
                .build();
    }
}
