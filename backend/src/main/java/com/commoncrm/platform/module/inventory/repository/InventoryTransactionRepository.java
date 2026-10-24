package com.commoncrm.platform.module.inventory.repository;

import com.commoncrm.platform.module.inventory.entity.InventoryTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    @Query("SELECT tx FROM InventoryTransaction tx " +
           "JOIN FETCH tx.product p " +
           "WHERE tx.shop.id = :shopId AND p.id = :productId " +
           "ORDER BY tx.createdAt DESC, tx.id DESC")
    Page<InventoryTransaction> findByShopIdAndProductId(@Param("shopId") Long shopId,
                                                        @Param("productId") Long productId,
                                                        Pageable pageable);

    @Query("SELECT tx FROM InventoryTransaction tx " +
           "JOIN FETCH tx.product p " +
           "WHERE tx.shop.id = :shopId " +
           "ORDER BY tx.createdAt DESC, tx.id DESC")
    Page<InventoryTransaction> findAllByShopId(@Param("shopId") Long shopId, Pageable pageable);

    @Query("SELECT tx FROM InventoryTransaction tx " +
           "JOIN FETCH tx.product p " +
           "WHERE tx.shop.id = :shopId " +
           "ORDER BY tx.createdAt DESC, tx.id DESC")
    List<InventoryTransaction> findRecentByShopId(@Param("shopId") Long shopId, Pageable pageable);
}
