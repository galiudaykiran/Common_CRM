package com.commoncrm.platform.module.dining.repository;

import com.commoncrm.platform.module.dining.entity.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Long> {
    List<MenuCategory> findByShopIdOrderByDisplayOrderAsc(Long shopId);
    List<MenuCategory> findByShopIdOrderByDisplayOrderAscNameAsc(Long shopId);
    List<MenuCategory> findByShopIdAndActiveTrueOrderByDisplayOrderAsc(Long shopId);
    Optional<MenuCategory> findByIdAndShopId(Long id, Long shopId);
}
