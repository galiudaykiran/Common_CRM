package com.commoncrm.platform.module.reports.service;

import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.common.audit.service.AuditService;
import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.reports.dto.ExpenseDto.*;
import com.commoncrm.platform.module.reports.entity.ShopExpense;
import com.commoncrm.platform.module.reports.repository.ShopExpenseRepository;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.service.ShopContextService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ShopExpenseService {

    private final ShopExpenseRepository expenseRepository;
    private final ShopContextService shopContextService;
    private final AuditService auditService;

    public ShopExpenseService(ShopExpenseRepository expenseRepository,
                              ShopContextService shopContextService,
                              AuditService auditService) {
        this.expenseRepository = expenseRepository;
        this.shopContextService = shopContextService;
        this.auditService = auditService;
    }

    @Transactional
    public ExpenseResponse createExpense(UserPrincipal principal, CreateExpenseRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);

        ShopExpense expense = ShopExpense.builder()
                .tenantId(shop.getTenant().getId())
                .shop(shop)
                .category(request.getCategory().toUpperCase())
                .title(request.getTitle().trim())
                .amount(request.getAmount())
                .expenseDate(request.getExpenseDate())
                .paymentMode(request.getPaymentMode() != null ? request.getPaymentMode().toUpperCase() : "CASH")
                .receiptReference(request.getReceiptReference())
                .notes(request.getNotes())
                .createdByUserId(principal.getId())
                .createdByName(principal.getUsername())
                .build();

        expense = expenseRepository.save(expense);

        auditService.logAction(
                principal.getId(),
                principal.getUsername(),
                shop.getTenant().getId(),
                "CREATE_EXPENSE",
                "EXPENSE",
                String.valueOf(expense.getId()),
                null,
                "Logged store expense '" + expense.getTitle() + "' (₹" + expense.getAmount() + " under " + expense.getCategory() + ")"
        );

        return toExpenseResponse(expense);
    }

    @Transactional(readOnly = true)
    public PageResponse<ExpenseResponse> getExpenses(UserPrincipal principal,
                                                     LocalDate startDate,
                                                     LocalDate endDate,
                                                     int page,
                                                     int size) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "expenseDate", "id"));

        Page<ShopExpense> expensePage = (startDate != null && endDate != null)
                ? expenseRepository.findByShopIdAndExpenseDateBetweenOrderByExpenseDateDesc(shop.getId(), startDate, endDate, pageable)
                : expenseRepository.findByShopIdOrderByExpenseDateDesc(shop.getId(), pageable);

        List<ExpenseResponse> content = expensePage.getContent().stream()
                .map(this::toExpenseResponse)
                .collect(Collectors.toList());

        return PageResponse.<ExpenseResponse>builder()
                .content(content)
                .page(expensePage.getNumber())
                .size(expensePage.getSize())
                .totalElements(expensePage.getTotalElements())
                .totalPages(expensePage.getTotalPages())
                .first(expensePage.isFirst())
                .last(expensePage.isLast())
                .build();
    }

    @Transactional
    public void deleteExpense(UserPrincipal principal, Long id) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        ShopExpense expense = expenseRepository.findByIdAndShopId(id, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));

        expenseRepository.delete(expense);

        auditService.logAction(
                principal.getId(),
                principal.getUsername(),
                shop.getTenant().getId(),
                "DELETE_EXPENSE",
                "EXPENSE",
                String.valueOf(id),
                expense.getTitle(),
                "Deleted store expense record"
        );
    }

    @Transactional(readOnly = true)
    public List<CategoryExpenseBreakdown> getCategoryBreakdown(UserPrincipal principal, LocalDate startDate, LocalDate endDate) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        LocalDate start = (startDate != null) ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = (endDate != null) ? endDate : LocalDate.now();

        List<Object[]> raw = expenseRepository.sumExpensesByCategory(shop.getId(), start, end);
        BigDecimal total = expenseRepository.sumExpensesByShopIdAndDateBetween(shop.getId(), start, end);

        List<CategoryExpenseBreakdown> list = new ArrayList<>();
        for (Object[] row : raw) {
            String category = (String) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            double pct = (total.compareTo(BigDecimal.ZERO) > 0)
                    ? amount.divide(total, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;

            list.add(CategoryExpenseBreakdown.builder()
                    .category(category)
                    .totalAmount(amount)
                    .percentage(Math.round(pct * 10.0) / 10.0)
                    .build());
        }
        return list;
    }

    private ExpenseResponse toExpenseResponse(ShopExpense e) {
        return ExpenseResponse.builder()
                .id(e.getId())
                .category(e.getCategory())
                .title(e.getTitle())
                .amount(e.getAmount())
                .expenseDate(e.getExpenseDate())
                .paymentMode(e.getPaymentMode())
                .receiptReference(e.getReceiptReference())
                .notes(e.getNotes())
                .createdByName(e.getCreatedByName())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
