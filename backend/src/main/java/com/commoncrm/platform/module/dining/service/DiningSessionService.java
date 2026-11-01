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
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiningSessionService {

    private final DiningSessionRepository sessionRepository;
    private final DiningTableRepository tableRepository;
    private final DiningBillRepository billRepository;

    @Transactional(readOnly = true)
    public List<DiningSessionResponse> getActiveSessions(Shop shop) {
        List<DiningSession> sessions = sessionRepository.findByShopIdAndStatus(shop.getId(), "ACTIVE");
        return sessions.stream().map(this::mapSessionToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DiningSessionResponse getSessionById(Shop shop, Long id) {
        DiningSession session = sessionRepository.findByIdAndShopId(id, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dining Session", "id", id));
        return mapSessionToResponse(session);
    }

    @Transactional(readOnly = true)
    public DiningSessionResponse getSessionByTableId(Shop shop, Long tableId) {
        DiningSession session = sessionRepository.findFirstByTableIdAndStatusOrderByOpenedAtDesc(tableId, "ACTIVE")
                .orElseThrow(() -> new ResourceNotFoundException("Active Session for Table", "tableId", tableId));
        return mapSessionToResponse(session);
    }

    @Transactional
    public DiningSessionResponse startSession(Shop shop, StartDiningSessionRequest request) {
        DiningTable table = tableRepository.findByIdAndShopId(request.getTableId(), shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dining Table", "id", request.getTableId()));

        if ("OCCUPIED".equalsIgnoreCase(table.getStatus())) {
            // Check if there is an active session
            boolean hasActive = sessionRepository.findFirstByTableIdAndStatusOrderByOpenedAtDesc(table.getId(), "ACTIVE").isPresent();
            if (hasActive) {
                throw new BusinessException("Table " + table.getTableNumber() + " is already OCCUPIED with an ongoing session");
            }
        }

        // Generate unique readable session code: SES-{SHOP_CODE}-{YYMMDD}-{RANDOM}
        String sessionCode = "SES-" + System.currentTimeMillis() % 1000000 + "-" + (1000 + new Random().nextInt(9000));

        DiningSession session = DiningSession.builder()
                .tenantId(shop.getTenant().getId())
                .shop(shop)
                .table(table)
                .sessionCode(sessionCode)
                .guestCount(request.getGuestCount() != null ? request.getGuestCount() : 1)
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .notes(request.getNotes())
                .openedAt(Instant.now())
                .status("ACTIVE")
                .build();

        DiningSession saved = sessionRepository.save(session);

        // Update table status to OCCUPIED
        table.setStatus("OCCUPIED");
        tableRepository.save(table);

        return mapSessionToResponse(saved);
    }

    @Transactional
    public DiningSessionResponse closeSession(Shop shop, Long sessionId) {
        DiningSession session = sessionRepository.findByIdAndShopId(sessionId, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dining Session", "id", sessionId));

        if ("CLOSED".equalsIgnoreCase(session.getStatus())) {
            return mapSessionToResponse(session);
        }

        session.setStatus("CLOSED");
        session.setClosedAt(Instant.now());
        DiningSession saved = sessionRepository.save(session);

        // Table moves to CLEANING state
        DiningTable table = session.getTable();
        table.setStatus("CLEANING");
        tableRepository.save(table);

        return mapSessionToResponse(saved);
    }

    public DiningSessionResponse mapSessionToResponse(DiningSession session) {
        BigDecimal ordersTotal = BigDecimal.ZERO;
        List<DiningOrderResponse> orderResponses = new ArrayList<>();

        if (session.getOrders() != null) {
            for (DiningOrder order : session.getOrders()) {
                BigDecimal orderSum = BigDecimal.ZERO;
                List<DiningOrderItemResponse> itemResponses = new ArrayList<>();

                if (order.getItems() != null) {
                    for (DiningOrderItem item : order.getItems()) {
                        if (!"CANCELLED".equalsIgnoreCase(item.getStatus())) {
                            orderSum = orderSum.add(item.getTotalPrice());
                        }
                        itemResponses.add(DiningOrderItemResponse.builder()
                                .id(item.getId())
                                .orderId(order.getId())
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
                                .build());
                    }
                }
                ordersTotal = ordersTotal.add(orderSum);

                orderResponses.add(DiningOrderResponse.builder()
                        .id(order.getId())
                        .sessionId(session.getId())
                        .sessionCode(session.getSessionCode())
                        .tableNumber(session.getTable().getTableNumber())
                        .orderNumber(order.getOrderNumber())
                        .notes(order.getNotes())
                        .status(order.getStatus())
                        .placedAt(order.getPlacedAt())
                        .orderTotal(orderSum)
                        .items(itemResponses)
                        .build());
            }
        }

        // Check if bill exists
        DiningBillResponse billResponse = null;
        var billOpt = billRepository.findFirstBySessionIdOrderByCreatedAtDesc(session.getId());
        if (billOpt.isPresent()) {
            DiningBill b = billOpt.get();
            billResponse = DiningBillResponse.builder()
                    .id(b.getId())
                    .sessionId(session.getId())
                    .sessionCode(session.getSessionCode())
                    .tableNumber(session.getTable().getTableNumber())
                    .billNumber(b.getBillNumber())
                    .subtotal(b.getSubtotal())
                    .discountTotal(b.getDiscountTotal())
                    .taxTotal(b.getTaxTotal())
                    .serviceCharge(b.getServiceCharge())
                    .grandTotal(b.getGrandTotal())
                    .paidAmount(b.getPaidAmount())
                    .balanceAmount(b.getBalanceAmount())
                    .paymentStatus(b.getPaymentStatus())
                    .createdAt(b.getCreatedAt())
                    .build();
        }

        return DiningSessionResponse.builder()
                .id(session.getId())
                .tableId(session.getTable().getId())
                .tableNumber(session.getTable().getTableNumber())
                .areaName(session.getTable().getArea() != null ? session.getTable().getArea().getName() : "Unassigned")
                .sessionCode(session.getSessionCode())
                .guestCount(session.getGuestCount())
                .customerName(session.getCustomerName())
                .customerPhone(session.getCustomerPhone())
                .notes(session.getNotes())
                .openedAt(session.getOpenedAt())
                .closedAt(session.getClosedAt())
                .status(session.getStatus())
                .ordersTotal(ordersTotal)
                .orders(orderResponses)
                .bill(billResponse)
                .build();
    }
}
