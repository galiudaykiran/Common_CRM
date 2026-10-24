package com.commoncrm.platform.module.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantResponse {
    private Long id;
    private String code;
    private String name;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
