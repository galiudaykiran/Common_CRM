package com.commoncrm.platform.module.billing.repository;

import com.commoncrm.platform.module.billing.entity.CustomerNotificationSchedule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerNotificationScheduleRepository extends JpaRepository<CustomerNotificationSchedule, Long> {

    Optional<CustomerNotificationSchedule> findByIdAndShopId(Long id, Long shopId);

    Page<CustomerNotificationSchedule> findByShopIdOrderByNextRunDateAsc(Long shopId, Pageable pageable);

    List<CustomerNotificationSchedule> findByCustomerIdAndShopId(Long customerId, Long shopId);

    @Query("SELECT s FROM CustomerNotificationSchedule s WHERE s.active = true AND s.nextRunDate <= :targetDate")
    List<CustomerNotificationSchedule> findDueSchedules(@Param("targetDate") LocalDate targetDate);
}
