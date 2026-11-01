package com.commoncrm.platform.module.dining.repository;

import com.commoncrm.platform.module.dining.entity.DiningBill;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiningBillRepository extends JpaRepository<DiningBill, Long> {

    @EntityGraph(attributePaths = {"session", "payments", "session.table"})
    Optional<DiningBill> findFirstBySessionIdOrderByCreatedAtDesc(Long sessionId);

    @EntityGraph(attributePaths = {"session", "payments", "session.table"})
    Optional<DiningBill> findByIdAndShopId(Long id, Long shopId);

    @Query("SELECT COALESCE(SUM(b.grandTotal), 0) FROM DiningBill b WHERE b.shop.id = :shopId AND b.paymentStatus = 'PAID' AND b.createdAt BETWEEN :start AND :end")
    BigDecimal sumPaidRevenueBetween(@Param("shopId") Long shopId, @Param("start") Instant start, @Param("end") Instant end);

    @Query("SELECT COALESCE(SUM(b.grandTotal), 0) FROM DiningBill b WHERE b.shop.id = :shopId AND b.paymentStatus = :status AND b.createdAt >= :after")
    BigDecimal sumGrandTotalByShopIdAndPaymentStatusAndCreatedAtGreaterThanEqual(@Param("shopId") Long shopId, @Param("status") String status, @Param("after") Instant after);

    @Query("SELECT COUNT(b) FROM DiningBill b WHERE b.shop.id = :shopId AND b.paymentStatus = 'PAID' AND b.createdAt BETWEEN :start AND :end")
    long countPaidBillsBetween(@Param("shopId") Long shopId, @Param("start") Instant start, @Param("end") Instant end);

    @EntityGraph(attributePaths = {"session", "session.table"})
    @Query("SELECT b FROM DiningBill b WHERE b.shop.id = :shopId ORDER BY b.createdAt DESC")
    List<DiningBill> findRecentBillsByShopId(@Param("shopId") Long shopId);

    @EntityGraph(attributePaths = {"session", "session.table"})
    List<DiningBill> findByShopIdOrderByCreatedAtDesc(Long shopId);

    @EntityGraph(attributePaths = {"session", "payments"})
    @Query("SELECT b FROM DiningBill b WHERE b.shop.id = :shopId AND b.createdAt BETWEEN :start AND :end")
    List<DiningBill> findByShopIdAndCreatedAtBetween(@Param("shopId") Long shopId, @Param("start") Instant start, @Param("end") Instant end);

    @EntityGraph(attributePaths = {"session", "session.table"})
    List<DiningBill> findByShopIdAndPaymentStatusOrderByCreatedAtDesc(Long shopId, String paymentStatus);
}
