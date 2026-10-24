package com.commoncrm.platform.module.shop.dto;

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
public class ModuleResponse implements Serializable {
    private Long id;
    private String code;
    private String name;
    private String description;
    private boolean active;
    private boolean coreModule;
    private Instant createdAt;
}
