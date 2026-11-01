package com.commoncrm.platform.module.billing.repository;

import com.commoncrm.platform.module.billing.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByIdAndShopId(Long id, Long shopId);

    Optional<Invoice> findByShopIdAndInvoiceNumber(Long shopId, String invoiceNumber);

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    @Query("SELECT i FROM Invoice i WHERE i.shop.id = :shopId AND (" +
           ":search IS NULL OR " +
           "LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "i.customerPhone LIKE CONCAT('%', :search, '%'))")
    Page<Invoice> searchInvoices(@Param("shopId") Long shopId,
                                 @Param("search") String search,
                                 Pageable pageable);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.shop.id = :shopId AND i.createdAt >= :since")
    long countShopInvoicesSince(@Param("shopId") Long shopId, @Param("since") Instant since);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.shop.id = :shopId AND i.invoiceNumber LIKE :pattern")
    long countShopInvoicesMatching(@Param("shopId") Long shopId, @Param("pattern") String pattern);

    @Query("SELECT i.invoiceNumber FROM Invoice i WHERE i.shop.id = :shopId AND i.invoiceNumber LIKE :pattern ORDER BY i.id DESC")
    List<String> findRecentInvoiceNumbersMatching(@Param("shopId") Long shopId, @Param("pattern") String pattern, Pageable pageable);

    @EntityGraph(attributePaths = {"items"})
    @Query("SELECT DISTINCT i FROM Invoice i WHERE i.shop.id = :shopId AND i.createdAt BETWEEN :start AND :end ORDER BY i.createdAt DESC")
    List<Invoice> findByShopIdAndCreatedAtBetween(
            @Param("shopId") Long shopId,
            @Param("start") Instant start,
            @Param("end") Instant end);

    @Query("SELECT COALESCE(SUM(i.grandTotal), 0) FROM Invoice i WHERE i.shop.id = :shopId AND i.status = 'COMPLETED' AND i.createdAt BETWEEN :start AND :end")
    BigDecimal sumRevenueBetween(
            @Param("shopId") Long shopId,
            @Param("start") Instant start,
            @Param("end") Instant end);

    @Query("SELECT i.primaryPaymentMode, COALESCE(SUM(i.grandTotal), 0), COUNT(i) FROM Invoice i " +
            "WHERE i.shop.id = :shopId AND i.status = 'COMPLETED' AND i.createdAt BETWEEN :start AND :end " +
            "GROUP BY i.primaryPaymentMode")
    List<Object[]> sumRevenueByPaymentModeBetween(
            @Param("shopId") Long shopId,
            @Param("start") Instant start,
            @Param("end") Instant end);

    @Query("SELECT i FROM Invoice i WHERE i.shop.id = :shopId ORDER BY i.createdAt DESC")
    List<Invoice> findRecentInvoices(@Param("shopId") Long shopId, Pageable pageable);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.shop.id = :shopId AND i.status = 'COMPLETED' AND i.createdAt BETWEEN :start AND :end")
    long countCompletedBetween(
            @Param("shopId") Long shopId,
            @Param("start") Instant start,
            @Param("end") Instant end);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.shop.id = :shopId AND (i.paymentStatus = 'UNPAID' OR i.paymentStatus = 'PARTIAL' OR i.status = 'PENDING')")
    long countPendingOrders(@Param("shopId") Long shopId);
}
