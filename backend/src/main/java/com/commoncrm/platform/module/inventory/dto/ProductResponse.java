package com.commoncrm.platform.module.inventory.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {
    private Long id;
    private String name;
    private String sku;
    private String barcode;
    private Long categoryId;
    private String categoryName;
    private String hsnSacCode;
    private String unitOfMeasure;
    private BigDecimal costPrice;
    private BigDecimal sellingPrice;
    private BigDecimal mrp;
    private BigDecimal taxRate;
    private Boolean taxInclusive;
    private Integer reorderLevel;
    private Integer safetyStock;
    private String status;
    private String imageUrl;
    private String description;

    // Stock attributes
    private BigDecimal currentStock;
    private BigDecimal reservedStock;
    private BigDecimal availableStock;
    private String binLocation;
    private boolean isLowStock;
    private boolean isOutOfStock;
    private Instant lastRestockedAt;

    private Instant createdAt;
    private Instant updatedAt;
}
