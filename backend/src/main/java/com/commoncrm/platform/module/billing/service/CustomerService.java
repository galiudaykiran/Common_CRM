package com.commoncrm.platform.module.billing.service;

import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.common.exception.BusinessException;
import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.billing.dto.CustomerDto.*;
import com.commoncrm.platform.module.billing.entity.Customer;
import com.commoncrm.platform.module.billing.repository.CustomerRepository;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.service.ShopContextService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final ShopContextService shopContextService;

    public CustomerService(CustomerRepository customerRepository, ShopContextService shopContextService) {
        this.customerRepository = customerRepository;
        this.shopContextService = shopContextService;
    }

    @Transactional
    public CustomerResponse createCustomer(UserPrincipal principal, CreateCustomerRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);

        customerRepository.findByShopIdAndPhone(shop.getId(), request.getPhone().trim())
                .ifPresent(existing -> {
                    throw new BusinessException("Customer with phone '" + request.getPhone() + "' already exists in this store.");
                });

        Customer customer = Customer.builder()
                .tenantId(shop.getTenant().getId())
                .shop(shop)
                .name(request.getName().trim())
                .phone(request.getPhone().trim())
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .city(request.getCity() != null ? request.getCity().trim() : null)
                .state(request.getState() != null ? request.getState().trim() : null)
                .gstin(request.getGstin() != null ? request.getGstin().trim() : null)
                .totalSpent(BigDecimal.ZERO)
                .creditBalance(BigDecimal.ZERO)
                .build();

        customer = customerRepository.save(customer);
        return toCustomerResponse(customer);
    }

    @Transactional(readOnly = true)
    public PageResponse<CustomerResponse> searchCustomers(UserPrincipal principal, String search, int page, int size) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Customer> customerPage = (search != null && !search.isBlank())
                ? customerRepository.searchCustomers(shop.getId(), search.trim(), pageable)
                : customerRepository.findByShopId(shop.getId(), pageable);

        List<CustomerResponse> content = customerPage.getContent().stream()
                .map(this::toCustomerResponse)
                .collect(Collectors.toList());

        return PageResponse.<CustomerResponse>builder()
                .content(content)
                .page(customerPage.getNumber())
                .size(customerPage.getSize())
                .totalElements(customerPage.getTotalElements())
                .totalPages(customerPage.getTotalPages())
                .first(customerPage.isFirst())
                .last(customerPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> quickSearchTop5(UserPrincipal principal, String query) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        if (query == null || query.isBlank()) {
            return List.of();
        }
        Pageable top5 = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "totalSpent"));
        return customerRepository.quickSearchTop5(shop.getId(), query.trim(), top5).stream()
                .map(this::toCustomerResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(UserPrincipal principal, Long id) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Customer customer = customerRepository.findByIdAndShopId(id, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        return toCustomerResponse(customer);
    }

    public CustomerResponse toCustomerResponse(Customer c) {
        return CustomerResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .phone(c.getPhone())
                .email(c.getEmail())
                .address(c.getAddress())
                .city(c.getCity())
                .state(c.getState())
                .gstin(c.getGstin())
                .totalSpent(c.getTotalSpent())
                .creditBalance(c.getCreditBalance())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
