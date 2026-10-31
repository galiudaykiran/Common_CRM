package com.commoncrm.platform.module.shop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertSettingsDto {
    @Builder.Default
    private int lowStockThreshold = 10;

    @Builder.Default
    private int damageCountThreshold = 10;

    @Builder.Default
    private BigDecimal damageAmountThreshold = new BigDecimal("2000");

    @Builder.Default
    private BigDecimal dailyRevenueTarget = new BigDecimal("5000");

    @Builder.Default
    private String dailyClosingReminderTime = "22:00"; // Default 10:00 PM

    @Builder.Default
    private boolean enableDailyClosingReminder = true;

    @Builder.Default
    private boolean enableSoundAlerts = true;

    @Builder.Default
    private boolean enableLowStockAlerts = true;

    @Builder.Default
    private boolean enableDamageAlerts = true;
}
