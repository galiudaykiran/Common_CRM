package com.commoncrm.platform.module.shop.service;

import com.commoncrm.platform.common.exception.ForbiddenException;
import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.employee.entity.Employee;
import com.commoncrm.platform.module.employee.repository.EmployeeRepository;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.repository.ShopRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Enforces strict zero-trust tenant and shop resolution directly from the verified
 * security context. Resolves employee's assigned store directly via employee record,
 * or owner/tenant store via principal.getTenantId().
 */
@Service
public class ShopContextService {

    private final ShopRepository shopRepository;
    private final EmployeeRepository employeeRepository;

    public ShopContextService(ShopRepository shopRepository) {
        this(shopRepository, null);
    }

    @Autowired
    public ShopContextService(ShopRepository shopRepository, @Lazy EmployeeRepository employeeRepository) {
        this.shopRepository = shopRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public Shop requireCurrentShop(UserPrincipal principal) {
        if (principal == null) {
            throw new ForbiddenException("Access denied: Authenticated user context is missing");
        }

        // 1. If user is an employee, resolve their assigned store directly
        if (employeeRepository != null && principal.getId() != null) {
            Optional<Employee> empOpt = employeeRepository.findByUserId(principal.getId());
            if (empOpt.isPresent() && empOpt.get().getShop() != null) {
                Shop empShop = empOpt.get().getShop();
                Shop shop = shopRepository.findWithDetailsById(empShop.getId()).orElse(empShop);
                if (!"ACTIVE".equalsIgnoreCase(shop.getStatus())) {
                    throw new ForbiddenException("Access denied: Store '" + shop.getName() + "' is currently " + shop.getStatus() + ". Please contact Platform Support.");
                }
                return shop;
            }
        }

        // 2. Fall back to tenant resolution for store owners and administrators
        if (principal.getTenantId() == null) {
            throw new ForbiddenException("Access denied: Authenticated user is not associated with an authorized shop tenant");
        }

        Shop shop = shopRepository.findWithDetailsByTenantId(principal.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("No registered business store found for tenant ID: " + principal.getTenantId()));

        if (!"ACTIVE".equalsIgnoreCase(shop.getStatus())) {
            throw new ForbiddenException("Access denied: Store '" + shop.getName() + "' is currently " + shop.getStatus() + ". Please contact Platform Support.");
        }

        return shop;
    }
}

