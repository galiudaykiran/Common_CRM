package com.commoncrm.platform.module.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockAdjustmentRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    /**
     * CORRECTION (reconciliation to exact target quantity),
     * DAMAGE_LOSS (deducts damaged items),
     * THEFT_SHRINKAGE (deducts shrinkage),
     * FOUND_STOCK (adds found surplus)
     */
    @NotBlank(message = "Adjustment type is required")
    private String adjustmentType;

    /**
     * For CORRECTION: the actual physically counted stock quantity.
     * For DAMAGE_LOSS / THEFT_SHRINKAGE / FOUND_STOCK: the positive quantity to deduct or add.
     */
    @NotNull(message = "Quantity is required")
    private BigDecimal quantity;

    @NotBlank(message = "Audit notes / reason is mandatory for stock adjustments")
    @Size(max = 255, message = "Notes cannot exceed 255 characters")
    private String notes;

    private String referenceId;
}
