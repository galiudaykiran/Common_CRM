package com.commoncrm.platform.module.dining.repository;

import com.commoncrm.platform.module.dining.entity.DiningSession;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiningSessionRepository extends JpaRepository<DiningSession, Long> {

    @EntityGraph(attributePaths = {"table", "table.area"})
    @Query("SELECT s FROM DiningSession s WHERE s.shop.id = :shopId AND s.status = :status ORDER BY s.openedAt DESC")
    List<DiningSession> findWithDetailsByShopIdAndStatus(@Param("shopId") Long shopId, @Param("status") String status);

    @EntityGraph(attributePaths = {"table", "table.area"})
    List<DiningSession> findByShopIdAndStatus(Long shopId, String status);

    @EntityGraph(attributePaths = {"table", "table.area"})
    @Query("SELECT s FROM DiningSession s WHERE s.id = :id AND s.shop.id = :shopId")
    Optional<DiningSession> findWithDetailsByIdAndShopId(@Param("id") Long id, @Param("shopId") Long shopId);

    @EntityGraph(attributePaths = {"table", "table.area"})
    Optional<DiningSession> findByIdAndShopId(Long id, Long shopId);

    @EntityGraph(attributePaths = {"table", "table.area"})
    @Query("SELECT s FROM DiningSession s WHERE s.table.id = :tableId AND s.status = 'ACTIVE'")
    Optional<DiningSession> findActiveSessionByTableId(@Param("tableId") Long tableId);

    @EntityGraph(attributePaths = {"table", "table.area"})
    Optional<DiningSession> findFirstByTableIdAndStatusOrderByOpenedAtDesc(Long tableId, String status);

    long countByShopIdAndStatus(Long shopId, String status);
}
