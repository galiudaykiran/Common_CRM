package com.commoncrm.platform.module.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(max = 120, message = "Name must not exceed 120 characters")
    private String name;

    @Size(max = 60, message = "Code must not exceed 60 characters")
    private String code;

    private Long parentId;

    @Size(max = 255, message = "Description must not exceed 255 characters")
    private String description;

    private String status;
}
