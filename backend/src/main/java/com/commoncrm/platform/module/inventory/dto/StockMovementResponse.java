package com.commoncrm.platform.module.inventory.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovementResponse {
    private Long transactionId;
    private Long productId;
    private String sku;
    private String productName;
    private String transactionType;
    private BigDecimal quantityBefore;
    private BigDecimal quantityDelta;
    private BigDecimal quantityAfter;
    private String notes;
}
