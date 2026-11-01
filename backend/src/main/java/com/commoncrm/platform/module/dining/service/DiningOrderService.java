package com.commoncrm.platform.module.dining.service;

import com.commoncrm.platform.common.exception.BusinessException;
import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.module.dining.dto.DiningDtos.*;
import com.commoncrm.platform.module.dining.entity.*;
import com.commoncrm.platform.module.dining.repository.*;
import com.commoncrm.platform.module.shop.entity.Shop;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiningOrderService {

    private final DiningSessionRepository sessionRepository;
    private final DiningOrderRepository orderRepository;
    private final DiningOrderItemRepository itemRepository;
    private final DiningOrderStatusHistoryRepository statusHistoryRepository;
    private final DishRepository dishRepository;

    @Transactional(readOnly = true)
    public List<DiningOrderResponse> getOrdersBySession(Shop shop, Long sessionId) {
        sessionRepository.findByIdAndShopId(sessionId, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dining Session", "id", sessionId));

        List<DiningOrder> orders = orderRepository.findBySessionIdOrderByPlacedAtAsc(sessionId);
        return orders.stream().map(this::mapOrderToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DiningOrderResponse> getActiveOrders(Shop shop) {
        List<DiningOrder> orders = orderRepository.findByShopIdAndStatusNotInOrderByPlacedAtDesc(
                shop.getId(), List.of("COMPLETED", "CANCELLED"));
        return orders.stream().map(this::mapOrderToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DiningOrderItemResponse> getKitchenActiveItems(Shop shop) {
        List<DiningOrderItem> items = itemRepository.findByShopIdAndStatusIn(
                shop.getId(), List.of("PLACED", "ACCEPTED", "PREPARING", "READY"));
        return items.stream().map(this::mapItemToResponse).collect(Collectors.toList());
    }

    @Transactional
    public DiningOrderResponse placeOrder(Shop shop, PlaceDiningOrderRequest request, String placedBy) {
        DiningSession session = sessionRepository.findByIdAndShopId(request.getSessionId(), shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dining Session", "id", request.getSessionId()));

        if (!"ACTIVE".equalsIgnoreCase(session.getStatus())) {
            throw new BusinessException("Cannot place order on session in " + session.getStatus() + " status");
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BusinessException("Order must contain at least one item");
        }

        String orderNumber = "ORD-" + System.currentTimeMillis() % 1000000 + "-" + (100 + new Random().nextInt(900));

        DiningOrder order = DiningOrder.builder()
                .tenantId(shop.getTenant().getId())
                .shop(shop)
                .session(session)
                .orderNumber(orderNumber)
                .notes(request.getNotes())
                .status("PLACED")
                .placedAt(Instant.now())
                .build();

        DiningOrder savedOrder = orderRepository.save(order);

        List<DiningOrderItem> savedItems = new ArrayList<>();
        for (PlaceOrderItemRequest itemReq : request.getItems()) {
            Dish dish = dishRepository.findByIdAndShopId(itemReq.getDishId(), shop.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Dish", "id", itemReq.getDishId()));

            int qty = itemReq.getQuantity() != null && itemReq.getQuantity() > 0 ? itemReq.getQuantity() : 1;
            BigDecimal unitPrice = dish.getBasePrice() != null ? dish.getBasePrice() : BigDecimal.ZERO;
            BigDecimal variantPrice = BigDecimal.ZERO;

            if (itemReq.getVariantPrice() != null && itemReq.getVariantPrice().compareTo(BigDecimal.ZERO) > 0) {
                variantPrice = itemReq.getVariantPrice();
                unitPrice = variantPrice; // variant price overrides base price
            }

            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(qty));
            BigDecimal taxRate = dish.getTaxRate() != null ? dish.getTaxRate() : BigDecimal.ZERO;
            BigDecimal taxAmount = subtotal.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal totalPrice = subtotal.add(taxAmount);

            DiningOrderItem item = DiningOrderItem.builder()
                    .order(savedOrder)
                    .dishId(dish.getId())
                    .dishName(dish.getName())
                    .variantName(itemReq.getVariantName())
                    .variantPrice(variantPrice)
                    .quantity(qty)
                    .unitPrice(unitPrice)
                    .taxRate(taxRate)
                    .subtotal(subtotal)
                    .totalPrice(totalPrice)
                    .specialInstructions(itemReq.getSpecialInstructions())
                    .status("PLACED")
                    .build();

            DiningOrderItem savedItem = itemRepository.save(item);
            savedItems.add(savedItem);

            // Record status history for item
            DiningOrderStatusHistory history = DiningOrderStatusHistory.builder()
                    .orderId(savedOrder.getId())
                    .orderItemId(savedItem.getId())
                    .previousStatus(null)
                    .newStatus("PLACED")
                    .changedByUsername(placedBy != null ? placedBy : "system")
                    .remarks("Item initially placed")
                    .build();
            statusHistoryRepository.save(history);
        }

        savedOrder.setItems(savedItems);
        return mapOrderToResponse(savedOrder);
    }

    @Transactional
    public DiningOrderItemResponse updateOrderItemStatus(Shop shop, Long orderItemId, UpdateOrderItemStatusRequest request, String changedBy) {
        DiningOrderItem item = itemRepository.findById(orderItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order Item", "id", orderItemId));

        if (!item.getOrder().getShop().getId().equals(shop.getId())) {
            throw new ResourceNotFoundException("Order Item", "id", orderItemId);
        }

        String oldStatus = item.getStatus();
        String newStatus = request.getStatus().trim().toUpperCase();

        item.setStatus(newStatus);
        DiningOrderItem savedItem = itemRepository.save(item);

        // Record history
        DiningOrderStatusHistory history = DiningOrderStatusHistory.builder()
                .orderId(item.getOrder().getId())
                .orderItemId(savedItem.getId())
                .previousStatus(oldStatus)
                .newStatus(newStatus)
                .changedByUsername(changedBy != null ? changedBy : "system")
                .remarks(request.getRemarks())
                .build();
        statusHistoryRepository.save(history);

        // Check if all items in order have reached SERVED or CANCELLED
        checkAndUpdateOverallOrderStatus(item.getOrder());

        return mapItemToResponse(savedItem);
    }

    private void checkAndUpdateOverallOrderStatus(DiningOrder order) {
        List<DiningOrderItem> allItems = itemRepository.findByOrderId(order.getId());
        if (allItems.isEmpty()) return;

        boolean allServedOrCancelled = allItems.stream()
                .allMatch(i -> "SERVED".equalsIgnoreCase(i.getStatus()) || "CANCELLED".equalsIgnoreCase(i.getStatus()));

        if (allServedOrCancelled) {
            boolean allCancelled = allItems.stream().allMatch(i -> "CANCELLED".equalsIgnoreCase(i.getStatus()));
            order.setStatus(allCancelled ? "CANCELLED" : "SERVED");
            orderRepository.save(order);
        } else {
            boolean hasPreparing = allItems.stream().anyMatch(i -> "PREPARING".equalsIgnoreCase(i.getStatus()));
            boolean hasReady = allItems.stream().anyMatch(i -> "READY".equalsIgnoreCase(i.getStatus()));
            if (hasReady) {
                order.setStatus("READY");
            } else if (hasPreparing) {
                order.setStatus("PREPARING");
            } else {
                order.setStatus("ACCEPTED");
            }
            orderRepository.save(order);
        }
    }

    private DiningOrderResponse mapOrderToResponse(DiningOrder order) {
        BigDecimal sum = BigDecimal.ZERO;
        List<DiningOrderItemResponse> itemDtos = new ArrayList<>();

        if (order.getItems() != null) {
            for (DiningOrderItem item : order.getItems()) {
                if (!"CANCELLED".equalsIgnoreCase(item.getStatus())) {
                    sum = sum.add(item.getTotalPrice());
                }
                itemDtos.add(mapItemToResponse(item));
            }
        }

        return DiningOrderResponse.builder()
                .id(order.getId())
                .sessionId(order.getSession().getId())
                .sessionCode(order.getSession().getSessionCode())
                .tableNumber(order.getSession().getTable().getTableNumber())
                .orderNumber(order.getOrderNumber())
                .notes(order.getNotes())
                .status(order.getStatus())
                .placedAt(order.getPlacedAt())
                .orderTotal(sum)
                .items(itemDtos)
                .build();
    }

    private DiningOrderItemResponse mapItemToResponse(DiningOrderItem item) {
        return DiningOrderItemResponse.builder()
                .id(item.getId())
                .orderId(item.getOrder().getId())
                .dishId(item.getDishId())
                .dishName(item.getDishName())
                .variantName(item.getVariantName())
                .variantPrice(item.getVariantPrice())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .taxRate(item.getTaxRate())
                .subtotal(item.getSubtotal())
                .totalPrice(item.getTotalPrice())
                .specialInstructions(item.getSpecialInstructions())
                .status(item.getStatus())
                .build();
    }
}
