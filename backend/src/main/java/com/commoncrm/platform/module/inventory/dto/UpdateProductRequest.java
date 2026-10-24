package com.commoncrm.platform.module.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
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
public class UpdateProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(max = 180, message = "Name cannot exceed 180 characters")
    private String name;

    @Size(max = 80, message = "SKU cannot exceed 80 characters")
    private String sku;

    @Size(max = 100, message = "Barcode cannot exceed 100 characters")
    private String barcode;

    private Long categoryId;

    @Size(max = 40, message = "HSN/SAC code cannot exceed 40 characters")
    private String hsnSacCode;

    @Size(max = 30, message = "Unit cannot exceed 30 characters")
    private String unitOfMeasure;

    @NotNull(message = "Cost price is required")
    @DecimalMin(value = "0.00", message = "Cost price cannot be negative")
    private BigDecimal costPrice;

    @NotNull(message = "Selling price is required")
    @DecimalMin(value = "0.00", message = "Selling price cannot be negative")
    private BigDecimal sellingPrice;

    private BigDecimal mrp;

    @DecimalMin(value = "0.00", message = "Tax rate cannot be negative")
    private BigDecimal taxRate;

    private Boolean taxInclusive;

    private Integer reorderLevel;

    private Integer safetyStock;

    private String binLocation;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    private String status;
}
