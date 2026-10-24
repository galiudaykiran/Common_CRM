package com.commoncrm.platform.module.inventory.repository;

import com.commoncrm.platform.module.inventory.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i " +
           "JOIN FETCH i.product p " +
           "WHERE i.shop.id = :shopId AND p.id = :productId")
    Optional<Inventory> findForUpdate(@Param("shopId") Long shopId, @Param("productId") Long productId);

    @Query("SELECT i FROM Inventory i " +
           "JOIN FETCH i.product p " +
           "LEFT JOIN FETCH p.category " +
           "WHERE i.shop.id = :shopId AND p.id = :productId")
    Optional<Inventory> findByShopIdAndProductId(@Param("shopId") Long shopId, @Param("productId") Long productId);

    @Query("SELECT i FROM Inventory i " +
           "JOIN FETCH i.product p " +
           "LEFT JOIN FETCH p.category " +
           "WHERE i.shop.id = :shopId " +
           "AND (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR p.barcode = :search) " +
           "ORDER BY p.name ASC")
    Page<Inventory> searchInventories(@Param("shopId") Long shopId,
                                     @Param("search") String search,
                                     @Param("categoryId") Long categoryId,
                                     Pageable pageable);

    @Query("SELECT i FROM Inventory i " +
           "JOIN FETCH i.product p " +
           "LEFT JOIN FETCH p.category " +
           "WHERE i.shop.id = :shopId AND i.currentStock <= p.reorderLevel " +
           "ORDER BY i.currentStock ASC")
    List<Inventory> findLowStockInventories(@Param("shopId") Long shopId);

    @Query("SELECT COUNT(i) FROM Inventory i " +
           "JOIN i.product p " +
           "WHERE i.shop.id = :shopId AND i.currentStock <= 0 AND p.status = 'ACTIVE'")
    long countOutOfStock(@Param("shopId") Long shopId);

    @Query("SELECT COUNT(i) FROM Inventory i " +
           "JOIN i.product p " +
           "WHERE i.shop.id = :shopId AND i.currentStock > 0 AND i.currentStock <= p.reorderLevel AND p.status = 'ACTIVE'")
    long countLowStock(@Param("shopId") Long shopId);

    @Query("SELECT COALESCE(SUM(i.currentStock * p.costPrice), 0.0) FROM Inventory i " +
           "JOIN i.product p " +
           "WHERE i.shop.id = :shopId AND p.status = 'ACTIVE'")
    BigDecimal calculateTotalCostValuation(@Param("shopId") Long shopId);

    @Query("SELECT COALESCE(SUM(i.currentStock * p.sellingPrice), 0.0) FROM Inventory i " +
           "JOIN i.product p " +
           "WHERE i.shop.id = :shopId AND p.status = 'ACTIVE'")
    BigDecimal calculateTotalRetailValuation(@Param("shopId") Long shopId);

    @Query("SELECT COALESCE(SUM(i.currentStock), 0.0) FROM Inventory i " +
           "JOIN i.product p " +
           "WHERE i.shop.id = :shopId AND p.status = 'ACTIVE'")
    BigDecimal calculateTotalStockCount(@Param("shopId") Long shopId);
}
