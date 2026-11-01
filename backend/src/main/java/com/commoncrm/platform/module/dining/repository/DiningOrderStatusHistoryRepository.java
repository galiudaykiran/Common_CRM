package com.commoncrm.platform.module.dining.repository;

import com.commoncrm.platform.module.dining.entity.DiningOrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiningOrderStatusHistoryRepository extends JpaRepository<DiningOrderStatusHistory, Long> {
    List<DiningOrderStatusHistory> findByOrderIdOrderByCreatedAtDesc(Long orderId);
}
