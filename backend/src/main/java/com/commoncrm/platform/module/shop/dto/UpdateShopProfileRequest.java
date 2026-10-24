package com.commoncrm.platform.module.shop.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateShopProfileRequest(
        @NotBlank(message = "Shop name is required")
        String name,
        String phone,
        String email,
        String address,
        String city,
        String state,
        String postalCode,
        String currency,
        String timezone
) {}
