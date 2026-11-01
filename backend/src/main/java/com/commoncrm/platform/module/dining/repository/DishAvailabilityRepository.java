package com.commoncrm.platform.module.dining.repository;

import com.commoncrm.platform.module.dining.entity.DishAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DishAvailabilityRepository extends JpaRepository<DishAvailability, Long> {
    Optional<DishAvailability> findByDishId(Long dishId);
}
