package com.commoncrm.platform.module.auth.dto;

public record OtpResponse(
        String otp,
        int expiresInSeconds,
        String purpose,
        String message
) {}
