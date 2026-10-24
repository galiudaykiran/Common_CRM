package com.commoncrm.platform.module.employee.service;

import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.common.audit.service.AuditService;
import com.commoncrm.platform.common.exception.BusinessException;
import com.commoncrm.platform.common.exception.DuplicateResourceException;
import com.commoncrm.platform.common.exception.ForbiddenException;
import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.employee.dto.*;
import com.commoncrm.platform.module.employee.entity.Employee;
import com.commoncrm.platform.module.employee.repository.EmployeeRepository;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.service.ShopContextService;
import com.commoncrm.platform.module.user.entity.Role;
import com.commoncrm.platform.module.user.entity.User;
import com.commoncrm.platform.module.user.repository.RoleRepository;
import com.commoncrm.platform.module.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Service
public class EmployeeService {

    private static final Set<String> ALLOWED_STAFF_ROLES = Set.of(
            "SHOP_EMPLOYEE",
            "STORE_MANAGER",
            "CASHIER",
            "SALES_ASSOCIATE",
            "INVENTORY_CLERK"
    );

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ShopContextService shopContextService;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public EmployeeService(EmployeeRepository employeeRepository,
                           UserRepository userRepository,
                           RoleRepository roleRepository,
                           ShopContextService shopContextService,
                           PasswordEncoder passwordEncoder,
                           AuditService auditService) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.shopContextService = shopContextService;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PageResponse<EmployeeResponse> getEmployees(UserPrincipal principal,
                                                       String search,
                                                       String status,
                                                       String designation,
                                                       Pageable pageable) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Page<Employee> page = employeeRepository.searchEmployees(
                shop.getTenant().getId(),
                shop.getId(),
                search,
                status,
                designation,
                pageable
        );
        return PageResponse.from(page.map(this::mapToResponse));
    }

    @Transactional(readOnly = true)
    public EmployeeStatsResponse getStats(UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Long tenantId = shop.getTenant().getId();
        Long shopId = shop.getId();

        long total = employeeRepository.countByTenantIdAndShopId(tenantId, shopId);
        long active = employeeRepository.countByTenantIdAndStatus(tenantId, "ACTIVE");
        long onLeave = employeeRepository.countByTenantIdAndStatus(tenantId, "ON_LEAVE");
        long inactive = employeeRepository.countByTenantIdAndStatus(tenantId, "INACTIVE")
                      + employeeRepository.countByTenantIdAndStatus(tenantId, "TERMINATED");

        BigDecimal monthlyPayroll = employeeRepository.calculateActiveMonthlyPayroll(tenantId, shopId);

        return EmployeeStatsResponse.builder()
                .totalEmployees(total)
                .activeEmployees(active)
                .onLeaveEmployees(onLeave)
                .inactiveEmployees(inactive)
                .monthlyPayroll(monthlyPayroll != null ? monthlyPayroll : BigDecimal.ZERO)
                .build();
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeById(UserPrincipal principal, Long id) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Employee employee = employeeRepository.findByIdAndTenantId(id, shop.getTenant().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff record not found with ID: " + id));
        return mapToResponse(employee);
    }

    @Transactional
    public EmployeeResponse createEmployee(UserPrincipal principal, CreateEmployeeRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Long tenantId = shop.getTenant().getId();

        // 1. Validate Uniqueness
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username '" + request.getUsername() + "' is already in use");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email '" + request.getEmail() + "' is already registered");
        }

        // 2. Validate Role Assignment
        String roleCode = (request.getRoleCode() != null && !request.getRoleCode().isBlank())
                ? request.getRoleCode().toUpperCase()
                : "SHOP_EMPLOYEE";

        if (!ALLOWED_STAFF_ROLES.contains(roleCode)) {
            throw new ForbiddenException("Invalid role assignment: Store owners cannot assign role '" + roleCode + "'");
        }

        Role assignedRole = roleRepository.findByCode(roleCode)
                .orElseGet(() -> roleRepository.findByCode("SHOP_EMPLOYEE")
                        .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleCode)));

        Set<Role> userRoles = new HashSet<>();
        userRoles.add(assignedRole);
        roleRepository.findByCode("SHOP_EMPLOYEE").ifPresent(userRoles::add);

        // 3. Generate Sequential Employee Code (e.g. EMP-001, EMP-002)
        String empCode = generateEmployeeCode(tenantId, shop.getId());

        // 4. Create User Credentials Account
        String initialPassword;
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            if (request.getPassword().trim().length() < 6) {
                throw new BusinessException("Password must be at least 6 characters");
            }
            initialPassword = request.getPassword().trim();
        } else {
            initialPassword = "Staff@12345";
        }

        User user = User.builder()
                .tenantId(tenantId)
                .username(request.getUsername().trim())
                .email(request.getEmail().trim())
                .passwordHash(passwordEncoder.encode(initialPassword))
                .fullName(request.getFullName().trim())
                .phone(request.getPhone())
                .status("ACTIVE")
                .roles(userRoles)
                .build();

        User savedUser = userRepository.save(user);

        // 5. Create Employee Profile Record
        Employee employee = Employee.builder()
                .tenantId(tenantId)
                .shop(shop)
                .user(savedUser)
                .employeeCode(empCode)
                .designation(request.getDesignation())
                .department(request.getDepartment() != null ? request.getDepartment() : "General")
                .phone(request.getPhone())
                .alternatePhone(request.getAlternatePhone())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .joiningDate(request.getJoiningDate())
                .monthlySalary(request.getMonthlySalary() != null ? request.getMonthlySalary() : BigDecimal.ZERO)
                .salaryPayoutMethod(request.getSalaryPayoutMethod() != null ? request.getSalaryPayoutMethod() : "BANK_TRANSFER")
                .bankAccountNumber(request.getBankAccountNumber())
                .bankIfscCode(request.getBankIfscCode())
                .panOrIdNumber(request.getPanOrIdNumber())
                .emergencyContactName(request.getEmergencyContactName())
                .emergencyContactPhone(request.getEmergencyContactPhone())
                .status("ACTIVE")
                .notes(request.getNotes())
                .build();

        Employee saved = employeeRepository.save(employee);

        auditService.logAction(
                principal.getId(),
                principal.getUsername(),
                tenantId,
                "EMPLOYEE_CREATED",
                "EMPLOYEE",
                saved.getId().toString(),
                null,
                "code=" + empCode + ", name=" + savedUser.getFullName() + ", role=" + roleCode + ", salary=" + saved.getMonthlySalary()
        );

        return mapToResponse(saved);
    }

    @Transactional
    public EmployeeResponse updateEmployee(UserPrincipal principal, Long id, UpdateEmployeeRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Long tenantId = shop.getTenant().getId();

        Employee employee = employeeRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff record not found with ID: " + id));

        User user = employee.getUser();

        // Email uniqueness check if changed
        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new DuplicateResourceException("Email '" + request.getEmail() + "' is already in use");
            }
            user.setEmail(request.getEmail());
        }

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());

        // Update Role if requested
        if (request.getRoleCode() != null && !request.getRoleCode().isBlank()) {
            String roleCode = request.getRoleCode().toUpperCase();
            if (!ALLOWED_STAFF_ROLES.contains(roleCode)) {
                throw new ForbiddenException("Invalid role assignment: Role '" + roleCode + "' cannot be assigned");
            }
            Role role = roleRepository.findByCode(roleCode)
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleCode));
            user.setRoles(new HashSet<>(Set.of(role)));
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            employee.setStatus(request.getStatus().toUpperCase());
            user.setStatus("TERMINATED".equalsIgnoreCase(request.getStatus()) ? "LOCKED" : "ACTIVE");
        }

        userRepository.save(user);

        // Update profile fields
        employee.setDesignation(request.getDesignation());
        employee.setDepartment(request.getDepartment());
        employee.setPhone(request.getPhone());
        employee.setAlternatePhone(request.getAlternatePhone());
        employee.setAddress(request.getAddress());
        employee.setCity(request.getCity());
        employee.setState(request.getState());
        employee.setPostalCode(request.getPostalCode());
        if (request.getJoiningDate() != null) employee.setJoiningDate(request.getJoiningDate());
        if (request.getMonthlySalary() != null) employee.setMonthlySalary(request.getMonthlySalary());
        if (request.getSalaryPayoutMethod() != null) employee.setSalaryPayoutMethod(request.getSalaryPayoutMethod());
        employee.setBankAccountNumber(request.getBankAccountNumber());
        employee.setBankIfscCode(request.getBankIfscCode());
        employee.setPanOrIdNumber(request.getPanOrIdNumber());
        employee.setEmergencyContactName(request.getEmergencyContactName());
        employee.setEmergencyContactPhone(request.getEmergencyContactPhone());
        employee.setNotes(request.getNotes());

        Employee updated = employeeRepository.save(employee);

        auditService.logAction(
                principal.getId(),
                principal.getUsername(),
                tenantId,
                "EMPLOYEE_UPDATED",
                "EMPLOYEE",
                updated.getId().toString(),
                null,
                "Updated details for " + updated.getEmployeeCode() + " (" + user.getFullName() + ")"
        );

        return mapToResponse(updated);
    }

    @Transactional
    public EmployeeResponse changeStatus(UserPrincipal principal, Long id, String newStatus) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Long tenantId = shop.getTenant().getId();

        Employee employee = employeeRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff record not found with ID: " + id));

        String oldStatus = employee.getStatus();
        String statusUpper = newStatus.toUpperCase();
        employee.setStatus(statusUpper);

        User user = employee.getUser();
        user.setStatus("TERMINATED".equals(statusUpper) ? "LOCKED" : statusUpper.equals("ACTIVE") ? "ACTIVE" : "INACTIVE");
        userRepository.save(user);

        Employee saved = employeeRepository.save(employee);

        auditService.logAction(
                principal.getId(),
                principal.getUsername(),
                tenantId,
                "EMPLOYEE_STATUS_CHANGED",
                "EMPLOYEE",
                saved.getId().toString(),
                oldStatus,
                statusUpper
        );

        return mapToResponse(saved);
    }

    @Transactional
    public void resetPassword(UserPrincipal principal, Long id, ResetEmployeePasswordRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Long tenantId = shop.getTenant().getId();

        Employee employee = employeeRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff record not found with ID: " + id));

        User user = employee.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        auditService.logAction(
                principal.getId(),
                principal.getUsername(),
                tenantId,
                "EMPLOYEE_PASSWORD_RESET",
                "USER",
                user.getId().toString(),
                null,
                "Password reset for employee " + employee.getEmployeeCode() + " (" + user.getUsername() + ")"
        );
    }

    private String generateEmployeeCode(Long tenantId, Long shopId) {
        long count = employeeRepository.countByTenantIdAndShopId(tenantId, shopId) + 1;
        String code;
        int attempt = 0;
        do {
            code = String.format("EMP-%03d", count + attempt);
            attempt++;
        } while (employeeRepository.existsByEmployeeCodeAndTenantId(code, tenantId));
        return code;
    }

    private EmployeeResponse mapToResponse(Employee emp) {
        User user = emp.getUser();
        String roleCode = "SHOP_EMPLOYEE";
        String roleName = "General Staff";

        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            Role r = user.getRoles().iterator().next();
            roleCode = r.getCode();
            roleName = r.getName();
        }

        return EmployeeResponse.builder()
                .id(emp.getId())
                .employeeCode(emp.getEmployeeCode())
                .tenantId(emp.getTenantId())
                .shopId(emp.getShop().getId())
                .shopName(emp.getShop().getName())
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(emp.getPhone())
                .alternatePhone(emp.getAlternatePhone())
                .address(emp.getAddress())
                .city(emp.getCity())
                .state(emp.getState())
                .postalCode(emp.getPostalCode())
                .designation(emp.getDesignation())
                .department(emp.getDepartment())
                .roleCode(roleCode)
                .roleName(roleName)
                .joiningDate(emp.getJoiningDate())
                .monthlySalary(emp.getMonthlySalary())
                .salaryPayoutMethod(emp.getSalaryPayoutMethod())
                .bankAccountNumber(emp.getBankAccountNumber())
                .bankIfscCode(emp.getBankIfscCode())
                .panOrIdNumber(emp.getPanOrIdNumber())
                .emergencyContactName(emp.getEmergencyContactName())
                .emergencyContactPhone(emp.getEmergencyContactPhone())
                .status(emp.getStatus())
                .notes(emp.getNotes())
                .createdAt(emp.getCreatedAt())
                .updatedAt(emp.getUpdatedAt())
                .build();
    }
}
