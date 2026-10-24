package com.commoncrm.platform.module.employee.entity;

import com.commoncrm.platform.common.entity.BaseEntity;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "employees", uniqueConstraints = {
        @UniqueConstraint(name = "uk_tenant_employee_code", columnNames = {"tenant_id", "employee_code"}),
        @UniqueConstraint(name = "uk_employee_user", columnNames = {"user_id"})
}, indexes = {
        @Index(name = "idx_emp_tenant_shop", columnList = "tenant_id, shop_id"),
        @Index(name = "idx_emp_status", columnList = "status"),
        @Index(name = "idx_emp_designation", columnList = "designation"),
        @Index(name = "idx_emp_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false, foreignKey = @ForeignKey(name = "fk_employee_shop"))
    private Shop shop;

    @OneToOne(fetch = FetchType.LAZY, optional = false, cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_employee_user"))
    private User user;

    @Column(name = "employee_code", nullable = false, length = 50)
    private String employeeCode;

    @Column(nullable = false, length = 100)
    private String designation; // e.g., Store Manager, Cashier, Sales Associate, Inventory Clerk

    @Column(length = 80)
    private String department; // e.g., Sales, Cash Counter, Warehouse, Management

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(name = "alternate_phone", length = 20)
    private String alternatePhone;

    @Column(length = 255)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Column(name = "monthly_salary", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal monthlySalary = BigDecimal.ZERO;

    @Column(name = "salary_payout_method", length = 40)
    @Builder.Default
    private String salaryPayoutMethod = "BANK_TRANSFER"; // BANK_TRANSFER, CASH, UPI, CHEQUE

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    @Column(name = "bank_ifsc_code", length = 30)
    private String bankIfscCode;

    @Column(name = "pan_or_id_number", length = 50)
    private String panOrIdNumber;

    @Column(name = "emergency_contact_name", length = 120)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 20)
    private String emergencyContactPhone;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, ON_LEAVE, TERMINATED

    @Column(length = 500)
    private String notes;
}
