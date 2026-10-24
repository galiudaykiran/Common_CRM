package com.commoncrm.platform.module.inventory.controller;

import com.commoncrm.platform.common.api.ApiResponse;
import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.inventory.dto.*;
import com.commoncrm.platform.module.inventory.service.CategoryService;
import com.commoncrm.platform.module.inventory.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/shop/catalog")
@PreAuthorize("hasAnyRole('SHOP_OWNER', 'SHOP_EMPLOYEE', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'INVENTORY_CLERK', 'PLATFORM_ADMIN')")
@Tag(name = "Product Catalog & Categories", description = "Shop holder product taxonomy, SKU and pricing management")
public class CatalogController {

    private final ProductService productService;
    private final CategoryService categoryService;

    public CatalogController(ProductService productService, CategoryService categoryService) {
        this.productService = productService;
        this.categoryService = categoryService;
    }

    // --- Category Endpoints ---

    @GetMapping("/categories")
    @Operation(summary = "List all active product categories")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getActiveCategories(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<CategoryResponse> categories = categoryService.getActiveCategories(principal);
        return ResponseEntity.ok(ApiResponse.success(categories, "Categories retrieved successfully"));
    }

    @GetMapping("/categories/all")
    @Operation(summary = "List all categories including inactive ones")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<CategoryResponse> categories = categoryService.getAllCategories(principal);
        return ResponseEntity.ok(ApiResponse.success(categories, "All categories retrieved successfully"));
    }

    @PostMapping("/categories")
    @Operation(summary = "Create a new category")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateCategoryRequest request) {
        CategoryResponse response = categoryService.createCategory(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Category created successfully"));
    }

    @PutMapping("/categories/{id}")
    @Operation(summary = "Update an existing category")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody CreateCategoryRequest request) {
        CategoryResponse response = categoryService.updateCategory(principal, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Category updated successfully"));
    }

    // --- Product Endpoints ---

    @GetMapping("/products")
    @Operation(summary = "Search and filter store products with pagination")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> searchProducts(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<ProductResponse> response = productService.searchProducts(principal, search, categoryId, status, page, size);
        return ResponseEntity.ok(ApiResponse.success(response, "Products retrieved successfully"));
    }

    @GetMapping("/products/{id}")
    @Operation(summary = "Get detailed product information by ID")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        ProductResponse response = productService.getProductById(principal, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Product retrieved successfully"));
    }

    @GetMapping("/products/by-barcode/{barcode}")
    @Operation(summary = "Find product by exact barcode (high-speed scanner lookup)")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductByBarcode(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String barcode) {
        ProductResponse response = productService.getProductByBarcode(principal, barcode);
        return ResponseEntity.ok(ApiResponse.success(response, "Barcode matched successfully"));
    }

    @PostMapping("/products")
    @Operation(summary = "Create a new product in the catalog with automatic stock initialization")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateProductRequest request) {
        ProductResponse response = productService.createProduct(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Product created successfully"));
    }

    @PutMapping("/products/{id}")
    @Operation(summary = "Update an existing product's catalog details and pricing")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductRequest request) {
        ProductResponse response = productService.updateProduct(principal, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Product updated successfully"));
    }
}
