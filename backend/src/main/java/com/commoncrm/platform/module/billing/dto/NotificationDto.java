package com.commoncrm.platform.module.billing.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

public class NotificationDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateScheduleRequest {
        @NotNull(message = "Customer ID is required")
        private Long customerId;

        @NotBlank(message = "Title is required")
        private String title;

        @Builder.Default
        private String scheduleType = "SAME_DAY_MONTHLY";

        @Min(value = 1, message = "Day of month must be between 1 and 31")
        @Max(value = 31, message = "Day of month must be between 1 and 31")
        private int dayOfMonth;

        @Builder.Default
        private String channel = "SMS"; // SMS, WHATSAPP, EMAIL

        @NotBlank(message = "Message template is required")
        private String messageTemplate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ScheduleResponse {
        private Long id;
        private Long customerId;
        private String customerName;
        private String customerPhone;
        private String title;
        private String scheduleType;
        private int dayOfMonth;
        private String channel;
        private String messageTemplate;
        private boolean active;
        private String createdByName;
        private Instant lastSentAt;
        private LocalDate nextRunDate;
        private Instant createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DeliveryLogResponse {
        private Long id;
        private Long customerId;
        private String customerName;
        private String notificationType;
        private String referenceInvoiceNumber;
        private String recipientPhone;
        private String recipientEmail;
        private String channel;
        private String messageContent;
        private String deliveryStatus;
        private String failureReason;
        private Instant createdAt;
    }
}
