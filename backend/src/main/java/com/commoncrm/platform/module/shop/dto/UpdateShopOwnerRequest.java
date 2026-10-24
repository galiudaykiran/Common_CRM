package com.commoncrm.platform.module.shop.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdateShopOwnerRequest(
        @NotBlank(message = "Full name is required")
        String fullName,

        @NotBlank(message = "Username is required")
        String username,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        String phone,

        Boolean syncShopContact,

        @NotBlank(message = "Security verification OTP is required")
        String otp
) {}
