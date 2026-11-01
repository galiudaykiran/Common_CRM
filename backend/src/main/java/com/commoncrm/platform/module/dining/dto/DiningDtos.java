package com.commoncrm.platform.module.dining.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class DiningDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiningDashboardResponse {
        private boolean moduleEnabled;
        private long totalTables;
        private long availableTables;
        private long occupiedTables;
        private long reservedTables;
        private long billRequestedTables;
        private long cleaningTables;

        private long activeSessions;
        private long activeOrders;
        private long preparingItems;
        private long readyItems;
        private long servedItems;

        private long todayOrderCount;
        private BigDecimal todayDiningRevenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiningAreaRequest {
        @NotBlank(message = "Area name is required")
        private String name;
        private String description;
        private Integer displayOrder;
        private Boolean active;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiningAreaResponse {
        private Long id;
        private String name;
        private String description;
        private Integer displayOrder;
        private boolean active;
        private long tableCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiningTableRequest {
        private Long areaId;
        @NotBlank(message = "Table number is required")
        private String tableNumber;
        @Positive(message = "Capacity must be positive")
        private Integer seatingCapacity;
        private String status;
        private Boolean active;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiningTableResponse {
        private Long id;
        private Long areaId;
        private String areaName;
        private String tableNumber;
        private int seatingCapacity;
        private String status;
        private String qrCodeToken;
        private String qrMenuUrl;
        private boolean active;
        private Long currentSessionId;
        private String currentSessionCode;
        private Integer guestCount;
        private String customerName;
        private Instant sessionOpenedAt;
        private BigDecimal currentTotal;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateTableStatusRequest {
        @NotBlank(message = "Status is required")
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MenuCategoryRequest {
        @NotBlank(message = "Category name is required")
        private String name;
        private String description;
        private Integer displayOrder;
        private Boolean active;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MenuCategoryResponse {
        private Long id;
        private String name;
        private String description;
        private Integer displayOrder;
        private boolean active;
        private long dishCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DishVariantDto {
        private Long id;
        @NotBlank(message = "Variant name is required")
        private String name;
        @NotNull(message = "Price is required")
        private BigDecimal price;
        private Boolean active;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DishAddonDto {
        private Long id;
        @NotBlank(message = "Addon name is required")
        private String name;
        @NotNull(message = "Price is required")
        private BigDecimal price;
        private Boolean active;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DishRequest {
        private Long categoryId;
        @NotBlank(message = "Dish name is required")
        private String name;
        private String description;
        private String imageUrl;
        private String dietaryType;
        @NotNull(message = "Base price is required")
        private BigDecimal basePrice;
        private Integer preparationTimeMinutes;
        private BigDecimal taxRate;
        private Boolean isFeatured;
        private Integer displayOrder;
        private Boolean active;
        private String availabilityStatus; // AVAILABLE, UNAVAILABLE, etc.
        private List<DishVariantDto> variants;
        private List<DishAddonDto> addons;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DishResponse {
        private Long id;
        private Long categoryId;
        private String categoryName;
        private String name;
        private String description;
        private String imageUrl;
        private String dietaryType;
        private BigDecimal basePrice;
        private Integer preparationTimeMinutes;
        private BigDecimal taxRate;
        private boolean isFeatured;
        private int displayOrder;
        private boolean active;
        private String availabilityStatus; // AVAILABLE, UNAVAILABLE, TEMP_UNAVAILABLE, OUT_OF_STOCK
        private String availabilityReason;
        private Instant availabilityUpdatedAt;
        private List<DishVariantDto> variants;
        private List<DishAddonDto> addons;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateDishAvailabilityRequest {
        private Long dishId;
        private List<Long> dishIds; // for bulk
        @NotBlank(message = "Availability status is required")
        private String status; // AVAILABLE, UNAVAILABLE, TEMP_UNAVAILABLE, OUT_OF_STOCK
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StartDiningSessionRequest {
        @NotNull(message = "Table ID is required")
        private Long tableId;
        @Positive(message = "Guest count must be positive")
        private Integer guestCount;
        private String customerName;
        private String customerPhone;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiningSessionResponse {
        private Long id;
        private Long tableId;
        private String tableNumber;
        private String areaName;
        private String sessionCode;
        private int guestCount;
        private String customerName;
        private String customerPhone;
        private String notes;
        private Instant openedAt;
        private Instant closedAt;
        private String status;
        private BigDecimal ordersTotal;
        private List<DiningOrderResponse> orders;
        private DiningBillResponse bill;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlaceOrderItemRequest {
        @NotNull(message = "Dish ID is required")
        private Long dishId;
        private String variantName;
        private BigDecimal variantPrice;
        @Positive(message = "Quantity must be positive")
        private Integer quantity;
        private String specialInstructions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlaceDiningOrderRequest {
        @NotNull(message = "Session ID is required")
        private Long sessionId;
        private String notes;
        @NotNull(message = "Order items are required")
        private List<PlaceOrderItemRequest> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiningOrderResponse {
        private Long id;
        private Long sessionId;
        private String sessionCode;
        private String tableNumber;
        private String orderNumber;
        private String notes;
        private String status;
        private Instant placedAt;
        private BigDecimal orderTotal;
        private List<DiningOrderItemResponse> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiningOrderItemResponse {
        private Long id;
        private Long orderId;
        private Long dishId;
        private String dishName;
        private String variantName;
        private BigDecimal variantPrice;
        private int quantity;
        private BigDecimal unitPrice;
        private BigDecimal taxRate;
        private BigDecimal subtotal;
        private BigDecimal totalPrice;
        private String specialInstructions;
        private String status; // PLACED, ACCEPTED, PREPARING, READY, SERVED, CANCELLED
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateOrderItemStatusRequest {
        @NotBlank(message = "Status is required")
        private String status; // ACCEPTED, PREPARING, READY, SERVED, CANCELLED
        private String remarks;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GenerateBillRequest {
        private BigDecimal discountTotal;
        private BigDecimal serviceCharge;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiningBillResponse {
        private Long id;
        private Long sessionId;
        private String sessionCode;
        private String tableNumber;
        private String billNumber;
        private BigDecimal subtotal;
        private BigDecimal discountTotal;
        private BigDecimal taxTotal;
        private BigDecimal serviceCharge;
        private BigDecimal grandTotal;
        private BigDecimal paidAmount;
        private BigDecimal balanceAmount;
        private String paymentStatus;
        private Instant createdAt;
        private List<DiningPaymentResponse> payments;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecordPaymentRequest {
        @NotNull(message = "Payment amount is required")
        @Positive(message = "Payment amount must be positive")
        private BigDecimal amount;
        @NotBlank(message = "Payment mode is required")
        private String paymentMode; // CASH, UPI, CARD, OTHER
        private String transactionReference;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiningPaymentResponse {
        private Long id;
        private Long billId;
        private BigDecimal amount;
        private String paymentMode;
        private String transactionReference;
        private String recordedByUsername;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PublicDiningMenuResponse {
        private String shopName;
        private String shopCode;
        private String currency;
        private String tableNumber;
        private String areaName;
        private List<MenuCategoryResponse> categories;
        private List<DishResponse> dishes;
    }
}
