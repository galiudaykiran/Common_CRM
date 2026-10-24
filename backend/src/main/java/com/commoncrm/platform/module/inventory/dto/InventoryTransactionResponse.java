package com.commoncrm.platform.module.inventory.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTransactionResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String sku;
    private String transactionType;
    private String referenceType;
    private String referenceId;
    private BigDecimal quantityBefore;
    private BigDecimal quantityDelta;
    private BigDecimal quantityAfter;
    private BigDecimal unitCost;
    private BigDecimal totalValuation;
    private String notes;
    private Long createdByUserId;
    private Instant createdAt;
}
