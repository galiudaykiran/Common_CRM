package com.commoncrm.platform.module.inventory.controller;

import com.commoncrm.platform.common.api.ApiResponse;
import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.inventory.dto.*;
import com.commoncrm.platform.module.inventory.service.InventoryEngineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/shop/inventory")
@PreAuthorize("hasAnyRole('SHOP_OWNER', 'SHOP_EMPLOYEE', 'STORE_MANAGER', 'CASHIER', 'SALES_ASSOCIATE', 'INVENTORY_CLERK', 'PLATFORM_ADMIN')")
@Tag(name = "Inventory & Stock Operations", description = "Stock adjustments, goods receiving, and double-entry ledger audits")
public class InventoryController {

    private final InventoryEngineService inventoryEngineService;

    public InventoryController(InventoryEngineService inventoryEngineService) {
        this.inventoryEngineService = inventoryEngineService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Get high-level inventory valuation and stock metrics")
    public ResponseEntity<ApiResponse<InventorySummaryResponse>> getInventorySummary(
            @AuthenticationPrincipal UserPrincipal principal) {
        InventorySummaryResponse summary = inventoryEngineService.getInventorySummary(principal);
        return ResponseEntity.ok(ApiResponse.success(summary, "Inventory summary retrieved successfully"));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "List items that have reached or dropped below reorder threshold")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getLowStockAlerts(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<ProductResponse> lowStock = inventoryEngineService.getLowStockAlerts(principal);
        return ResponseEntity.ok(ApiResponse.success(lowStock, "Low stock items retrieved successfully"));
    }

    @PostMapping("/adjust")
    @Operation(summary = "Perform an auditable stock adjustment (correction, damage loss, shrinkage)")
    public ResponseEntity<ApiResponse<StockMovementResponse>> adjustStock(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody StockAdjustmentRequest request) {
        StockMovementResponse response = inventoryEngineService.adjustStock(principal, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Stock adjusted successfully"));
    }

    @PostMapping("/receive")
    @Operation(summary = "Receive goods from supplier purchase with invoice tracking")
    public ResponseEntity<ApiResponse<StockMovementResponse>> receiveStock(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody StockReceiveRequest request) {
        StockMovementResponse response = inventoryEngineService.receiveStock(principal, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Stock received successfully"));
    }

    @GetMapping("/ledger")
    @Operation(summary = "View store-wide immutable stock movement ledger")
    public ResponseEntity<ApiResponse<PageResponse<InventoryTransactionResponse>>> getGlobalLedger(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<InventoryTransactionResponse> response = inventoryEngineService.getProductLedger(principal, null, page, size);
        return ResponseEntity.ok(ApiResponse.success(response, "Store ledger retrieved successfully"));
    }

    @GetMapping("/{productId}/ledger")
    @Operation(summary = "View product-specific stock movement ledger")
    public ResponseEntity<ApiResponse<PageResponse<InventoryTransactionResponse>>> getProductLedger(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<InventoryTransactionResponse> response = inventoryEngineService.getProductLedger(principal, productId, page, size);
        return ResponseEntity.ok(ApiResponse.success(response, "Product ledger retrieved successfully"));
    }

    // --- Wireless Mobile Scanner Bridge (QR Sync) ---

    private static final java.util.concurrent.ConcurrentHashMap<String, ScanBridgePayload> SCAN_BRIDGE = new java.util.concurrent.ConcurrentHashMap<>();

    public record ScanBridgePayload(String barcode, long timestamp) {}

    @PostMapping("/scan-bridge/{sessionId}")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Submit scanned barcode from mobile phone camera to desktop")
    public ResponseEntity<ApiResponse<Void>> submitMobileScan(
            @PathVariable String sessionId,
            @RequestBody java.util.Map<String, String> body) {
        String barcode = body != null ? body.get("barcode") : null;
        if (barcode != null && !barcode.isBlank()) {
            SCAN_BRIDGE.put(sessionId, new ScanBridgePayload(barcode.trim(), System.currentTimeMillis()));
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Barcode transmitted to desktop successfully"));
    }

    @GetMapping("/scan-bridge/{sessionId}")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Desktop polling to retrieve barcode scanned by mobile camera")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> pollMobileScan(
            @PathVariable String sessionId) {
        ScanBridgePayload payload = SCAN_BRIDGE.get(sessionId);
        java.util.Map<String, Object> res = new java.util.HashMap<>();
        if (payload != null && (System.currentTimeMillis() - payload.timestamp() < 120_000)) {
            res.put("scanned", true);
            res.put("barcode", payload.barcode());
            SCAN_BRIDGE.remove(sessionId); // Consume after read
        } else {
            res.put("scanned", false);
        }
        return ResponseEntity.ok(ApiResponse.success(res, "Polling status"));
    }
}
