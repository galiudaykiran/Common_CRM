package com.commoncrm.platform.module.reports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class BusinessReportsDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FinancialSummaryResponse {
        private LocalDate startDate;
        private LocalDate endDate;
        private String periodLabel;

        private long totalInvoicesCount;
        private BigDecimal grossRevenue;
        private BigDecimal totalDiscounts;
        private BigDecimal netRevenue;
        private BigDecimal costOfGoodsSold;
        private BigDecimal grossProfit;
        private double grossMarginPercent;

        private BigDecimal operatingExpenses;
        private BigDecimal inventoryShrinkageLoss;
        private BigDecimal totalOutflows;

        private BigDecimal netProfit;
        private double netMarginPercent;
        private boolean isNetProfit; // true if netProfit >= 0, false if net loss

        private BigDecimal totalGstCollected;
        private BigDecimal averageBillValue;
        private BigDecimal previousGrossRevenue;
        private Double revenueGrowthPercent;
        private long previousInvoicesCount;

        // Channel breakdown
        private BigDecimal diningRevenue;
        private long diningBillsCount;
        private BigDecimal retailRevenue;
        private long retailInvoicesCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyTrendPoint {
        private String dateFormatted; // YYYY-MM-DD
        private BigDecimal revenue;
        private BigDecimal cogs;
        private BigDecimal grossProfit;
        private BigDecimal expenses;
        private BigDecimal netProfit;
        private long billCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentModeStat {
        private String paymentMode; // CASH, UPI, CARD, SPLIT
        private BigDecimal totalAmount;
        private long transactionCount;
        private double percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductProfitabilityStat {
        private Long productId;
        private String productName;
        private String sku;
        private BigDecimal quantitySold;
        private BigDecimal totalRevenue;
        private BigDecimal totalCost;
        private BigDecimal grossProfit;
        private double marginPercent;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SlowMovingStockStat {
        private Long productId;
        private String productName;
        private String sku;
        private BigDecimal currentStock;
        private BigDecimal unitCost;
        private BigDecimal tiedUpCapital;
        private String categoryName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaxGstSummaryResponse {
        private BigDecimal totalTaxableTurnover;
        private BigDecimal cgstTotal;
        private BigDecimal sgstTotal;
        private BigDecimal igstTotal;
        private BigDecimal totalTaxCollected;
        private long totalTaxableInvoices;
    }
}
