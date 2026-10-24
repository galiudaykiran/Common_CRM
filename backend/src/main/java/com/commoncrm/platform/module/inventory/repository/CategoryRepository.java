package com.commoncrm.platform.module.inventory.repository;

import com.commoncrm.platform.module.inventory.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    @Query("SELECT c FROM Category c WHERE c.shop.id = :shopId AND c.status = 'ACTIVE' ORDER BY c.name ASC")
    List<Category> findActiveByShopId(@Param("shopId") Long shopId);

    @Query("SELECT c FROM Category c WHERE c.shop.id = :shopId ORDER BY c.name ASC")
    List<Category> findAllByShopId(@Param("shopId") Long shopId);

    Optional<Category> findByShopIdAndId(Long shopId, Long id);

    Optional<Category> findByShopIdAndCodeIgnoreCase(Long shopId, String code);

    boolean existsByShopIdAndCodeIgnoreCase(Long shopId, String code);

    boolean existsByShopIdAndCodeIgnoreCaseAndIdNot(Long shopId, String code, Long id);
}
