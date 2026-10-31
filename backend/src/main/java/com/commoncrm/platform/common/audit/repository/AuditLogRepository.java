package com.commoncrm.platform.common.audit.repository;

import com.commoncrm.platform.common.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:resourceType IS NULL OR a.resourceType = :resourceType) AND " +
           "(:actorUsername IS NULL OR LOWER(a.actorUsername) LIKE LOWER(CONCAT('%', :actorUsername, '%')))")
    Page<AuditLog> searchLogs(@Param("action") String action,
                              @Param("resourceType") String resourceType,
                              @Param("actorUsername") String actorUsername,
                              Pageable pageable);

    List<AuditLog> findTop10ByOrderByCreatedAtDesc();

    List<AuditLog> findTop10ByTenantIdOrderByCreatedAtDesc(Long tenantId);

    List<AuditLog> findTop50ByTenantIdOrderByCreatedAtDesc(Long tenantId);
}
