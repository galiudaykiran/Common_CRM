package com.commoncrm.platform.module.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record GenerateOtpRequest(
        @NotBlank(message = "Purpose must not be blank")
        String purpose
) {}
