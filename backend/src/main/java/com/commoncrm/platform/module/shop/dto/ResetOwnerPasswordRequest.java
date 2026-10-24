package com.commoncrm.platform.module.shop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetOwnerPasswordRequest(
        @NotBlank(message = "New password must not be blank")
        @Size(min = 8, message = "Password must be at least 8 characters")
        String newPassword,

        @NotBlank(message = "Security verification OTP is required")
        String otp
) {}
