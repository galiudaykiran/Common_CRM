package com.commoncrm.platform.module.shop.service;

import com.commoncrm.platform.common.audit.service.AuditService;
import com.commoncrm.platform.common.event.EventPublisher;
import com.commoncrm.platform.common.exception.DuplicateResourceException;
import com.commoncrm.platform.module.businesstype.entity.BusinessType;
import com.commoncrm.platform.module.businesstype.repository.BusinessTypeRepository;
import com.commoncrm.platform.module.shop.dto.CreateShopRequest;
import com.commoncrm.platform.module.shop.dto.ShopDetailResponse;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShopServiceTest {

    @Mock
    private ShopRepository shopRepository;
    @Mock
    private TenantRepository tenantRepository;
    @Mock
    private BusinessTypeRepository businessTypeRepository;
    @Mock
    private ModuleRepository moduleRepository;
    @Mock
    private ShopConfigurationRepository shopConfigurationRepository;
    @Mock
    private ShopModuleRepository shopModuleRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private EventPublisher eventPublisher;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private ShopService shopService;

    private CreateShopRequest validRequest;
    private BusinessType fashionBusinessType;
    private Role shopOwnerRole;

    @BeforeEach
    void setUp() {
        validRequest = CreateShopRequest.builder()
                .shopCode("FASHION-01")
                .shopName("Elegance Boutique")
                .businessTypeId(1L)
                .phone("+91 9988776655")
                .email("contact@elegance.com")
                .address("123 MG Road")
                .city("Bengaluru")
                .state("Karnataka")
                .currency("INR")
                .timezone("Asia/Kolkata")
                .ownerUsername("boutique_owner")
                .ownerEmail("owner@elegance.com")
                .ownerPassword("SecurePassword@123")
                .ownerFullName("Priya Sharma")
                .defaultTaxRate(new BigDecimal("5.00"))
                .invoicePrefix("ELG-")
                .enabledModuleIds(List.of(10L, 11L))
                .build();

        fashionBusinessType = BusinessType.builder()
                .code("FASHION")
                .name("Dress & Fashion Shop")
                .active(true)
                .build();
        fashionBusinessType.setId(1L);

        shopOwnerRole = Role.builder()
                .code("SHOP_OWNER")
                .name("Shop Business Owner")
                .roleType("TENANT")
                .build();
        shopOwnerRole.setId(2L);
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException if shop code already exists")
    void shouldThrowWhenShopCodeExists() {
        when(shopRepository.existsByCode("FASHION-01")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> shopService.createShop(validRequest));
        verify(shopRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException if owner username already exists")
    void shouldThrowWhenOwnerUsernameExists() {
        when(shopRepository.existsByCode("FASHION-01")).thenReturn(false);
        when(userRepository.existsByUsername("boutique_owner")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> shopService.createShop(validRequest));
        verify(shopRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should atomically create Tenant, Shop, Owner, Config, Modules and emit Kafka event")
    void shouldCreateShopSuccessfully() {
        when(shopRepository.existsByCode("FASHION-01")).thenReturn(false);
        when(userRepository.existsByUsername("boutique_owner")).thenReturn(false);
        when(userRepository.existsByEmail("owner@elegance.com")).thenReturn(false);
        when(tenantRepository.existsByCode(anyString())).thenReturn(false);

        Tenant savedTenant = Tenant.builder().code("TNT-FASHION-01").name("Elegance Boutique Enterprise").status("ACTIVE").build();
        savedTenant.setId(100L);
        when(tenantRepository.save(any(Tenant.class))).thenReturn(savedTenant);

        when(businessTypeRepository.findById(1L)).thenReturn(Optional.of(fashionBusinessType));

        Shop savedShop = Shop.builder()
                .tenant(savedTenant)
                .businessType(fashionBusinessType)
                .code("FASHION-01")
                .name("Elegance Boutique")
                .currency("INR")
                .timezone("Asia/Kolkata")
                .status("ACTIVE")
                .version(0)
                .build();
        savedShop.setId(500L);
        when(shopRepository.save(any(Shop.class))).thenReturn(savedShop);

        ShopConfiguration savedConfig = ShopConfiguration.builder()
                .shop(savedShop)
                .defaultTaxRate(new BigDecimal("5.00"))
                .invoicePrefix("ELG-")
                .build();
        savedConfig.setId(600L);
        when(shopConfigurationRepository.save(any(ShopConfiguration.class))).thenReturn(savedConfig);

        Module posModule = Module.builder().code("POS").name("Point of Sale").active(true).build();
        posModule.setId(10L);
        Module invModule = Module.builder().code("INVENTORY").name("Inventory").active(true).build();
        invModule.setId(11L);
        when(moduleRepository.findAllById(anyList())).thenReturn(List.of(posModule, invModule));

        ShopModule sm1 = ShopModule.builder().shop(savedShop).module(posModule).enabled(true).build();
        ShopModule sm2 = ShopModule.builder().shop(savedShop).module(invModule).enabled(true).build();
        when(shopModuleRepository.save(any(ShopModule.class))).thenReturn(sm1, sm2);

        when(roleRepository.findByCode("SHOP_OWNER")).thenReturn(Optional.of(shopOwnerRole));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password_xyz");

        User savedOwner = User.builder()
                .tenantId(100L)
                .username("boutique_owner")
                .email("owner@elegance.com")
                .fullName("Priya Sharma")
                .status("ACTIVE")
                .build();
        savedOwner.setId(700L);
        when(userRepository.save(any(User.class))).thenReturn(savedOwner);

        ShopDetailResponse response = shopService.createShop(validRequest);

        assertNotNull(response);
        assertEquals("FASHION-01", response.getCode());
        assertEquals("Elegance Boutique", response.getName());
        assertEquals(100L, response.getTenantId());
        assertEquals("FASHION", response.getBusinessTypeCode());
        assertEquals(2, response.getModules().size());

        // Verify Kafka event published
        verify(eventPublisher, times(1)).publishEvent(eq("500"), any());
    }
}
