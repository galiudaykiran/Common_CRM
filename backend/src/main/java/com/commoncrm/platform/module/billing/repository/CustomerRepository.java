package com.commoncrm.platform.module.billing.repository;

import com.commoncrm.platform.module.billing.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByShopIdAndPhone(Long shopId, String phone);

    Optional<Customer> findByIdAndShopId(Long id, Long shopId);

    @Query("SELECT c FROM Customer c WHERE c.shop.id = :shopId AND (" +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "c.phone LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Customer> searchCustomers(@Param("shopId") Long shopId,
                                   @Param("search") String search,
                                   Pageable pageable);

    Page<Customer> findByShopId(Long shopId, Pageable pageable);

    @Query("SELECT c FROM Customer c WHERE c.shop.id = :shopId AND " +
           "(c.phone LIKE CONCAT('%', :query, '%') OR LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Customer> quickSearchTop5(@Param("shopId") Long shopId, @Param("query") String query, Pageable pageable);

    long countByShopId(Long shopId);
}
