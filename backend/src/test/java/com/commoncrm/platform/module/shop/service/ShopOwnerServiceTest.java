package com.commoncrm.platform.module.shop.service;

import com.commoncrm.platform.common.audit.dto.AuditLogResponse;
import com.commoncrm.platform.common.audit.service.AuditService;
import com.commoncrm.platform.common.exception.ForbiddenException;
import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.businesstype.entity.BusinessType;
import com.commoncrm.platform.module.shop.dto.ShopDetailResponse;
import com.commoncrm.platform.module.shop.dto.ShopOwnerDashboardResponse;
import com.commoncrm.platform.module.shop.dto.UpdateShopOwnerProfileRequest;
import com.commoncrm.platform.module.shop.entity.Module;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.entity.ShopConfiguration;
import com.commoncrm.platform.module.shop.entity.ShopModule;
import com.commoncrm.platform.module.shop.repository.ShopConfigurationRepository;
import com.commoncrm.platform.module.shop.repository.ShopModuleRepository;
import com.commoncrm.platform.module.shop.repository.ShopRepository;
import com.commoncrm.platform.module.inventory.repository.InventoryRepository;
import com.commoncrm.platform.module.inventory.repository.ProductRepository;
import com.commoncrm.platform.module.tenant.entity.Tenant;
import com.commoncrm.platform.module.user.entity.User;
import com.commoncrm.platform.module.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShopOwnerServiceTest {

    @Mock
    private ShopRepository shopRepository;
    @Mock
    private ShopConfigurationRepository shopConfigurationRepository;
    @Mock
    private ShopModuleRepository shopModuleRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private InventoryRepository inventoryRepository;
    @Mock
    private AuditService auditService;

    private ShopContextService shopContextService;
    private ShopOwnerService shopOwnerService;

    private Tenant tenantA;
    private Shop shopA;
    private UserPrincipal principalA;

    @BeforeEach
    void setUp() {
        shopContextService = new ShopContextService(shopRepository);
        shopOwnerService = new ShopOwnerService(
                shopContextService,
                shopRepository,
                shopConfigurationRepository,
                shopModuleRepository,
                userRepository,
                productRepository,
                inventoryRepository,
                auditService
        );

        tenantA = Tenant.builder()
                .code("TENANT-A")
                .name("Alpha Retailers")
                .status("ACTIVE")
                .build();
        tenantA.setId(101L);

        BusinessType businessType = BusinessType.builder()
                .code("FASHION")
                .name("Fashion & Apparel")
                .active(true)
                .build();
        businessType.setId(1L);

        shopA = Shop.builder()
                .tenant(tenantA)
                .businessType(businessType)
                .code("ALPHA-01")
                .name("Alpha Trendz Store")
                .status("ACTIVE")
                .phone("+91 9999900001")
                .email("alpha@store.com")
                .currency("INR")
                .timezone("Asia/Kolkata")
                .build();
        shopA.setId(201L);

        principalA = UserPrincipal.builder()
                .id(10L)
                .tenantId(tenantA.getId())
                .username("alpha_owner")
                .password("Password@123")
                .fullName("Alpha Owner")
                .active(true)
                .locked(false)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_SHOP_OWNER")))
                .build();
    }

    @Test
    @DisplayName("Dashboard: Should successfully resolve shop and modules strictly from authenticated tenant identity")
    void getDashboard_Success_ReturnsShopAndModules() {
        when(shopRepository.findWithDetailsByTenantId(101L)).thenReturn(Optional.of(shopA));
        when(userRepository.countByTenantIdAndStatus(101L, "ACTIVE")).thenReturn(4L);

        Module modProducts = Module.builder().code("PRODUCTS").name("Products").coreModule(true).build();
        modProducts.setId(1L);
        ShopModule sm = ShopModule.builder().shop(shopA).module(modProducts).enabled(true).build();
        when(shopModuleRepository.findAllWithModuleByShopId(201L)).thenReturn(List.of(sm));

        when(auditService.getRecentActivityForTenant(101L)).thenReturn(List.of(
                AuditLogResponse.builder().id(1L).action("SHOP_OWNER_UPDATED_PROFILE").createdAt(Instant.now()).build()
        ));

        ShopOwnerDashboardResponse response = shopOwnerService.getDashboard(principalA);

        assertNotNull(response);
        assertEquals(201L, response.getShopId());
        assertEquals("Alpha Trendz Store", response.getShopName());
        assertEquals(101L, response.getTenantId());
        assertEquals(4L, response.getStats().getActiveEmployees());
        assertTrue(response.getEnabledModuleCodes().contains("PRODUCTS"));
        assertEquals(1, response.getRecentActivity().size());

        verify(shopRepository).findWithDetailsByTenantId(101L);
        verify(shopRepository, never()).findWithDetailsByTenantId(eq(999L));
    }

    @Test
    @DisplayName("Zero-Trust Security: Should throw ForbiddenException if user principal has null tenantId")
    void getDashboard_Forbidden_WhenPrincipalHasNoTenant() {
        UserPrincipal unauthenticatedPrincipal = UserPrincipal.builder()
                .id(99L)
                .username("rogue_user")
                .tenantId(null)
                .active(true)
                .authorities(List.of())
                .build();

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                shopOwnerService.getDashboard(unauthenticatedPrincipal)
        );

        assertTrue(ex.getMessage().contains("not associated with an authorized shop tenant"));
    }

    @Test
    @DisplayName("Zero-Trust Security: Should throw ForbiddenException if store is inactive or suspended")
    void getDashboard_Forbidden_WhenShopInactive() {
        shopA.setStatus("INACTIVE");
        when(shopRepository.findWithDetailsByTenantId(101L)).thenReturn(Optional.of(shopA));

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                shopOwnerService.getDashboard(principalA)
        );

        assertTrue(ex.getMessage().contains("is currently INACTIVE"));
    }

    @Test
    @DisplayName("Cross-Tenant Isolation: Shop Holder A cannot access or resolve Tenant B store")
    void crossTenantIsolation_ShopOwnerCannotAccessOtherShop() {
        UserPrincipal principalB = UserPrincipal.builder()
                .id(20L)
                .username("beta_owner")
                .tenantId(999L) // Tenant B
                .active(true)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_SHOP_OWNER")))
                .build();

        when(shopRepository.findWithDetailsByTenantId(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                shopOwnerService.getDashboard(principalB)
        );

        verify(shopRepository).findWithDetailsByTenantId(999L);
        // Tenant A repository call never triggered for User B
        verify(shopRepository, never()).findWithDetailsByTenantId(101L);
    }

    @Test
    @DisplayName("Profile: Should update allowable operational fields and configuration while maintaining tenant isolation")
    void updateProfile_Success() {
        when(shopRepository.findWithDetailsByTenantId(101L)).thenReturn(Optional.of(shopA));
        when(shopRepository.save(any(Shop.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ShopConfiguration config = ShopConfiguration.builder().shop(shopA).build();
        when(shopConfigurationRepository.findByShopId(201L)).thenReturn(Optional.of(config));
        when(shopConfigurationRepository.save(any(ShopConfiguration.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateShopOwnerProfileRequest request = UpdateShopOwnerProfileRequest.builder()
                .phone("+91 8888877777")
                .address("New Storefront Street 4")
                .city("Hyderabad")
                .taxNumber("36ABCDE1234F1Z5")
                .defaultTaxRate(new BigDecimal("18.00"))
                .invoicePrefix("ALPHA-")
                .build();

        ShopDetailResponse response = shopOwnerService.updateProfile(principalA, request);

        assertNotNull(response);
        assertEquals("+91 8888877777", shopA.getPhone());
        assertEquals("New Storefront Street 4", shopA.getAddress());
        assertEquals("36ABCDE1234F1Z5", config.getTaxNumber());
        assertEquals(new BigDecimal("18.00"), config.getDefaultTaxRate());

        verify(auditService).logAction(
                eq(10L),
                eq("alpha_owner"),
                eq(101L),
                eq("SHOP_OWNER_UPDATED_PROFILE"),
                eq("SHOP"),
                eq("201"),
                anyString(),
                anyString()
        );
    }
}
