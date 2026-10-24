package com.commoncrm.platform.module.shop.repository;

import com.commoncrm.platform.module.shop.entity.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModuleRepository extends JpaRepository<Module, Long> {

    Optional<Module> findByCode(String code);

    boolean existsByCode(String code);

    List<Module> findAllByActiveTrue();
}
