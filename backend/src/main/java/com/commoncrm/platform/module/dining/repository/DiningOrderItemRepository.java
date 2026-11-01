package com.commoncrm.platform.module.dining.repository;

import com.commoncrm.platform.module.dining.entity.DiningOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiningOrderItemRepository extends JpaRepository<DiningOrderItem, Long> {

    List<DiningOrderItem> findByOrderId(Long orderId);

    @Query("SELECT i FROM DiningOrderItem i WHERE i.order.shop.id = :shopId AND i.status IN :statuses ORDER BY i.createdAt ASC")
    List<DiningOrderItem> findByShopIdAndStatusIn(@Param("shopId") Long shopId, @Param("statuses") List<String> statuses);

    @Query("SELECT COUNT(i) FROM DiningOrderItem i WHERE i.order.shop.id = :shopId AND i.status = :status")
    long countByShopIdAndStatus(@Param("shopId") Long shopId, @Param("status") String status);

    @Query("SELECT i.dishId, i.dishName, SUM(i.quantity), SUM(i.totalPrice) FROM DiningOrderItem i WHERE i.order.shop.id = :shopId AND i.status != 'CANCELLED' AND i.createdAt BETWEEN :start AND :end GROUP BY i.dishId, i.dishName ORDER BY SUM(i.totalPrice) DESC")
    List<Object[]> findDishSalesStatsBetween(@Param("shopId") Long shopId, @Param("start") java.time.Instant start, @Param("end") java.time.Instant end);
}
