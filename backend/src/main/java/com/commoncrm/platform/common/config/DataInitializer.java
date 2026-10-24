package com.commoncrm.platform.common.config;

import com.commoncrm.platform.module.businesstype.entity.BusinessType;
import com.commoncrm.platform.module.businesstype.repository.BusinessTypeRepository;
import com.commoncrm.platform.module.shop.entity.Module;
import com.commoncrm.platform.module.shop.repository.ModuleRepository;
import com.commoncrm.platform.module.user.entity.Permission;
import com.commoncrm.platform.module.user.entity.Role;
import com.commoncrm.platform.module.user.entity.User;
import com.commoncrm.platform.module.user.repository.PermissionRepository;
import com.commoncrm.platform.module.user.repository.RoleRepository;
import com.commoncrm.platform.module.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final BusinessTypeRepository businessTypeRepository;
    private final ModuleRepository moduleRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            PermissionRepository permissionRepository,
            RoleRepository roleRepository,
            UserRepository userRepository,
            BusinessTypeRepository businessTypeRepository,
            ModuleRepository moduleRepository,
            PasswordEncoder passwordEncoder) {
        this.permissionRepository = permissionRepository;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.businessTypeRepository = businessTypeRepository;
        this.moduleRepository = moduleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking and initializing baseline platform metadata...");

        // 1. Initialize Permissions
        Map<String, String[]> permissionsToCreate = new LinkedHashMap<>();
        permissionsToCreate.put("PLATFORM_ADMIN_ACCESS", new String[]{"PLATFORM", "Access platform admin portal"});
        permissionsToCreate.put("TENANT_CREATE", new String[]{"TENANT", "Create tenant accounts"});
        permissionsToCreate.put("TENANT_READ", new String[]{"TENANT", "View tenant accounts"});
        permissionsToCreate.put("TENANT_UPDATE", new String[]{"TENANT", "Update tenant accounts"});
        permissionsToCreate.put("TENANT_STATUS", new String[]{"TENANT", "Change tenant operational status"});
        permissionsToCreate.put("SHOP_CREATE", new String[]{"SHOP", "Create and onboard new shops"});
        permissionsToCreate.put("SHOP_READ", new String[]{"SHOP", "View shop details and configurations"});
        permissionsToCreate.put("SHOP_UPDATE", new String[]{"SHOP", "Update shop details and configurations"});
        permissionsToCreate.put("SHOP_STATUS", new String[]{"SHOP", "Change shop active/inactive status"});
        permissionsToCreate.put("BUSINESS_TYPE_MANAGE", new String[]{"CONFIG", "Manage business types"});
        permissionsToCreate.put("MODULE_MANAGE", new String[]{"CONFIG", "Manage platform feature modules"});
        permissionsToCreate.put("USER_MANAGE", new String[]{"USER", "Manage platform and tenant users"});
        permissionsToCreate.put("AUDIT_VIEW", new String[]{"AUDIT", "View security and administrative audit logs"});

        // Shop-level fine-grained operational permissions
        permissionsToCreate.put("SHOP_VIEW", new String[]{"SHOP", "View authorized shop profile"});
        permissionsToCreate.put("SHOP_UPDATE", new String[]{"SHOP", "Update authorized shop profile and settings"});
        permissionsToCreate.put("PRODUCT_VIEW", new String[]{"PRODUCT", "View store products and catalog"});
        permissionsToCreate.put("PRODUCT_CREATE", new String[]{"PRODUCT", "Create new store product"});
        permissionsToCreate.put("PRODUCT_UPDATE", new String[]{"PRODUCT", "Update existing store product"});
        permissionsToCreate.put("PRODUCT_DELETE", new String[]{"PRODUCT", "Deactivate or delete store product"});
        permissionsToCreate.put("CATEGORY_VIEW", new String[]{"CATEGORY", "View product categories"});
        permissionsToCreate.put("CATEGORY_CREATE", new String[]{"CATEGORY", "Create product category"});
        permissionsToCreate.put("CATEGORY_UPDATE", new String[]{"CATEGORY", "Update product category"});
        permissionsToCreate.put("CATEGORY_DELETE", new String[]{"CATEGORY", "Delete product category"});
        permissionsToCreate.put("INVENTORY_VIEW", new String[]{"INVENTORY", "View stock levels and inventory ledger"});
        permissionsToCreate.put("INVENTORY_UPDATE", new String[]{"INVENTORY", "Update stock quantity"});
        permissionsToCreate.put("INVENTORY_ADJUST", new String[]{"INVENTORY", "Perform stock adjustment audit"});
        permissionsToCreate.put("SALE_VIEW", new String[]{"SALE", "View sales orders and checkout receipts"});
        permissionsToCreate.put("SALE_CREATE", new String[]{"SALE", "Execute POS checkout and generate sales bill"});
        permissionsToCreate.put("SALE_CANCEL", new String[]{"SALE", "Void or cancel a sale order"});
        permissionsToCreate.put("CUSTOMER_VIEW", new String[]{"CUSTOMER", "View store customer directory"});
        permissionsToCreate.put("CUSTOMER_CREATE", new String[]{"CUSTOMER", "Register new customer"});
        permissionsToCreate.put("CUSTOMER_UPDATE", new String[]{"CUSTOMER", "Update customer profile"});
        permissionsToCreate.put("SUPPLIER_VIEW", new String[]{"SUPPLIER", "View store suppliers"});
        permissionsToCreate.put("SUPPLIER_CREATE", new String[]{"SUPPLIER", "Register new supplier"});
        permissionsToCreate.put("SUPPLIER_UPDATE", new String[]{"SUPPLIER", "Update supplier information"});
        permissionsToCreate.put("EMPLOYEE_VIEW", new String[]{"EMPLOYEE", "View shop staff and cashier accounts"});
        permissionsToCreate.put("EMPLOYEE_CREATE", new String[]{"EMPLOYEE", "Create shop staff account"});
        permissionsToCreate.put("EMPLOYEE_UPDATE", new String[]{"EMPLOYEE", "Update shop staff account"});
        permissionsToCreate.put("EMPLOYEE_DISABLE", new String[]{"EMPLOYEE", "Disable shop staff account"});
        permissionsToCreate.put("EXPENSE_VIEW", new String[]{"EXPENSE", "View shop operational expenses"});
        permissionsToCreate.put("EXPENSE_CREATE", new String[]{"EXPENSE", "Log shop operational expense"});
        permissionsToCreate.put("EXPENSE_UPDATE", new String[]{"EXPENSE", "Update shop operational expense"});
        permissionsToCreate.put("REPORT_VIEW", new String[]{"REPORT", "View sales analytics and store reports"});
        permissionsToCreate.put("SHOP_SETTINGS_VIEW", new String[]{"CONFIG", "View shop invoice and tax settings"});
        permissionsToCreate.put("SHOP_SETTINGS_UPDATE", new String[]{"CONFIG", "Update shop invoice and tax settings"});

        Set<Permission> allPermissions = new HashSet<>();
        Set<Permission> shopOwnerPermissions = new HashSet<>();

        for (Map.Entry<String, String[]> entry : permissionsToCreate.entrySet()) {
            String code = entry.getKey();
            String module = entry.getValue()[0];
            String desc = entry.getValue()[1];

            Permission perm = permissionRepository.findByCode(code).orElseGet(() ->
                    permissionRepository.save(Permission.builder()
                            .code(code)
                            .module(module)
                            .description(desc)
                            .build())
            );
            allPermissions.add(perm);
            // Shop owner gets all non-PLATFORM permissions
            if (!code.equals("PLATFORM_ADMIN_ACCESS") && !code.startsWith("TENANT_") && !code.equals("BUSINESS_TYPE_MANAGE") && !code.equals("MODULE_MANAGE") && !code.equals("USER_MANAGE") && !code.equals("SHOP_CREATE") && !code.equals("SHOP_STATUS")) {
                shopOwnerPermissions.add(perm);
            }
        }

        // 2. Initialize Roles
        Role adminRole = roleRepository.findByCode("PLATFORM_ADMIN").orElseGet(() ->
                roleRepository.save(Role.builder()
                        .code("PLATFORM_ADMIN")
                        .name("Platform Super Administrator")
                        .roleType("PLATFORM")
                        .isSystem(true)
                        .permissions(new HashSet<>(allPermissions))
                        .build())
        );
        // Ensure admin has all permissions
        adminRole.setPermissions(new HashSet<>(allPermissions));
        roleRepository.save(adminRole);

        Role shopOwnerRole = roleRepository.findByCode("SHOP_OWNER").orElseGet(() ->
                roleRepository.save(Role.builder()
                        .code("SHOP_OWNER")
                        .name("Shop Business Owner")
                        .roleType("TENANT")
                        .isSystem(true)
                        .permissions(new HashSet<>(shopOwnerPermissions))
                        .build())
        );
        shopOwnerRole.setPermissions(new HashSet<>(shopOwnerPermissions));
        roleRepository.save(shopOwnerRole);

        roleRepository.findByCode("SHOP_EMPLOYEE").orElseGet(() ->
                roleRepository.save(Role.builder()
                        .code("SHOP_EMPLOYEE")
                        .name("Shop Staff / General Employee")
                        .roleType("TENANT")
                        .isSystem(true)
                        .permissions(new HashSet<>())
                        .build())
        );

        roleRepository.findByCode("STORE_MANAGER").orElseGet(() ->
                roleRepository.save(Role.builder()
                        .code("STORE_MANAGER")
                        .name("Store Operations Manager")
                        .roleType("TENANT")
                        .isSystem(true)
                        .permissions(new HashSet<>(shopOwnerPermissions))
                        .build())
        );

        roleRepository.findByCode("CASHIER").orElseGet(() ->
                roleRepository.save(Role.builder()
                        .code("CASHIER")
                        .name("Store Cashier / Billing Staff")
                        .roleType("TENANT")
                        .isSystem(true)
                        .permissions(new HashSet<>())
                        .build())
        );

        roleRepository.findByCode("SALES_ASSOCIATE").orElseGet(() ->
                roleRepository.save(Role.builder()
                        .code("SALES_ASSOCIATE")
                        .name("Floor Sales Associate")
                        .roleType("TENANT")
                        .isSystem(true)
                        .permissions(new HashSet<>())
                        .build())
        );

        roleRepository.findByCode("INVENTORY_CLERK").orElseGet(() ->
                roleRepository.save(Role.builder()
                        .code("INVENTORY_CLERK")
                        .name("Inventory & Stock Clerk")
                        .roleType("TENANT")
                        .isSystem(true)
                        .permissions(new HashSet<>())
                        .build())
        );

        // 3. Initialize Default Platform Admin Account
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .tenantId(null) // Platform Admins are not restricted to a single tenant
                    .username("admin")
                    .email("admin@commoncrm.com")
                    .fullName("Platform Administrator")
                    .phone("+91 9876543210")
                    .passwordHash(passwordEncoder.encode("Admin@12345"))
                    .status("ACTIVE")
                    .roles(Set.of(adminRole))
                    .build();
            userRepository.save(admin);
            log.info("Default Platform Admin user created: admin / Admin@12345");
        }

        // 4. Initialize Baseline Business Types
        List<Object[]> defaultBusinessTypes = List.of(
                new Object[]{"FASHION", "Dress & Fashion Shop", "Clothing, boutiques, garments and textile stores", 1},
                new Object[]{"GROCERY", "Kirana & Grocery Store", "Supermarkets, daily provisions and grocery stores", 2},
                new Object[]{"FANCY_STORE", "Fancy & Gift Store", "Stationery, gifts, toys and novelties", 3},
                new Object[]{"RESTAURANT", "Restaurant & Dining", "Cafes, dine-in restaurants and eateries", 4},
                new Object[]{"HOTEL", "Hotel & Lodging", "Accommodations, suites and resort bookings", 5},
                new Object[]{"ELECTRONICS", "Electronics & Appliances", "Mobile, computers and consumer electronics", 6},
                new Object[]{"COSMETICS", "Cosmetics & Beauty Store", "Skincare, cosmetics and wellness products", 7},
                new Object[]{"OTHER", "Other SMB / General Business", "General retail and commercial trade", 8}
        );

        for (Object[] bt : defaultBusinessTypes) {
            String code = (String) bt[0];
            if (!businessTypeRepository.existsByCode(code)) {
                businessTypeRepository.save(BusinessType.builder()
                        .code(code)
                        .name((String) bt[1])
                        .description((String) bt[2])
                        .displayOrder((Integer) bt[3])
                        .active(true)
                        .build());
            }
        }

        // 5. Initialize Baseline Feature Modules
        List<Object[]> defaultModules = List.of(
                new Object[]{"POS", "Point of Sale", "Express checkout, cash registers and receipt printing", true, true},
                new Object[]{"INVENTORY", "Inventory Management", "Stock tracking, low-stock alerts and suppliers", true, true},
                new Object[]{"BILLING", "Invoicing & GST Billing", "Tax invoices, quotation and credit management", true, true},
                new Object[]{"TABLE_MGMT", "Table & Room Management", "Hospitality table layouts and reservation tracking", true, false},
                new Object[]{"ORDERS", "Kitchen & Service Orders", "Order ticket generation and kitchen displays", true, false},
                new Object[]{"REPORTS", "Analytics & Reports", "Financial statements, profit/loss and sales analytics", true, false}
        );

        for (Object[] m : defaultModules) {
            String code = (String) m[0];
            if (!moduleRepository.existsByCode(code)) {
                moduleRepository.save(Module.builder()
                        .code(code)
                        .name((String) m[1])
                        .description((String) m[2])
                        .active((Boolean) m[3])
                        .coreModule((Boolean) m[4])
                        .build());
            }
        }

        log.info("Baseline platform initialization completed successfully.");
    }
}
