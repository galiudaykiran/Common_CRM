package com.commoncrm.platform.module.shop.service;

import com.commoncrm.platform.common.audit.service.AuditService;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.shop.dto.ShopDetailResponse;
import com.commoncrm.platform.module.shop.dto.ShopOwnerDashboardResponse;
import com.commoncrm.platform.module.shop.dto.UpdateShopOwnerProfileRequest;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.entity.ShopConfiguration;
import com.commoncrm.platform.module.shop.entity.ShopModule;
import com.commoncrm.platform.module.shop.repository.ShopConfigurationRepository;
import com.commoncrm.platform.module.shop.repository.ShopModuleRepository;
import com.commoncrm.platform.module.shop.repository.ShopRepository;
import com.commoncrm.platform.module.inventory.repository.InventoryRepository;
import com.commoncrm.platform.module.inventory.repository.ProductRepository;
import com.commoncrm.platform.module.user.entity.User;
import com.commoncrm.platform.module.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ShopOwnerService {

    private final ShopContextService shopContextService;
    private final ShopRepository shopRepository;
    private final ShopConfigurationRepository shopConfigurationRepository;
    private final ShopModuleRepository shopModuleRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final AuditService auditService;

    public ShopOwnerService(ShopContextService shopContextService,
                            ShopRepository shopRepository,
                            ShopConfigurationRepository shopConfigurationRepository,
                            ShopModuleRepository shopModuleRepository,
                            UserRepository userRepository,
                            ProductRepository productRepository,
                            InventoryRepository inventoryRepository,
                            AuditService auditService) {
        this.shopContextService = shopContextService;
        this.shopRepository = shopRepository;
        this.shopConfigurationRepository = shopConfigurationRepository;
        this.shopModuleRepository = shopModuleRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public ShopOwnerDashboardResponse getDashboard(UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Long tenantId = shop.getTenant().getId();

        // Fetch modules with joined module details
        List<ShopModule> shopModules = shopModuleRepository.findAllWithModuleByShopId(shop.getId());

        List<String> enabledCodes = shopModules.stream()
                .filter(ShopModule::isEnabled)
                .map(sm -> sm.getModule().getCode())
                .collect(Collectors.toList());

        List<ShopOwnerDashboardResponse.ModuleDto> moduleDtos = shopModules.stream()
                .map(sm -> ShopOwnerDashboardResponse.ModuleDto.builder()
                        .moduleId(sm.getModule().getId())
                        .code(sm.getModule().getCode())
                        .name(sm.getModule().getName())
                        .description(sm.getModule().getDescription())
                        .core(sm.getModule().isCoreModule())
                        .enabled(sm.isEnabled())
                        .build())
                .collect(Collectors.toList());

        // Count active staff for this shop's tenant
        long activeEmployees = userRepository.countByTenantIdAndStatus(tenantId, "ACTIVE");

        // Query real-time product catalog & low stock inventory counts for this specific store
        long totalProducts = productRepository.countByShopId(shop.getId());
        long lowStockCount = inventoryRepository.countLowStock(shop.getId());

        // Aggregated stats (Zero-memory database aggregation, extensible as product/sale entities populate)
        ShopOwnerDashboardResponse.ShopStatsDto stats = ShopOwnerDashboardResponse.ShopStatsDto.builder()
                .todaySalesCount(0L)
                .todayRevenue(BigDecimal.ZERO)
                .totalProducts(totalProducts)
                .lowStockCount(lowStockCount)
                .activeEmployees(activeEmployees)
                .activeCustomers(0L)
                .pendingOrders(0L)
                .build();

        return ShopOwnerDashboardResponse.builder()
                .shopId(shop.getId())
                .shopName(shop.getName())
                .shopCode(shop.getCode())
                .tenantId(tenantId)
                .tenantName(shop.getTenant().getName())
                .address(shop.getAddress())
                .city(shop.getCity())
                .state(shop.getState())
                .postalCode(shop.getPostalCode())
                .phone(shop.getPhone())
                .email(shop.getEmail())
                .currency(shop.getCurrency())
                .timezone(shop.getTimezone())
                .status(shop.getStatus())
                .businessTypeId(shop.getBusinessType().getId())
                .businessTypeCode(shop.getBusinessType().getCode())
                .businessTypeName(shop.getBusinessType().getName())
                .enabledModuleCodes(enabledCodes)
                .modules(moduleDtos)
                .stats(stats)
                .recentActivity(auditService.getRecentActivityForTenant(tenantId))
                .build();
    }

    @Transactional(readOnly = true)
    public List<com.commoncrm.platform.common.audit.dto.AuditLogResponse> getStoreAuditLogs(UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return auditService.getAllActivityForTenant(shop.getTenant().getId());
    }

    @Transactional(readOnly = true)
    public ShopDetailResponse getProfile(UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        ShopConfiguration config = shopConfigurationRepository.findByShopId(shop.getId()).orElse(null);
        User ownerUser = userRepository.findFirstByTenantIdOrderByIdAsc(shop.getTenant().getId()).orElse(null);
        List<ShopModule> modules = shopModuleRepository.findAllWithModuleByShopId(shop.getId());

        return mapToDetailDto(shop, config, modules, ownerUser);
    }

    @Transactional
    public ShopDetailResponse updateProfile(UserPrincipal principal, UpdateShopOwnerProfileRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);

        String oldAddress = shop.getAddress();
        String oldPhone = shop.getPhone();

        // Update allowable operational fields only - platform fields like tenantId, code, status are strictly immutable here
        if (request.getPhone() != null) shop.setPhone(request.getPhone());
        if (request.getEmail() != null) shop.setEmail(request.getEmail());
        if (request.getAddress() != null) shop.setAddress(request.getAddress());
        if (request.getCity() != null) shop.setCity(request.getCity());
        if (request.getState() != null) shop.setState(request.getState());
        if (request.getPostalCode() != null) shop.setPostalCode(request.getPostalCode());

        Shop savedShop = shopRepository.save(shop);

        // Update configuration if requested
        ShopConfiguration config = shopConfigurationRepository.findByShopId(shop.getId())
                .orElseGet(() -> ShopConfiguration.builder().shop(shop).build());

        boolean configChanged = false;
        if (request.getTaxNumber() != null) {
            config.setTaxNumber(request.getTaxNumber());
            configChanged = true;
        }
        if (request.getDefaultTaxRate() != null) {
            config.setDefaultTaxRate(request.getDefaultTaxRate());
            configChanged = true;
        }
        if (request.getInvoicePrefix() != null) {
            config.setInvoicePrefix(request.getInvoicePrefix());
            configChanged = true;
        }

        if (configChanged) {
            config = shopConfigurationRepository.save(config);
        }

        // Record zero-trust audit
        auditService.logAction(
                principal.getId(),
                principal.getUsername(),
                shop.getTenant().getId(),
                "SHOP_OWNER_UPDATED_PROFILE",
                "SHOP",
                shop.getId().toString(),
                "phone=" + oldPhone + ", address=" + oldAddress,
                "phone=" + savedShop.getPhone() + ", address=" + savedShop.getAddress()
        );

        User ownerUser = userRepository.findFirstByTenantIdOrderByIdAsc(shop.getTenant().getId()).orElse(null);
        List<ShopModule> modules = shopModuleRepository.findAllWithModuleByShopId(savedShop.getId());
        return mapToDetailDto(savedShop, config, modules, ownerUser);
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

    @Transactional(readOnly = true)
    public com.commoncrm.platform.module.shop.dto.ShopBasicInfoResponse getBasicInfo(UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        List<ShopModule> shopModules = shopModuleRepository.findAllWithModuleByShopId(shop.getId());
        List<String> enabledCodes = shopModules.stream()
                .filter(ShopModule::isEnabled)
                .map(sm -> sm.getModule().getCode())
                .collect(Collectors.toList());

        return com.commoncrm.platform.module.shop.dto.ShopBasicInfoResponse.builder()
                .shopId(shop.getId())
                .shopName(shop.getName())
                .shopCode(shop.getCode())
                .tenantId(shop.getTenant().getId())
                .tenantName(shop.getTenant().getName())
                .status(shop.getStatus())
                .enabledModuleCodes(enabledCodes)
                .build();
    }
}

