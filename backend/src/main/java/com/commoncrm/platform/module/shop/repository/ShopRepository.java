package com.commoncrm.platform.module.shop.repository;

import com.commoncrm.platform.module.shop.entity.Shop;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShopRepository extends JpaRepository<Shop, Long> {

    Optional<Shop> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByTenantIdAndCode(Long tenantId, String code);

    Optional<Shop> findFirstByTenantId(Long tenantId);

    @Query(value = "SELECT s FROM Shop s " +
                   "JOIN FETCH s.tenant t " +
                   "JOIN FETCH s.businessType bt " +
                   "WHERE s.tenant.id = :tenantId")
    Optional<Shop> findWithDetailsByTenantId(@Param("tenantId") Long tenantId);

    @Query(value = "SELECT s FROM Shop s " +
                   "JOIN FETCH s.tenant t " +
                   "JOIN FETCH s.businessType bt " +
                   "WHERE s.id = :id")
    Optional<Shop> findWithDetailsById(@Param("id") Long id);

    @Query(value = "SELECT s FROM Shop s " +
                   "JOIN FETCH s.tenant t " +
                   "JOIN FETCH s.businessType bt " +
                   "WHERE (:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
                   "   OR LOWER(s.code) LIKE LOWER(CONCAT('%', :search, '%')) " +
                   "   OR LOWER(s.phone) LIKE LOWER(CONCAT('%', :search, '%')) " +
                   "   OR LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                   "AND (:businessTypeId IS NULL OR bt.id = :businessTypeId) " +
                   "AND (:status IS NULL OR s.status = :status)",
           countQuery = "SELECT COUNT(s) FROM Shop s " +
                        "WHERE (:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
                        "   OR LOWER(s.code) LIKE LOWER(CONCAT('%', :search, '%')) " +
                        "   OR LOWER(s.phone) LIKE LOWER(CONCAT('%', :search, '%')) " +
                        "   OR LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                        "AND (:businessTypeId IS NULL OR s.businessType.id = :businessTypeId) " +
                        "AND (:status IS NULL OR s.status = :status)")
    Page<Shop> searchShops(@Param("search") String search,
                           @Param("businessTypeId") Long businessTypeId,
                           @Param("status") String status,
                           Pageable pageable);

    long countByStatus(String status);

    List<Shop> findTop5ByOrderByCreatedAtDesc();
}
