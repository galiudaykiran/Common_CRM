package com.commoncrm.platform.module.employee.service;

import com.commoncrm.platform.common.audit.service.AuditService;
import com.commoncrm.platform.common.exception.ForbiddenException;
import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.businesstype.entity.BusinessType;
import com.commoncrm.platform.module.employee.dto.CreateEmployeeRequest;
import com.commoncrm.platform.module.employee.dto.EmployeeResponse;
import com.commoncrm.platform.module.employee.dto.UpdateEmployeeRequest;
import com.commoncrm.platform.module.employee.entity.Employee;
import com.commoncrm.platform.module.employee.repository.EmployeeRepository;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.service.ShopContextService;
import com.commoncrm.platform.module.tenant.entity.Tenant;
import com.commoncrm.platform.module.user.entity.Role;
import com.commoncrm.platform.module.user.entity.User;
import com.commoncrm.platform.module.user.repository.RoleRepository;
import com.commoncrm.platform.module.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private ShopContextService shopContextService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuditService auditService;

    private EmployeeService employeeService;

    private Tenant tenantA;
    private Shop shopA;
    private UserPrincipal principalA;
    private Role cashierRole;

    @BeforeEach
    void setUp() {
        employeeService = new EmployeeService(
                employeeRepository,
                userRepository,
                roleRepository,
                shopContextService,
                passwordEncoder,
                auditService
        );

        tenantA = Tenant.builder().code("TENANT-A").name("Alpha Retailers").status("ACTIVE").build();
        tenantA.setId(101L);

        BusinessType bt = BusinessType.builder().code("FASHION").name("Fashion").build();
        bt.setId(1L);

        shopA = Shop.builder().tenant(tenantA).businessType(bt).code("ALPHA-01").name("Alpha Store").status("ACTIVE").build();
        shopA.setId(201L);

        principalA = UserPrincipal.builder()
                .id(10L)
                .tenantId(101L)
                .username("alpha_owner")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_SHOP_OWNER")))
                .build();

        cashierRole = Role.builder().code("CASHIER").name("Cashier").build();
    }

    @Test
    @DisplayName("Create Employee: Should successfully create employee with phone, address, salary, and banking")
    void createEmployee_Success() {
        when(shopContextService.requireCurrentShop(principalA)).thenReturn(shopA);
        when(userRepository.existsByUsername("ramesh_cashier")).thenReturn(false);
        when(userRepository.existsByEmail("ramesh@alpha.com")).thenReturn(false);
        when(roleRepository.findByCode("CASHIER")).thenReturn(Optional.of(cashierRole));
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPass");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(55L);
            return u;
        });
        when(employeeRepository.save(any(Employee.class))).thenAnswer(i -> {
            Employee e = i.getArgument(0);
            e.setId(88L);
            return e;
        });

        CreateEmployeeRequest req = CreateEmployeeRequest.builder()
                .fullName("Ramesh Kumar")
                .username("ramesh_cashier")
                .email("ramesh@alpha.com")
                .phone("+91 9876543210")
                .address("Shop Staff Quarters 4")
                .city("Hyderabad")
                .state("Telangana")
                .postalCode("500001")
                .designation("Cash Counter Head")
                .roleCode("CASHIER")
                .joiningDate(LocalDate.now())
                .monthlySalary(new BigDecimal("28000.00"))
                .salaryPayoutMethod("BANK_TRANSFER")
                .bankAccountNumber("123456789012")
                .bankIfscCode("SBIN0001234")
                .emergencyContactName("Sunita Kumar")
                .emergencyContactPhone("+91 9999988888")
                .build();

        EmployeeResponse res = employeeService.createEmployee(principalA, req);

        assertNotNull(res);
        assertEquals(88L, res.getId());
        assertEquals("Ramesh Kumar", res.getFullName());
        assertEquals("+91 9876543210", res.getPhone());
        assertEquals(new BigDecimal("28000.00"), res.getMonthlySalary());
        assertEquals("CASHIER", res.getRoleCode());

        verify(auditService).logAction(
                eq(10L), eq("alpha_owner"), eq(101L), eq("EMPLOYEE_CREATED"), eq("EMPLOYEE"), eq("88"), isNull(), anyString()
        );
    }

    @Test
    @DisplayName("Role Privilege Escalation Defense: Shop Owner cannot assign PLATFORM_ADMIN or unauthorized roles")
    void createEmployee_Forbidden_PrivilegeEscalation() {
        when(shopContextService.requireCurrentShop(principalA)).thenReturn(shopA);
        when(userRepository.existsByUsername("bad_actor")).thenReturn(false);
        when(userRepository.existsByEmail("bad@actor.com")).thenReturn(false);

        CreateEmployeeRequest req = CreateEmployeeRequest.builder()
                .fullName("Bad Actor")
                .username("bad_actor")
                .email("bad@actor.com")
                .phone("+91 9000000000")
                .designation("Fake Admin")
                .roleCode("PLATFORM_ADMIN")
                .build();

        assertThrows(ForbiddenException.class, () ->
                employeeService.createEmployee(principalA, req)
        );

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Cross-Tenant Isolation: Shop Owner cannot view or update an employee belonging to another tenant")
    void crossTenantIsolation_DeniedForOtherTenantEmployee() {
        when(shopContextService.requireCurrentShop(principalA)).thenReturn(shopA);
        // Tenant A ID is 101L; query for employee 99L on Tenant 101L returns empty
        when(employeeRepository.findByIdAndTenantId(99L, 101L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                employeeService.getEmployeeById(principalA, 99L)
        );

        verify(employeeRepository).findByIdAndTenantId(99L, 101L);
    }
}
