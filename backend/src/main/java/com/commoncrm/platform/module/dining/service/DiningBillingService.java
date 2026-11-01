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
public class DiningBillingService {

    private final DiningSessionRepository sessionRepository;
    private final DiningBillRepository billRepository;
    private final DiningPaymentRepository paymentRepository;
    private final DiningTableRepository tableRepository;

    @Transactional(readOnly = true)
    public DiningBillResponse getBillBySessionId(Shop shop, Long sessionId) {
        DiningSession session = sessionRepository.findByIdAndShopId(sessionId, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dining Session", "id", sessionId));

        DiningBill bill = billRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Dining Bill for Session", "sessionId", sessionId));

        return mapBillToResponse(bill);
    }

    @Transactional(readOnly = true)
    public List<DiningBillResponse> getBills(Shop shop, String paymentStatus) {
        List<DiningBill> bills;
        if (paymentStatus != null && !paymentStatus.equalsIgnoreCase("ALL")) {
            bills = billRepository.findByShopIdAndPaymentStatusOrderByCreatedAtDesc(shop.getId(), paymentStatus.toUpperCase());
        } else {
            bills = billRepository.findByShopIdOrderByCreatedAtDesc(shop.getId());
        }
        return bills.stream().map(this::mapBillToResponse).collect(Collectors.toList());
    }

    @Transactional
    public DiningBillResponse generateBill(Shop shop, Long sessionId, GenerateBillRequest request) {
        DiningSession session = sessionRepository.findByIdAndShopId(sessionId, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dining Session", "id", sessionId));

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        if (session.getOrders() != null) {
            for (DiningOrder order : session.getOrders()) {
                if (!"CANCELLED".equalsIgnoreCase(order.getStatus()) && order.getItems() != null) {
                    for (DiningOrderItem item : order.getItems()) {
                        if (!"CANCELLED".equalsIgnoreCase(item.getStatus())) {
                            subtotal = subtotal.add(item.getSubtotal());
                            BigDecimal itemTax = item.getTotalPrice().subtract(item.getSubtotal());
                            taxTotal = taxTotal.add(itemTax);
                        }
                    }
                }
            }
        }

        BigDecimal discountTotal = (request != null && request.getDiscountTotal() != null)
                ? request.getDiscountTotal() : BigDecimal.ZERO;
        BigDecimal serviceCharge = (request != null && request.getServiceCharge() != null)
                ? request.getServiceCharge() : BigDecimal.ZERO;

        // grandTotal = (subtotal - discount) + taxTotal + serviceCharge
        BigDecimal grandTotal = subtotal.subtract(discountTotal).add(taxTotal).add(serviceCharge);
        if (grandTotal.compareTo(BigDecimal.ZERO) < 0) {
            grandTotal = BigDecimal.ZERO;
        }

        DiningBill bill = billRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId).orElse(null);

        if (bill == null) {
            String billNumber = "BILL-" + System.currentTimeMillis() % 1000000 + "-" + (100 + new Random().nextInt(900));
            bill = DiningBill.builder()
                    .tenantId(shop.getTenant().getId())
                    .shop(shop)
                    .session(session)
                    .billNumber(billNumber)
                    .subtotal(subtotal)
                    .discountTotal(discountTotal)
                    .taxTotal(taxTotal)
                    .serviceCharge(serviceCharge)
                    .grandTotal(grandTotal)
                    .paidAmount(BigDecimal.ZERO)
                    .balanceAmount(grandTotal)
                    .paymentStatus("PENDING")
                    .build();
        } else {
            bill.setSubtotal(subtotal);
            bill.setDiscountTotal(discountTotal);
            bill.setTaxTotal(taxTotal);
            bill.setServiceCharge(serviceCharge);
            bill.setGrandTotal(grandTotal);
            BigDecimal balance = grandTotal.subtract(bill.getPaidAmount());
            bill.setBalanceAmount(balance.compareTo(BigDecimal.ZERO) > 0 ? balance : BigDecimal.ZERO);
            if (bill.getBalanceAmount().compareTo(BigDecimal.ZERO) == 0 && bill.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
                bill.setPaymentStatus("PAID");
            }
        }

        DiningBill savedBill = billRepository.save(bill);

        // Update table status to BILL_REQUESTED if currently OCCUPIED
        DiningTable table = session.getTable();
        if ("OCCUPIED".equalsIgnoreCase(table.getStatus())) {
            table.setStatus("BILL_REQUESTED");
            tableRepository.save(table);
        }

        return mapBillToResponse(savedBill);
    }

    @Transactional
    public DiningBillResponse recordPayment(Shop shop, Long billId, RecordPaymentRequest request, String username) {
        DiningBill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Dining Bill", "id", billId));

        if (!bill.getShop().getId().equals(shop.getId())) {
            throw new ResourceNotFoundException("Dining Bill", "id", billId);
        }

        if ("PAID".equalsIgnoreCase(bill.getPaymentStatus())) {
            throw new BusinessException("Bill is already fully PAID");
        }

        BigDecimal payAmount = request.getAmount();
        DiningPayment payment = DiningPayment.builder()
                .tenantId(shop.getTenant().getId())
                .shop(shop)
                .bill(bill)
                .amount(payAmount)
                .paymentMode(request.getPaymentMode().toUpperCase())
                .transactionReference(request.getTransactionReference())
                .recordedByUsername(username != null ? username : "cashier")
                .build();

        paymentRepository.save(payment);

        BigDecimal newPaidAmount = bill.getPaidAmount().add(payAmount);
        bill.setPaidAmount(newPaidAmount);
        BigDecimal newBalance = bill.getGrandTotal().subtract(newPaidAmount);
        bill.setBalanceAmount(newBalance.compareTo(BigDecimal.ZERO) > 0 ? newBalance : BigDecimal.ZERO);

        if (bill.getBalanceAmount().compareTo(BigDecimal.ZERO) <= 0) {
            bill.setPaymentStatus("PAID");

            // Mark session closed / completed
            DiningSession session = bill.getSession();
            session.setStatus("BILLED");
            session.setClosedAt(Instant.now());
            sessionRepository.save(session);

            // Table status moves to CLEANING
            DiningTable table = session.getTable();
            table.setStatus("CLEANING");
            tableRepository.save(table);
        } else {
            bill.setPaymentStatus("PARTIALLY_PAID");
        }

        DiningBill savedBill = billRepository.save(bill);
        return mapBillToResponse(savedBill);
    }

    public DiningBillResponse mapBillToResponse(DiningBill bill) {
        List<DiningPaymentResponse> paymentDtos = new ArrayList<>();
        if (bill.getPayments() != null) {
            for (DiningPayment p : bill.getPayments()) {
                paymentDtos.add(DiningPaymentResponse.builder()
                        .id(p.getId())
                        .billId(bill.getId())
                        .amount(p.getAmount())
                        .paymentMode(p.getPaymentMode())
                        .transactionReference(p.getTransactionReference())
                        .recordedByUsername(p.getRecordedByUsername())
                        .createdAt(p.getCreatedAt())
                        .build());
            }
        }

        return DiningBillResponse.builder()
                .id(bill.getId())
                .sessionId(bill.getSession().getId())
                .sessionCode(bill.getSession().getSessionCode())
                .tableNumber(bill.getSession().getTable().getTableNumber())
                .billNumber(bill.getBillNumber())
                .subtotal(bill.getSubtotal())
                .discountTotal(bill.getDiscountTotal())
                .taxTotal(bill.getTaxTotal())
                .serviceCharge(bill.getServiceCharge())
                .grandTotal(bill.getGrandTotal())
                .paidAmount(bill.getPaidAmount())
                .balanceAmount(bill.getBalanceAmount())
                .paymentStatus(bill.getPaymentStatus())
                .createdAt(bill.getCreatedAt())
                .payments(paymentDtos)
                .build();
    }
}
