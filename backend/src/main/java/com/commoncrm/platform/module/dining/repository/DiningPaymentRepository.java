package com.commoncrm.platform.module.dining.repository;

import com.commoncrm.platform.module.dining.entity.DiningPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface DiningPaymentRepository extends JpaRepository<DiningPayment, Long> {
    List<DiningPayment> findByBillId(Long billId);

    @Query("SELECT p.paymentMode, SUM(p.amount), COUNT(p) FROM DiningPayment p WHERE p.shop.id = :shopId AND p.createdAt BETWEEN :start AND :end GROUP BY p.paymentMode")
    List<Object[]> sumRevenueByPaymentModeBetween(@Param("shopId") Long shopId, @Param("start") Instant start, @Param("end") Instant end);
}
