package com.commoncrm.platform.common.audit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private Long id;
    private Long actorUserId;
    private String actorUsername;
    private Long tenantId;
    private String action;
    private String resourceType;
    private String resourceId;
    private String ipAddress;
    private String requestId;
    private String oldValue;
    private String newValue;
    private Instant createdAt;
}
