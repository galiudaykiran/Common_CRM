package com.commoncrm.platform.module.businesstype.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessTypeResponse implements Serializable {
    private Long id;
    private String code;
    private String name;
    private String description;
    private boolean active;
    private int displayOrder;
    private Instant createdAt;
    private Instant updatedAt;
}
