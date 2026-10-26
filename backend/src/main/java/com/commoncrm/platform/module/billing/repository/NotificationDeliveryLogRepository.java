package com.commoncrm.platform.module.billing.repository;

import com.commoncrm.platform.module.billing.entity.NotificationDeliveryLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationDeliveryLogRepository extends JpaRepository<NotificationDeliveryLog, Long> {

    Page<NotificationDeliveryLog> findByShopIdOrderByCreatedAtDesc(Long shopId, Pageable pageable);
}
