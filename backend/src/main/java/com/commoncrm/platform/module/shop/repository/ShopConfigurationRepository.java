package com.commoncrm.platform.module.shop.repository;

import com.commoncrm.platform.module.shop.entity.ShopConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShopConfigurationRepository extends JpaRepository<ShopConfiguration, Long> {

    Optional<ShopConfiguration> findByShopId(Long shopId);
}
