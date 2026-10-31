package com.commoncrm.platform.module.shop.repository;

import com.commoncrm.platform.module.shop.entity.ShopNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShopNotificationRepository extends JpaRepository<ShopNotification, Long> {

    List<ShopNotification> findByShopIdAndDismissedFalseOrderByCreatedAtDesc(Long shopId);

    Optional<ShopNotification> findByShopIdAndAlertKey(Long shopId, String alertKey);

    @Modifying
    @Query("UPDATE ShopNotification n SET n.read = true WHERE n.shop.id = :shopId AND n.alertKey = :alertKey")
    int markAsRead(@Param("shopId") Long shopId, @Param("alertKey") String alertKey);

    @Modifying
    @Query("UPDATE ShopNotification n SET n.read = true WHERE n.shop.id = :shopId AND n.dismissed = false")
    int markAllAsRead(@Param("shopId") Long shopId);

    @Modifying
    @Query("UPDATE ShopNotification n SET n.dismissed = true, n.dismissedAt = :now WHERE n.shop.id = :shopId AND n.alertKey = :alertKey")
    int dismissAlert(@Param("shopId") Long shopId, @Param("alertKey") String alertKey, @Param("now") Instant now);

    @Modifying
    @Query("UPDATE ShopNotification n SET n.dismissed = true, n.dismissedAt = :now WHERE n.shop.id = :shopId AND n.dismissed = false")
    int dismissAllAlerts(@Param("shopId") Long shopId, @Param("now") Instant now);
}
