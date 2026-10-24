package com.commoncrm.platform.module.employee.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEmployeeRequest {

    @NotBlank(message = "Employee full name is required")
    @Size(max = 120, message = "Full name cannot exceed 120 characters")
    private String fullName;

    @NotBlank(message = "Username is required for system login")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Email address is required")
    @Email(message = "Invalid email address format")
    @Size(max = 120, message = "Email cannot exceed 120 characters")
    private String email;

    private String password;

    @NotBlank(message = "Contact phone number is required")
    @Size(max = 20, message = "Phone number cannot exceed 20 characters")
    private String phone;

    @Size(max = 20, message = "Alternate phone cannot exceed 20 characters")
    private String alternatePhone;

    @Size(max = 255, message = "Address cannot exceed 255 characters")
    private String address;

    @Size(max = 100, message = "City cannot exceed 100 characters")
    private String city;

    @Size(max = 100, message = "State cannot exceed 100 characters")
    private String state;

    @Size(max = 20, message = "Postal code cannot exceed 20 characters")
    private String postalCode;

    @NotBlank(message = "Designation/job title is required")
    @Size(max = 100, message = "Designation cannot exceed 100 characters")
    private String designation;

    @Size(max = 80, message = "Department cannot exceed 80 characters")
    private String department;

    private String roleCode; // CASHIER, STORE_MANAGER, SALES_ASSOCIATE, INVENTORY_CLERK, SHOP_EMPLOYEE

    private LocalDate joiningDate;

    @DecimalMin(value = "0.00", message = "Monthly salary cannot be negative")
    private BigDecimal monthlySalary;

    private String salaryPayoutMethod; // BANK_TRANSFER, CASH, UPI, CHEQUE

    @Size(max = 50, message = "Bank account number cannot exceed 50 characters")
    private String bankAccountNumber;

    @Size(max = 30, message = "Bank IFSC code cannot exceed 30 characters")
    private String bankIfscCode;

    @Size(max = 50, message = "PAN / ID number cannot exceed 50 characters")
    private String panOrIdNumber;

    @Size(max = 120, message = "Emergency contact name cannot exceed 120 characters")
    private String emergencyContactName;

    @Size(max = 20, message = "Emergency contact phone cannot exceed 20 characters")
    private String emergencyContactPhone;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;
}
