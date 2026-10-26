package com.commoncrm.platform.module.reports.repository;

import com.commoncrm.platform.module.reports.entity.ShopExpense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShopExpenseRepository extends JpaRepository<ShopExpense, Long> {

    Page<ShopExpense> findByShopIdOrderByExpenseDateDesc(Long shopId, Pageable pageable);

    Page<ShopExpense> findByShopIdAndExpenseDateBetweenOrderByExpenseDateDesc(
            Long shopId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    Optional<ShopExpense> findByIdAndShopId(Long id, Long shopId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM ShopExpense e " +
            "WHERE e.shop.id = :shopId AND e.expenseDate BETWEEN :startDate AND :endDate")
    BigDecimal sumExpensesByShopIdAndDateBetween(
            @Param("shopId") Long shopId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT e.category, COALESCE(SUM(e.amount), 0) FROM ShopExpense e " +
            "WHERE e.shop.id = :shopId AND e.expenseDate BETWEEN :startDate AND :endDate " +
            "GROUP BY e.category ORDER BY SUM(e.amount) DESC")
    List<Object[]> sumExpensesByCategory(
            @Param("shopId") Long shopId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
