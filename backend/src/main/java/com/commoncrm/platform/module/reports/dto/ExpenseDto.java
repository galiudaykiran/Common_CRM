package com.commoncrm.platform.module.reports.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public class ExpenseDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateExpenseRequest {
        @NotBlank(message = "Category is required")
        private String category; // RENT, UTILITIES, STAFF_WAGES, MAINTENANCE, PACKAGING, TRANSPORT, MISCELLANEOUS

        @NotBlank(message = "Title is required")
        private String title;

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        private BigDecimal amount;

        @NotNull(message = "Expense date is required")
        private LocalDate expenseDate;

        private String paymentMode; // CASH, UPI, BANK_TRANSFER, CARD
        private String receiptReference;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExpenseResponse {
        private Long id;
        private String category;
        private String title;
        private BigDecimal amount;
        private LocalDate expenseDate;
        private String paymentMode;
        private String receiptReference;
        private String notes;
        private String createdByName;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryExpenseBreakdown {
        private String category;
        private BigDecimal totalAmount;
        private double percentage;
    }
}
