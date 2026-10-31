package com.commoncrm.platform.module.shop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreAlertResponse {
    private String id; // Matches alertKey (e.g. "low-stock-42")
    private String alertKey;
    private String type; // "LOW_STOCK", "DAMAGE_WARNING", "DAILY_CLOSING_REMINDER", "REVENUE_TARGET", "GENERAL"
    private String title;
    private String message;
    private String severity; // "critical", "warning", "info"
    private String timestamp;
    private boolean read;
    private String actionLabel;
    private String actionUrl;
}
