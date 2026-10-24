package com.commoncrm.platform.module.employee.repository;

import com.commoncrm.platform.module.employee.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    @Query("SELECT e FROM Employee e " +
           "JOIN FETCH e.user u " +
           "JOIN FETCH e.shop s " +
           "WHERE e.tenantId = :tenantId AND e.shop.id = :shopId " +
           "AND (:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "   OR LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "   OR LOWER(e.phone) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "   OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR e.status = :status) " +
           "AND (:designation IS NULL OR e.designation = :designation)")
    Page<Employee> searchEmployees(@Param("tenantId") Long tenantId,
                                  @Param("shopId") Long shopId,
                                  @Param("search") String search,
                                  @Param("status") String status,
                                  @Param("designation") String designation,
                                  Pageable pageable);

    @Query("SELECT e FROM Employee e " +
           "JOIN FETCH e.user u " +
           "JOIN FETCH e.shop s " +
           "WHERE e.id = :id AND e.tenantId = :tenantId")
    Optional<Employee> findByIdAndTenantId(@Param("id") Long id, @Param("tenantId") Long tenantId);

    Optional<Employee> findByEmployeeCodeAndTenantId(String employeeCode, Long tenantId);

    Optional<Employee> findByEmployeeCodeIgnoreCaseAndShopId(String employeeCode, Long shopId);

    Optional<Employee> findByUserId(Long userId);

    Optional<Employee> findByUserIdAndShopId(Long userId, Long shopId);

    boolean existsByEmployeeCodeAndTenantId(String employeeCode, Long tenantId);

    long countByTenantIdAndStatus(Long tenantId, String status);

    long countByTenantIdAndShopId(Long tenantId, Long shopId);

    @Query("SELECT COALESCE(SUM(e.monthlySalary), 0) FROM Employee e " +
           "WHERE e.tenantId = :tenantId AND e.shop.id = :shopId AND e.status = 'ACTIVE'")
    BigDecimal calculateActiveMonthlyPayroll(@Param("tenantId") Long tenantId, @Param("shopId") Long shopId);
}
