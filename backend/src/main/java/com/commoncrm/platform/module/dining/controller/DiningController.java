package com.commoncrm.platform.module.dining.controller;

import com.commoncrm.platform.common.api.ApiResponse;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.dining.dto.DiningDtos.*;
import com.commoncrm.platform.module.dining.service.*;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.service.ShopContextService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dining")
@PreAuthorize("hasAnyRole('SHOP_OWNER', 'EMPLOYEE', 'ADMIN')")
@RequiredArgsConstructor
public class DiningController {

    private final ShopContextService shopContextService;
    private final DiningDashboardService dashboardService;
    private final DiningTableService tableService;
    private final DiningMenuService menuService;
    private final DiningSessionService sessionService;
    private final DiningOrderService orderService;
    private final DiningBillingService billingService;

    // --- DASHBOARD ---

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DiningDashboardResponse>> getDashboardStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getDashboardStats(shop), "Dining dashboard metrics loaded"));
    }

    // --- AREAS ---

    @GetMapping("/areas")
    public ResponseEntity<ApiResponse<List<DiningAreaResponse>>> getAreas(
            @AuthenticationPrincipal UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(tableService.getAreas(shop), "Dining areas retrieved"));
    }

    @PostMapping("/areas")
    public ResponseEntity<ApiResponse<DiningAreaResponse>> createArea(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody DiningAreaRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(tableService.createArea(shop, request), "Dining area created"));
    }

    @PutMapping("/areas/{id}")
    public ResponseEntity<ApiResponse<DiningAreaResponse>> updateArea(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody DiningAreaRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(tableService.updateArea(shop, id, request), "Dining area updated"));
    }

    @DeleteMapping("/areas/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteArea(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        tableService.deleteArea(shop, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Dining area deleted"));
    }

    // --- TABLES ---

    @GetMapping("/tables")
    public ResponseEntity<ApiResponse<List<DiningTableResponse>>> getTables(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long areaId) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(tableService.getTables(shop, areaId), "Dining tables retrieved"));
    }

    @GetMapping("/tables/{id}")
    public ResponseEntity<ApiResponse<DiningTableResponse>> getTableById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(tableService.getTableById(shop, id), "Dining table retrieved"));
    }

    @PostMapping("/tables")
    public ResponseEntity<ApiResponse<DiningTableResponse>> createTable(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody DiningTableRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(tableService.createTable(shop, request), "Dining table created"));
    }

    @PutMapping("/tables/{id}")
    public ResponseEntity<ApiResponse<DiningTableResponse>> updateTable(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody DiningTableRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(tableService.updateTable(shop, id, request), "Dining table updated"));
    }

    @PutMapping("/tables/{id}/status")
    public ResponseEntity<ApiResponse<DiningTableResponse>> updateTableStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateTableStatusRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(tableService.updateTableStatus(shop, id, request.getStatus()), "Table status updated"));
    }

    @PostMapping("/tables/{id}/regenerate-qr")
    public ResponseEntity<ApiResponse<DiningTableResponse>> regenerateQrToken(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(tableService.regenerateQrToken(shop, id), "Table QR code refreshed"));
    }

    @DeleteMapping("/tables/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTable(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        tableService.deleteTable(shop, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Dining table deleted"));
    }

    // --- CATEGORIES ---

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<MenuCategoryResponse>>> getCategories(
            @AuthenticationPrincipal UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(menuService.getCategories(shop), "Menu categories retrieved"));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<MenuCategoryResponse>> createCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody MenuCategoryRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(menuService.createCategory(shop, request), "Menu category created"));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<MenuCategoryResponse>> updateCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody MenuCategoryRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(menuService.updateCategory(shop, id, request), "Menu category updated"));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        menuService.deleteCategory(shop, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Menu category deleted"));
    }

    // --- DISHES ---

    @GetMapping("/dishes")
    public ResponseEntity<ApiResponse<List<DishResponse>>> getDishes(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String dietaryType,
            @RequestParam(required = false) String availabilityStatus,
            @RequestParam(required = false) String search) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(
                menuService.getDishes(shop, categoryId, dietaryType, availabilityStatus, search),
                "Dishes retrieved"));
    }

    @GetMapping("/dishes/{id}")
    public ResponseEntity<ApiResponse<DishResponse>> getDishById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(menuService.getDishById(shop, id), "Dish retrieved"));
    }

    @PostMapping("/dishes")
    public ResponseEntity<ApiResponse<DishResponse>> createDish(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody DishRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(menuService.createDish(shop, request, principal), "Dish created"));
    }

    @PutMapping("/dishes/{id}")
    public ResponseEntity<ApiResponse<DishResponse>> updateDish(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody DishRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(menuService.updateDish(shop, id, request, principal), "Dish updated"));
    }

    @DeleteMapping("/dishes/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDish(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        menuService.deleteDish(shop, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Dish deleted"));
    }

    // --- DISH AVAILABILITY (SINGLE / BULK) ---

    @PutMapping("/dishes/availability")
    public ResponseEntity<ApiResponse<List<DishResponse>>> updateDishAvailability(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateDishAvailabilityRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(
                menuService.updateDishAvailability(shop, request, principal),
                "Dish availability updated"));
    }

    // --- SESSIONS ---

    @GetMapping("/sessions/active")
    public ResponseEntity<ApiResponse<List<DiningSessionResponse>>> getActiveSessions(
            @AuthenticationPrincipal UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(sessionService.getActiveSessions(shop), "Active dining sessions retrieved"));
    }

    @GetMapping("/sessions/{id}")
    public ResponseEntity<ApiResponse<DiningSessionResponse>> getSessionById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(sessionService.getSessionById(shop, id), "Dining session retrieved"));
    }

    @GetMapping("/sessions/table/{tableId}")
    public ResponseEntity<ApiResponse<DiningSessionResponse>> getSessionByTableId(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long tableId) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(sessionService.getSessionByTableId(shop, tableId), "Table session retrieved"));
    }

    @PostMapping("/sessions/start")
    public ResponseEntity<ApiResponse<DiningSessionResponse>> startSession(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody StartDiningSessionRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(sessionService.startSession(shop, request), "Dining session opened"));
    }

    @PostMapping("/sessions/{id}/close")
    public ResponseEntity<ApiResponse<DiningSessionResponse>> closeSession(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(sessionService.closeSession(shop, id), "Dining session closed"));
    }

    // --- ORDERS ---

    @GetMapping("/orders/active")
    public ResponseEntity<ApiResponse<List<DiningOrderResponse>>> getActiveOrders(
            @AuthenticationPrincipal UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(orderService.getActiveOrders(shop), "Active orders retrieved"));
    }

    @GetMapping("/orders/session/{sessionId}")
    public ResponseEntity<ApiResponse<List<DiningOrderResponse>>> getOrdersBySession(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long sessionId) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrdersBySession(shop, sessionId), "Session orders retrieved"));
    }

    @GetMapping("/orders/kitchen/items")
    public ResponseEntity<ApiResponse<List<DiningOrderItemResponse>>> getKitchenActiveItems(
            @AuthenticationPrincipal UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(orderService.getKitchenActiveItems(shop), "Kitchen items retrieved"));
    }

    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<DiningOrderResponse>> placeOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PlaceDiningOrderRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(
                orderService.placeOrder(shop, request, principal.getUsername()),
                "Order placed successfully"));
    }

    @PutMapping("/orders/items/{itemId}/status")
    public ResponseEntity<ApiResponse<DiningOrderItemResponse>> updateOrderItemStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateOrderItemStatusRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(
                orderService.updateOrderItemStatus(shop, itemId, request, principal.getUsername()),
                "Order item status updated"));
    }

    // --- BILLING & PAYMENTS ---

    @GetMapping("/bills")
    public ResponseEntity<ApiResponse<List<DiningBillResponse>>> getBills(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String paymentStatus) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(billingService.getBills(shop, paymentStatus), "Dining bills retrieved"));
    }

    @GetMapping("/bills/session/{sessionId}")
    public ResponseEntity<ApiResponse<DiningBillResponse>> getBillBySessionId(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long sessionId) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(billingService.getBillBySessionId(shop, sessionId), "Bill retrieved"));
    }

    @PostMapping("/bills/session/{sessionId}/generate")
    public ResponseEntity<ApiResponse<DiningBillResponse>> generateBill(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long sessionId,
            @RequestBody(required = false) GenerateBillRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(
                billingService.generateBill(shop, sessionId, request),
                "Bill generated successfully"));
    }

    @PostMapping("/bills/{billId}/payments")
    public ResponseEntity<ApiResponse<DiningBillResponse>> recordPayment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long billId,
            @Valid @RequestBody RecordPaymentRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return ResponseEntity.ok(ApiResponse.success(
                billingService.recordPayment(shop, billId, request, principal.getUsername()),
                "Payment recorded successfully"));
    }
}
