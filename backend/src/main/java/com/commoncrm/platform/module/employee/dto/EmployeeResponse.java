package com.commoncrm.platform.module.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeResponse {

    private Long id;
    private String employeeCode;
    private Long tenantId;
    private Long shopId;
    private String shopName;
    private Long userId;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String alternatePhone;
    private String address;
    private String city;
    private String state;
    private String postalCode;
    private String designation;
    private String department;
    private String roleCode;
    private String roleName;
    private LocalDate joiningDate;
    private BigDecimal monthlySalary;
    private String salaryPayoutMethod;
    private String bankAccountNumber;
    private String bankIfscCode;
    private String panOrIdNumber;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String status;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}
