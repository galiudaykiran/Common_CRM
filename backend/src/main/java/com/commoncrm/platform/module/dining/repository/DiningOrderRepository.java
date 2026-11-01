package com.commoncrm.platform.module.dining.repository;

import com.commoncrm.platform.module.dining.entity.DiningOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiningOrderRepository extends JpaRepository<DiningOrder, Long> {

    @EntityGraph(attributePaths = {"items", "session", "session.table"})
    @Query("SELECT o FROM DiningOrder o WHERE o.shop.id = :shopId AND o.status IN :statuses ORDER BY o.placedAt ASC")
    List<DiningOrder> findActiveKitchenOrders(@Param("shopId") Long shopId, @Param("statuses") List<String> statuses);

    @EntityGraph(attributePaths = {"items", "session", "session.table"})
    @Query("SELECT o FROM DiningOrder o WHERE o.session.id = :sessionId ORDER BY o.placedAt ASC")
    List<DiningOrder> findBySessionIdWithItems(@Param("sessionId") Long sessionId);

    @EntityGraph(attributePaths = {"items", "session", "session.table"})
    List<DiningOrder> findBySessionIdOrderByPlacedAtAsc(Long sessionId);

    @EntityGraph(attributePaths = {"items", "session", "session.table"})
    List<DiningOrder> findByShopIdAndStatusNotInOrderByPlacedAtDesc(Long shopId, List<String> statuses);

    Optional<DiningOrder> findByIdAndShopId(Long id, Long shopId);

    long countByShopIdAndStatus(Long shopId, String status);

    long countByShopIdAndPlacedAtGreaterThanEqual(Long shopId, Instant placedAt);
}
