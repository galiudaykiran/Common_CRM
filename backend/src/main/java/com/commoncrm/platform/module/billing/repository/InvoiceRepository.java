package com.commoncrm.platform.module.billing.repository;

import com.commoncrm.platform.module.billing.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Query("SELECT COALESCE(SUM(i.grandTotal), 0) FROM Invoice i WHERE i.shop.id = :shopId AND i.status = 'COMPLETED' AND i.createdAt >= :since")
    BigDecimal sumRevenueSince(@Param("shopId") Long shopId, @Param("since") Instant since);

    @Query("SELECT i FROM Invoice i WHERE i.shop.id = :shopId ORDER BY i.createdAt DESC")
    List<Invoice> findRecentInvoices(@Param("shopId") Long shopId, Pageable pageable);
}
