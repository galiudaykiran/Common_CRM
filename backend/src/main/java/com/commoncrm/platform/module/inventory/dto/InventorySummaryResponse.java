package com.commoncrm.platform.module.inventory.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventorySummaryResponse {
    private long totalProducts;
    private long activeProducts;
    private BigDecimal totalStockUnits;
    private BigDecimal totalCostValuation;
    private BigDecimal totalRetailValuation;
    private long lowStockCount;
    private long outOfStockCount;
}
