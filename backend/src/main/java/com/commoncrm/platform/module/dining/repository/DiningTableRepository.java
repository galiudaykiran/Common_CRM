package com.commoncrm.platform.module.dining.repository;

import com.commoncrm.platform.module.dining.entity.DiningTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiningTableRepository extends JpaRepository<DiningTable, Long> {
    List<DiningTable> findByShopId(Long shopId);
    List<DiningTable> findByShopIdOrderByTableNumberAsc(Long shopId);
    List<DiningTable> findByShopIdAndAreaId(Long shopId, Long areaId);
    List<DiningTable> findByShopIdAndStatus(Long shopId, String status);
    Optional<DiningTable> findByIdAndShopId(Long id, Long shopId);
    Optional<DiningTable> findByQrCodeToken(String qrCodeToken);
    boolean existsByShopIdAndTableNumber(Long shopId, String tableNumber);
    boolean existsByShopIdAndTableNumberIgnoreCase(Long shopId, String tableNumber);
    long countByShopId(Long shopId);
    long countByShopIdAndStatus(Long shopId, String status);
}
