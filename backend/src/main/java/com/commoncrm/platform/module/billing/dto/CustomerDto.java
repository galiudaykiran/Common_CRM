package com.commoncrm.platform.module.billing.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

public class CustomerDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateCustomerRequest {
        @NotBlank(message = "Customer name is required")
        private String name;

        @NotBlank(message = "Customer phone is required")
        private String phone;

        private String email;
        private String address;
        private String city;
        private String state;
        private String gstin;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CustomerResponse {
        private Long id;
        private String name;
        private String phone;
        private String email;
        private String address;
        private String city;
        private String state;
        private String gstin;
        private BigDecimal totalSpent;
        private BigDecimal creditBalance;
        private Instant createdAt;
    }
}
