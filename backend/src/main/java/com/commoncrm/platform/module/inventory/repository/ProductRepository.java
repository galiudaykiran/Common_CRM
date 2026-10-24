package com.commoncrm.platform.module.inventory.repository;

import com.commoncrm.platform.module.inventory.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByShopIdAndId(Long shopId, Long id);

    Optional<Product> findByShopIdAndSkuIgnoreCase(Long shopId, String sku);

    Optional<Product> findByShopIdAndBarcode(Long shopId, String barcode);

    boolean existsByShopIdAndSkuIgnoreCase(Long shopId, String sku);

    boolean existsByShopIdAndSkuIgnoreCaseAndIdNot(Long shopId, String sku, Long id);

    boolean existsByShopIdAndBarcode(Long shopId, String barcode);

    boolean existsByShopIdAndBarcodeAndIdNot(Long shopId, String barcode, Long id);

    @Query("SELECT p FROM Product p " +
           "LEFT JOIN FETCH p.category " +
           "WHERE p.shop.id = :shopId " +
           "AND (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND (:status IS NULL OR p.status = :status) " +
           "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR p.barcode = :search) " +
           "ORDER BY p.id DESC")
    Page<Product> searchProducts(@Param("shopId") Long shopId,
                                @Param("search") String search,
                                @Param("categoryId") Long categoryId,
                                @Param("status") String status,
                                Pageable pageable);

    long countByShopId(Long shopId);

    long countByShopIdAndStatus(Long shopId, String status);
}
