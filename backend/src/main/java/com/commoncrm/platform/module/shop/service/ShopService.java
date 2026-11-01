package com.commoncrm.platform.module.shop.service;

import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.common.audit.service.AuditService;
import com.commoncrm.platform.common.event.EventPublisher;
import com.commoncrm.platform.common.event.ShopCreatedEvent;
import com.commoncrm.platform.common.event.ShopStatusChangedEvent;
import com.commoncrm.platform.common.exception.BusinessException;
import com.commoncrm.platform.common.exception.DuplicateResourceException;
import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.auth.service.OtpService;
import com.commoncrm.platform.module.businesstype.entity.BusinessType;
import com.commoncrm.platform.module.businesstype.repository.BusinessTypeRepository;
import com.commoncrm.platform.module.shop.dto.CreateShopRequest;
import com.commoncrm.platform.module.shop.dto.ResetOwnerPasswordRequest;
import com.commoncrm.platform.module.shop.dto.ShopDetailResponse;
import com.commoncrm.platform.module.shop.dto.ShopSummaryResponse;
import com.commoncrm.platform.module.shop.dto.UpdateShopOwnerRequest;
import com.commoncrm.platform.module.shop.dto.UpdateShopProfileRequest;
import com.commoncrm.platform.module.shop.entity.Module;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.entity.ShopConfiguration;
import com.commoncrm.platform.module.shop.entity.ShopModule;
import com.commoncrm.platform.module.shop.repository.ModuleRepository;
import com.commoncrm.platform.module.shop.repository.ShopConfigurationRepository;
import com.commoncrm.platform.module.shop.repository.ShopModuleRepository;
import com.commoncrm.platform.module.shop.repository.ShopRepository;
import com.commoncrm.platform.module.tenant.entity.Tenant;
import com.commoncrm.platform.module.tenant.repository.TenantRepository;
import com.commoncrm.platform.module.user.entity.Role;
import com.commoncrm.platform.module.user.entity.User;
import com.commoncrm.platform.module.user.repository.RoleRepository;
import com.commoncrm.platform.module.user.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ShopService {

    private final ShopRepository shopRepository;
    private final TenantRepository tenantRepository;
    private final BusinessTypeRepository businessTypeRepository;
    private final ModuleRepository moduleRepository;
    private final ShopConfigurationRepository shopConfigurationRepository;
    private final ShopModuleRepository shopModuleRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EventPublisher eventPublisher;
    private final AuditService auditService;
    private final OtpService otpService;

    public ShopService(
            ShopRepository shopRepository,
            TenantRepository tenantRepository,
            BusinessTypeRepository businessTypeRepository,
            ModuleRepository moduleRepository,
            ShopConfigurationRepository shopConfigurationRepository,
            ShopModuleRepository shopModuleRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            EventPublisher eventPublisher,
            AuditService auditService,
            OtpService otpService) {
        this.shopRepository = shopRepository;
        this.tenantRepository = tenantRepository;
        this.businessTypeRepository = businessTypeRepository;
        this.moduleRepository = moduleRepository;
        this.shopConfigurationRepository = shopConfigurationRepository;
        this.shopModuleRepository = shopModuleRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.eventPublisher = eventPublisher;
        this.auditService = auditService;
        this.otpService = otpService;
    }

    @Transactional(readOnly = true)
    public PageResponse<ShopSummaryResponse> searchShops(
            String search, Long businessTypeId, String status, Pageable pageable) {
        Page<Shop> page = shopRepository.searchShops(search, businessTypeId, status, pageable);
        return PageResponse.from(page.map(this::mapToSummaryDto));
    }

    @Transactional(readOnly = true)
    public ShopDetailResponse getShopDetails(Long id) {
        Shop shop = shopRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop", "id", id));

        ShopConfiguration config = shopConfigurationRepository.findByShopId(id).orElse(null);
        List<ShopModule> modules = shopModuleRepository.findAllWithModuleByShopId(id);
        User ownerUser = userRepository.findFirstByTenantIdOrderByIdAsc(shop.getTenant().getId()).orElse(null);

        return mapToDetailDto(shop, config, modules, ownerUser);
    }

    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(value = "dashboardStats", allEntries = true)
    public ShopDetailResponse createShop(CreateShopRequest request) {
        String normalizedShopCode = request.getShopCode().trim().toUpperCase(Locale.ROOT);

        // 1. Check if shop code already exists
        if (shopRepository.existsByCode(normalizedShopCode)) {
            throw new DuplicateResourceException("Shop", "code", normalizedShopCode);
        }

        // 2. Check if owner username or email already exists
        if (userRepository.existsByUsername(request.getOwnerUsername().trim())) {
            throw new DuplicateResourceException("User", "username", request.getOwnerUsername());
        }
        if (userRepository.existsByEmail(request.getOwnerEmail().trim())) {
            throw new DuplicateResourceException("User", "email", request.getOwnerEmail());
        }

        // 3. Resolve or create Tenant
        Tenant tenant;
        if (request.getTenantId() != null) {
            tenant = tenantRepository.findById(request.getTenantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tenant", "id", request.getTenantId()));
        } else {
            String tenantCode = StringUtils.hasText(request.getTenantCode())
                    ? request.getTenantCode().trim().toUpperCase(Locale.ROOT)
                    : "TNT-" + normalizedShopCode;
            String tenantName = StringUtils.hasText(request.getTenantName())
                    ? request.getTenantName().trim()
                    : request.getShopName().trim() + " Enterprise";

            if (tenantRepository.existsByCode(tenantCode)) {
                tenant = tenantRepository.findByCode(tenantCode).get();
            } else {
                tenant = tenantRepository.save(Tenant.builder()
                        .code(tenantCode)
                        .name(tenantName)
                        .status("ACTIVE")
                        .build());
            }
        }

        // 4. Validate Business Type
        BusinessType businessType = businessTypeRepository.findById(request.getBusinessTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("BusinessType", "id", request.getBusinessTypeId()));

        // 5. Create Shop entity (with automatic fallback to owner contact info if shop email/phone not explicitly specified)
        String effectiveEmail = StringUtils.hasText(request.getEmail())
                ? request.getEmail().trim()
                : request.getOwnerEmail().trim();

        String effectivePhone = StringUtils.hasText(request.getPhone())
                ? request.getPhone().trim()
                : (StringUtils.hasText(request.getOwnerPhone()) ? request.getOwnerPhone().trim() : null);

        Shop shop = Shop.builder()
                .tenant(tenant)
                .businessType(businessType)
                .code(normalizedShopCode)
                .name(request.getShopName().trim())
                .phone(effectivePhone)
                .email(effectiveEmail)
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .currency(request.getCurrency() != null ? request.getCurrency() : "INR")
                .timezone(request.getTimezone() != null ? request.getTimezone() : "Asia/Kolkata")
                .status("ACTIVE")
                .version(0)
                .build();

        Shop savedShop = shopRepository.save(shop);

        // 6. Create Shop Configuration
        ShopConfiguration config = ShopConfiguration.builder()
                .shop(savedShop)
                .taxNumber(request.getTaxNumber())
                .defaultTaxRate(request.getDefaultTaxRate() != null ? request.getDefaultTaxRate() : BigDecimal.ZERO)
                .invoicePrefix(StringUtils.hasText(request.getInvoicePrefix()) ? request.getInvoicePrefix().trim() : "INV-")
                .settingsJson(request.getSettingsJson())
                .build();
        ShopConfiguration savedConfig = shopConfigurationRepository.save(config);

        // 7. Associate Enabled Modules
        List<ShopModule> savedShopModules = new ArrayList<>();
        if (request.getEnabledModuleIds() != null && !request.getEnabledModuleIds().isEmpty()) {
            List<Module> selectedModules = moduleRepository.findAllById(request.getEnabledModuleIds());
            for (Module m : selectedModules) {
                ShopModule sm = ShopModule.builder()
                        .shop(savedShop)
                        .module(m)
                        .enabled(true)
                        .enabledAt(Instant.now())
                        .build();
                savedShopModules.add(shopModuleRepository.save(sm));
            }
        }

        // 8. Create Shop Owner Account and Assign SHOP_OWNER Role
        Role shopOwnerRole = roleRepository.findByCode("SHOP_OWNER")
                .orElseThrow(() -> new BusinessException("Role SHOP_OWNER is not configured in the system"));

        User owner = User.builder()
                .tenantId(tenant.getId())
                .username(request.getOwnerUsername().trim())
                .email(request.getOwnerEmail().trim())
                .passwordHash(passwordEncoder.encode(request.getOwnerPassword()))
                .fullName(request.getOwnerFullName().trim())
                .phone(request.getOwnerPhone())
                .status("ACTIVE")
                .roles(Set.of(shopOwnerRole))
                .build();

        User savedOwner = userRepository.save(owner);

        // 9. Publish Asynchronous Kafka Event
        ShopCreatedEvent event = ShopCreatedEvent.builder()
                .eventType("SHOP_CREATED")
                .shopId(savedShop.getId())
                .shopCode(savedShop.getCode())
                .shopName(savedShop.getName())
                .tenantId(tenant.getId())
                .tenantCode(tenant.getCode())
                .ownerUserId(savedOwner.getId())
                .ownerUsername(savedOwner.getUsername())
                .ownerEmail(savedOwner.getEmail())
                .businessTypeCode(businessType.getCode())
                .build();
        eventPublisher.publishEvent(savedShop.getId().toString(), event);

        // 10. Record Audit Log
        auditAction(
                "ADMIN_CREATED_SHOP",
                savedShop.getId().toString(),
                null,
                String.format("Created shop '%s' (Code: %s, Tenant: %s, Owner: %s)",
                        savedShop.getName(), savedShop.getCode(), tenant.getName(), savedOwner.getUsername())
        );

        return mapToDetailDto(savedShop, savedConfig, savedShopModules, savedOwner);
    }

    @Transactional
    @CacheEvict(value = "dashboardStats", allEntries = true)
    public ShopDetailResponse updateStatus(Long id, String status) {
        return updateStatus(id, status, null);
    }

    @Transactional
    @CacheEvict(value = "dashboardStats", allEntries = true)
    public ShopDetailResponse updateStatus(Long id, String status, String otp) {
        if (StringUtils.hasText(otp)) {
            boolean valid = otpService.validateOtp("SHOP_STATUS:" + id, otp);
            if (!valid) {
                throw new BusinessException("Invalid or expired Security verification OTP for shop status change");
            }
        }

        Shop shop = shopRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop", "id", id));

        String oldStatus = shop.getStatus();
        String normalizedStatus = status.trim().toUpperCase(Locale.ROOT);
        shop.setStatus(normalizedStatus);
        Shop updated = shopRepository.save(shop);

        ShopConfiguration config = shopConfigurationRepository.findByShopId(id).orElse(null);
        List<ShopModule> modules = shopModuleRepository.findAllWithModuleByShopId(id);
        User ownerUser = userRepository.findFirstByTenantIdOrderByIdAsc(shop.getTenant().getId()).orElse(null);

        // Publish Status Changed Event
        ShopStatusChangedEvent event = ShopStatusChangedEvent.builder()
                .eventType("SHOP_STATUS_CHANGED")
                .shopId(shop.getId())
                .shopCode(shop.getCode())
                .tenantId(shop.getTenant().getId())
                .oldStatus(oldStatus)
                .newStatus(normalizedStatus)
                .updatedBy(getCurrentUsername())
                .build();
        eventPublisher.publishEvent(shop.getId().toString(), event);

        auditAction("ADMIN_UPDATED_SHOP_STATUS", shop.getId().toString(), oldStatus, normalizedStatus);

        return mapToDetailDto(updated, config, modules, ownerUser);
    }

    @Transactional
    public ShopDetailResponse resetOwnerPassword(Long id, ResetOwnerPasswordRequest request) {
        boolean valid = otpService.validateOtp("RESET_PASSWORD:" + id, request.otp());
        if (!valid) {
            throw new BusinessException("Invalid or expired Security verification OTP for password reset");
        }

        Shop shop = shopRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop", "id", id));

        User owner = userRepository.findFirstByTenantIdOrderByIdAsc(shop.getTenant().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Owner", "shopId", id));

        owner.setPasswordHash(passwordEncoder.encode(request.newPassword().trim()));
        owner.setUpdatedAt(Instant.now());
        userRepository.save(owner);

        auditAction("ADMIN_RESET_SHOP_OWNER_PASSWORD", shop.getId().toString(), null, "Password reset for " + owner.getUsername());

        return getShopDetails(id);
    }

    @Transactional
    public ShopDetailResponse updateShopOwnership(Long id, UpdateShopOwnerRequest request) {
        boolean valid = otpService.validateOtp("TRANSFER_OWNERSHIP:" + id, request.otp());
        if (!valid) {
            throw new BusinessException("Invalid or expired Security verification OTP for ownership update");
        }

        Shop shop = shopRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop", "id", id));

        User owner = userRepository.findFirstByTenantIdOrderByIdAsc(shop.getTenant().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Owner", "shopId", id));

        String oldUsername = owner.getUsername();
        String newUsername = request.username().trim();

        if (!oldUsername.equalsIgnoreCase(newUsername)) {
            if (userRepository.existsByUsername(newUsername)) {
                throw new DuplicateResourceException("User", "username", newUsername);
            }
            owner.setUsername(newUsername);
        }

        owner.setFullName(request.fullName().trim());
        owner.setEmail(request.email().trim());
        if (StringUtils.hasText(request.phone())) {
            owner.setPhone(request.phone().trim());
        }
        owner.setUpdatedAt(Instant.now());
        userRepository.save(owner);

        if (Boolean.TRUE.equals(request.syncShopContact())) {
            shop.setEmail(request.email().trim());
            if (StringUtils.hasText(request.phone())) {
                shop.setPhone(request.phone().trim());
            }
            shopRepository.save(shop);
        }

        auditAction("ADMIN_UPDATED_SHOP_OWNERSHIP", shop.getId().toString(), oldUsername,
                "Transferred/Updated to " + owner.getUsername() + " (" + owner.getEmail() + ")");

        return getShopDetails(id);
    }

    @Transactional
    public ShopDetailResponse updateShopProfile(Long id, UpdateShopProfileRequest request) {
        Shop shop = shopRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop", "id", id));

        if (StringUtils.hasText(request.name())) {
            shop.setName(request.name().trim());
        }
        if (request.phone() != null) {
            shop.setPhone(request.phone().trim());
        }
        if (request.email() != null) {
            shop.setEmail(request.email().trim());
        }
        if (request.address() != null) {
            shop.setAddress(request.address().trim());
        }
        if (request.city() != null) {
            shop.setCity(request.city().trim());
        }
        if (request.state() != null) {
            shop.setState(request.state().trim());
        }
        if (request.postalCode() != null) {
            shop.setPostalCode(request.postalCode().trim());
        }
        if (StringUtils.hasText(request.currency())) {
            shop.setCurrency(request.currency().trim());
        }
        if (StringUtils.hasText(request.timezone())) {
            shop.setTimezone(request.timezone().trim());
        }

        Shop saved = shopRepository.save(shop);
        auditAction("ADMIN_UPDATED_SHOP_PROFILE", shop.getId().toString(), null,
                "Updated shop profile and address for " + saved.getName());

        return getShopDetails(id);
    }

    private String getCurrentUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null) ? auth.getName() : "SYSTEM";
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
                        "SHOP",
                        resourceId,
                        oldValue,
                        newValue
                );
            }
        } catch (Exception ignored) {}
    }

    private ShopSummaryResponse mapToSummaryDto(Shop shop) {
        String ownerFullName = null;
        String ownerUsername = null;
        if (shop.getTenant() != null) {
            var ownerOpt = userRepository.findFirstByTenantIdOrderByIdAsc(shop.getTenant().getId());
            if (ownerOpt.isPresent()) {
                ownerFullName = ownerOpt.get().getFullName();
                ownerUsername = ownerOpt.get().getUsername();
            }
        }

        return ShopSummaryResponse.builder()
                .id(shop.getId())
                .code(shop.getCode())
                .name(shop.getName())
                .tenantId(shop.getTenant().getId())
                .tenantName(shop.getTenant().getName())
                .businessTypeId(shop.getBusinessType().getId())
                .businessTypeCode(shop.getBusinessType().getCode())
                .businessTypeName(shop.getBusinessType().getName())
                .phone(shop.getPhone())
                .email(shop.getEmail())
                .city(shop.getCity())
                .status(shop.getStatus())
                .currency(shop.getCurrency())
                .ownerFullName(ownerFullName)
                .ownerUsername(ownerUsername)
                .createdAt(shop.getCreatedAt())
                .build();
    }

    @Transactional
    public ShopDetailResponse updateShopModules(Long id, List<Long> enabledModuleIds) {
        Shop shop = shopRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop", "id", id));

        List<ShopModule> currentShopModules = shopModuleRepository.findAllWithModuleByShopId(id);
        Set<Long> targetModuleIds = enabledModuleIds != null ? new HashSet<>(enabledModuleIds) : Collections.emptySet();

        for (ShopModule sm : currentShopModules) {
            if (!targetModuleIds.contains(sm.getModule().getId())) {
                shopModuleRepository.delete(sm);
            }
        }

        Set<Long> existingModuleIds = currentShopModules.stream()
                .filter(sm -> targetModuleIds.contains(sm.getModule().getId()))
                .map(sm -> sm.getModule().getId())
                .collect(Collectors.toSet());

        for (Long modId : targetModuleIds) {
            if (!existingModuleIds.contains(modId)) {
                Module module = moduleRepository.findById(modId)
                        .orElseThrow(() -> new ResourceNotFoundException("Module", "id", modId));
                ShopModule sm = ShopModule.builder()
                        .shop(shop)
                        .module(module)
                        .enabled(true)
                        .enabledAt(Instant.now())
                        .build();
                shopModuleRepository.save(sm);
            }
        }

        auditAction("ADMIN_UPDATED_SHOP_MODULES", shop.getId().toString(), null, "Updated enabled modules for shop " + shop.getName());
        return getShopDetails(id);
    }

    private ShopDetailResponse mapToDetailDto(Shop shop, ShopConfiguration config, List<ShopModule> modules, User ownerUser) {
        ShopDetailResponse.ShopConfigDto configDto = null;
        if (config != null) {
            configDto = ShopDetailResponse.ShopConfigDto.builder()
                    .taxNumber(config.getTaxNumber())
                    .defaultTaxRate(config.getDefaultTaxRate())
                    .invoicePrefix(config.getInvoicePrefix())
                    .settingsJson(config.getSettingsJson())
                    .build();
        }

        List<ShopDetailResponse.ShopModuleDto> moduleDtos = (modules != null)
                ? modules.stream().map(m -> ShopDetailResponse.ShopModuleDto.builder()
                        .moduleId(m.getModule().getId())
                        .moduleCode(m.getModule().getCode())
                        .moduleName(m.getModule().getName())
                        .enabled(m.isEnabled())
                        .build()).collect(Collectors.toList())
                : Collections.emptyList();

        ShopDetailResponse.ShopOwnerDto ownerDto = null;
        if (ownerUser != null) {
            ownerDto = ShopDetailResponse.ShopOwnerDto.builder()
                    .userId(ownerUser.getId())
                    .username(ownerUser.getUsername())
                    .fullName(ownerUser.getFullName())
                    .email(ownerUser.getEmail())
                    .phone(ownerUser.getPhone())
                    .build();
        }

        return ShopDetailResponse.builder()
                .id(shop.getId())
                .code(shop.getCode())
                .name(shop.getName())
                .tenantId(shop.getTenant().getId())
                .tenantName(shop.getTenant().getName())
                .tenantCode(shop.getTenant().getCode())
                .businessTypeId(shop.getBusinessType().getId())
                .businessTypeCode(shop.getBusinessType().getCode())
                .businessTypeName(shop.getBusinessType().getName())
                .phone(shop.getPhone())
                .email(shop.getEmail())
                .address(shop.getAddress())
                .city(shop.getCity())
                .state(shop.getState())
                .postalCode(shop.getPostalCode())
                .status(shop.getStatus())
                .currency(shop.getCurrency())
                .timezone(shop.getTimezone())
                .version(shop.getVersion())
                .createdAt(shop.getCreatedAt())
                .updatedAt(shop.getUpdatedAt())
                .owner(ownerDto)
                .configuration(configDto)
                .modules(moduleDtos)
                .build();
    }
}
