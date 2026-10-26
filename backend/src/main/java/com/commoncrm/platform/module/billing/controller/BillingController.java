package com.commoncrm.platform.module.billing.controller;

import com.commoncrm.platform.common.api.ApiResponse;
import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.billing.dto.InvoiceDto.*;
import com.commoncrm.platform.module.billing.service.BillingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/shop/billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> checkout(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateInvoiceRequest request) {
        InvoiceResponse response = billingService.createInvoice(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Bill generated successfully"));
    }

    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceResponse>>> searchInvoices(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        PageResponse<InvoiceResponse> response = billingService.searchInvoices(principal, search, page, size);
        return ResponseEntity.ok(ApiResponse.success(response, "Invoices retrieved"));
    }

    @GetMapping("/invoices/{id}")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        InvoiceResponse response = billingService.getInvoiceById(principal, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Invoice details"));
    }

    @GetMapping("/invoices/by-number/{invoiceNumber}")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceByNumber(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String invoiceNumber) {
        InvoiceResponse response = billingService.getInvoiceByNumber(principal, invoiceNumber);
        return ResponseEntity.ok(ApiResponse.success(response, "Invoice details"));
    }

    @GetMapping("/invoices/{invoiceNumber}/receipt")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'SHOP_EMPLOYEE')")
    public ResponseEntity<ApiResponse<ThermalReceiptResponse>> getThermalReceipt(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String invoiceNumber) {
        ThermalReceiptResponse response = billingService.getThermalReceipt(principal, invoiceNumber);
        return ResponseEntity.ok(ApiResponse.success(response, "Thermal receipt data"));
    }
}
