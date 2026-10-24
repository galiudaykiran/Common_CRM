package com.commoncrm.platform.module.shop.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateShopRequest {

    private Long tenantId; // If provided, attaches to existing tenant. If null, a new tenant is created automatically.
    private String tenantName;
    private String tenantCode;

    @NotBlank(message = "Shop code is required")
    @Size(max = 50, message = "Shop code must be at most 50 characters")
    private String shopCode;

    @NotBlank(message = "Shop name is required")
    @Size(max = 150, message = "Shop name must be at most 150 characters")
    private String shopName;

    @NotNull(message = "Business type ID is required")
    private Long businessTypeId;

    @Pattern(regexp = "^[0-9+()\\s-]{7,20}$", message = "Invalid phone number format")
    private String phone;

    @Email(message = "Invalid shop email format")
    private String email;

    private String address;
    private String city;
    private String state;
    private String postalCode;

    @Builder.Default
    private String currency = "INR";

    @Builder.Default
    private String timezone = "Asia/Kolkata";

    // --- Shop Owner Account Credentials ---
    @NotBlank(message = "Shop owner username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String ownerUsername;

    @NotBlank(message = "Shop owner email is required")
    @Email(message = "Invalid shop owner email format")
    private String ownerEmail;

    @NotBlank(message = "Shop owner password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String ownerPassword;

    @NotBlank(message = "Shop owner full name is required")
    private String ownerFullName;

    private String ownerPhone;

    // --- Configuration ---
    private String taxNumber;
    @DecimalMin(value = "0.0", message = "Tax rate cannot be negative")
    @DecimalMax(value = "100.0", message = "Tax rate cannot exceed 100%")
    private BigDecimal defaultTaxRate;
    private String invoicePrefix;
    private String settingsJson;

    // --- Enabled Modules ---
    private List<Long> enabledModuleIds;
}
