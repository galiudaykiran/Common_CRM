package com.commoncrm.platform.module.dining.repository;

import com.commoncrm.platform.module.dining.entity.Dish;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DishRepository extends JpaRepository<Dish, Long> {

    @EntityGraph(attributePaths = {"category", "availability"})
    @Query("SELECT d FROM Dish d WHERE d.shop.id = :shopId ORDER BY d.displayOrder ASC, d.createdAt DESC")
    List<Dish> findAllWithDetailsByShopId(@Param("shopId") Long shopId);

    @EntityGraph(attributePaths = {"category", "availability"})
    @Query("SELECT d FROM Dish d WHERE d.shop.id = :shopId AND d.active = true ORDER BY d.createdAt DESC")
    List<Dish> findActiveWithDetailsByShopId(@Param("shopId") Long shopId);

    @EntityGraph(attributePaths = {"category", "availability"})
    @Query("SELECT d FROM Dish d WHERE d.shop.id = :shopId AND d.category.id = :categoryId ORDER BY d.displayOrder ASC, d.name ASC")
    List<Dish> findByShopIdAndCategoryId(@Param("shopId") Long shopId, @Param("categoryId") Long categoryId);

    @EntityGraph(attributePaths = {"category", "availability"})
    @Query("SELECT d FROM Dish d WHERE d.shop.id = :shopId ORDER BY d.displayOrder ASC, d.name ASC")
    List<Dish> findByShopIdOrderByCategoryAscDisplayOrderAscNameAsc(@Param("shopId") Long shopId);

    @EntityGraph(attributePaths = {"category", "availability"})
    @Query("SELECT d FROM Dish d WHERE d.id = :id AND d.shop.id = :shopId")
    Optional<Dish> findWithDetailsByIdAndShopId(@Param("id") Long id, @Param("shopId") Long shopId);

    @EntityGraph(attributePaths = {"category", "availability"})
    Optional<Dish> findByIdAndShopId(Long id, Long shopId);

    long countByShopId(Long shopId);
}
