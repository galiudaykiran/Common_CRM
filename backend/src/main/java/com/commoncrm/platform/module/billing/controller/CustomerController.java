package com.commoncrm.platform.module.billing.controller;

import com.commoncrm.platform.common.api.ApiResponse;
import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.billing.dto.CustomerDto.*;
import com.commoncrm.platform.module.billing.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/shop/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateCustomerRequest request) {
        CustomerResponse response = customerService.createCustomer(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Customer profile created successfully"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    public ResponseEntity<ApiResponse<PageResponse<CustomerResponse>>> searchCustomers(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        PageResponse<CustomerResponse> response = customerService.searchCustomers(principal, search, page, size);
        return ResponseEntity.ok(ApiResponse.success(response, "Customers retrieved successfully"));
    }

    @GetMapping("/quick-search")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> quickSearch(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String query) {
        List<CustomerResponse> response = customerService.quickSearchTop5(principal, query);
        return ResponseEntity.ok(ApiResponse.success(response, "Top matching customers"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        CustomerResponse response = customerService.getCustomerById(principal, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Customer details"));
    }
}
