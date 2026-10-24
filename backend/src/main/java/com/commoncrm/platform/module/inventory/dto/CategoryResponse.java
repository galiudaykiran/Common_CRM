package com.commoncrm.platform.module.inventory.dto;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryResponse {
    private Long id;
    private String name;
    private String code;
    private Long parentId;
    private String parentName;
    private String description;
    private String status;
    private Instant createdAt;
}
