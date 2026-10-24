package com.commoncrm.platform.module.businesstype.repository;

import com.commoncrm.platform.module.businesstype.entity.BusinessType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BusinessTypeRepository extends JpaRepository<BusinessType, Long> {

    Optional<BusinessType> findByCode(String code);

    boolean existsByCode(String code);

    List<BusinessType> findAllByOrderByDisplayOrderAsc();

    List<BusinessType> findAllByActiveTrueOrderByDisplayOrderAsc();

    long countByActiveTrue();
}
