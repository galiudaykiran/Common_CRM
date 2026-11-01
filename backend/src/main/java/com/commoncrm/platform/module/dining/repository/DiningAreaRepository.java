package com.commoncrm.platform.module.dining.repository;

import com.commoncrm.platform.module.dining.entity.DiningArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiningAreaRepository extends JpaRepository<DiningArea, Long> {
    List<DiningArea> findByShopIdOrderByDisplayOrderAsc(Long shopId);
    List<DiningArea> findByShopIdOrderByDisplayOrderAscNameAsc(Long shopId);
    Optional<DiningArea> findByIdAndShopId(Long id, Long shopId);
}
