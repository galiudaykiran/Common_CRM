package com.commoncrm.platform.module.shop.repository;

import com.commoncrm.platform.module.shop.entity.ShopModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShopModuleRepository extends JpaRepository<ShopModule, Long> {

    @Query("SELECT sm FROM ShopModule sm JOIN FETCH sm.module WHERE sm.shop.id = :shopId")
    List<ShopModule> findAllWithModuleByShopId(@Param("shopId") Long shopId);

    Optional<ShopModule> findByShopIdAndModuleId(Long shopId, Long moduleId);
}
