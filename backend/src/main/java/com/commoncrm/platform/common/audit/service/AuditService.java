package com.commoncrm.platform.common.audit.service;

import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.common.api.RequestIdFilter;
import com.commoncrm.platform.common.audit.dto.AuditLogResponse;
import com.commoncrm.platform.common.audit.entity.AuditLog;
import com.commoncrm.platform.common.audit.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(Long actorUserId,
                          String actorUsername,
                          Long tenantId,
                          String action,
                          String resourceType,
                          String resourceId,
                          String oldValue,
                          String newValue) {
        try {
            String requestId = MDC.get(RequestIdFilter.MDC_REQUEST_ID_KEY);
            String clientIp = getClientIp();

            AuditLog logEntry = AuditLog.builder()
                    .actorUserId(actorUserId)
                    .actorUsername(actorUsername)
                    .tenantId(tenantId)
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .ipAddress(clientIp)
                    .requestId(requestId)
                    .oldValue(oldValue)
                    .newValue(newValue)
                    .build();

            auditLogRepository.save(logEntry);
            log.info("[AUDIT] Action: {} by User: {} on Resource: {}/{}", action, actorUsername, resourceType, resourceId);
        } catch (Exception ex) {
            log.error("Failed to record audit log entry: {}", ex.getMessage(), ex);
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> getAuditLogs(String action, String resourceType, String actorUsername, Pageable pageable) {
        Page<AuditLog> page = auditLogRepository.searchLogs(action, resourceType, actorUsername, pageable);
        return PageResponse.from(page.map(this::mapToDto));
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getRecentActivity() {
        return auditLogRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getRecentActivityForTenant(Long tenantId) {
        if (tenantId == null) {
            return List.of();
        }
        return auditLogRepository.findTop10ByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAllActivityForTenant(Long tenantId) {
        if (tenantId == null) {
            return List.of();
        }
        return auditLogRepository.findTop50ByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private AuditLogResponse mapToDto(AuditLog audit) {
        return AuditLogResponse.builder()
                .id(audit.getId())
                .actorUserId(audit.getActorUserId())
                .actorUsername(audit.getActorUsername())
                .tenantId(audit.getTenantId())
                .action(audit.getAction())
                .resourceType(audit.getResourceType())
                .resourceId(audit.getResourceId())
                .ipAddress(audit.getIpAddress())
                .requestId(audit.getRequestId())
                .oldValue(audit.getOldValue())
                .newValue(audit.getNewValue())
                .createdAt(audit.getCreatedAt())
                .build();
    }

    private String getClientIp() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                    return xForwardedFor.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception ignored) {}
        return "127.0.0.1";
    }
}
