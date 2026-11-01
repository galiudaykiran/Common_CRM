package com.commoncrm.platform.module.reports.service;

import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.billing.entity.Invoice;
import com.commoncrm.platform.module.billing.entity.InvoiceItem;
import com.commoncrm.platform.module.billing.repository.InvoiceRepository;
import com.commoncrm.platform.module.dining.entity.DiningBill;
import com.commoncrm.platform.module.dining.repository.DiningBillRepository;
import com.commoncrm.platform.module.dining.repository.DiningOrderItemRepository;
import com.commoncrm.platform.module.dining.repository.DiningPaymentRepository;
import com.commoncrm.platform.module.inventory.entity.Inventory;
import com.commoncrm.platform.module.inventory.entity.Product;
import com.commoncrm.platform.module.inventory.repository.InventoryRepository;
import com.commoncrm.platform.module.inventory.repository.InventoryTransactionRepository;
import com.commoncrm.platform.module.reports.dto.BusinessReportsDto.*;
import com.commoncrm.platform.module.reports.repository.ShopExpenseRepository;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.service.ShopContextService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BusinessReportsService {

    private final InvoiceRepository invoiceRepository;
    private final ShopExpenseRepository expenseRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final InventoryRepository inventoryRepository;
    private final ShopContextService shopContextService;
    private final DiningBillRepository diningBillRepository;
    private final DiningPaymentRepository diningPaymentRepository;
    private final DiningOrderItemRepository diningOrderItemRepository;
    private final com.commoncrm.platform.module.shop.repository.ShopModuleRepository shopModuleRepository;

    @Autowired
    public BusinessReportsService(InvoiceRepository invoiceRepository,
                                  ShopExpenseRepository expenseRepository,
                                  InventoryTransactionRepository inventoryTransactionRepository,
                                  InventoryRepository inventoryRepository,
                                  ShopContextService shopContextService,
                                  DiningBillRepository diningBillRepository,
                                  DiningPaymentRepository diningPaymentRepository,
                                  DiningOrderItemRepository diningOrderItemRepository,
                                  com.commoncrm.platform.module.shop.repository.ShopModuleRepository shopModuleRepository) {
        this.invoiceRepository = invoiceRepository;
        this.expenseRepository = expenseRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.inventoryRepository = inventoryRepository;
        this.shopContextService = shopContextService;
        this.diningBillRepository = diningBillRepository;
        this.diningPaymentRepository = diningPaymentRepository;
        this.diningOrderItemRepository = diningOrderItemRepository;
        this.shopModuleRepository = shopModuleRepository;
    }

    public BusinessReportsService(InvoiceRepository invoiceRepository,
                                  ShopExpenseRepository expenseRepository,
                                  InventoryTransactionRepository inventoryTransactionRepository,
                                  InventoryRepository inventoryRepository,
                                  ShopContextService shopContextService,
                                  DiningBillRepository diningBillRepository,
                                  DiningPaymentRepository diningPaymentRepository,
                                  DiningOrderItemRepository diningOrderItemRepository) {
        this(invoiceRepository, expenseRepository, inventoryTransactionRepository, inventoryRepository,
                shopContextService, diningBillRepository, diningPaymentRepository, diningOrderItemRepository, null);
    }

    private boolean isDiningEnabled(Shop shop) {
        if (shopModuleRepository == null) return true;
        return shopModuleRepository.findAllWithModuleByShopId(shop.getId()).stream()
                .anyMatch(sm -> "DINING".equalsIgnoreCase(sm.getModule().getCode())
                        && sm.isEnabled()
                        && sm.getModule() != null
                        && sm.getModule().isActive());
    }

    @Transactional(readOnly = true)
    public FinancialSummaryResponse getFinancialSummary(UserPrincipal principal, LocalDate startDate, LocalDate endDate) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        LocalDate start = (startDate != null) ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = (endDate != null) ? endDate : LocalDate.now();

        final ZoneId zone = resolveZone(shop);
        Instant startInstant = start.atStartOfDay(zone).toInstant();
        Instant endInstant = end.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1);

        // 1. Retail POS Invoices
        List<Invoice> invoices = invoiceRepository.findByShopIdAndCreatedAtBetween(shop.getId(), startInstant, endInstant);

        // 2. Restaurant & Dining Bills (Paid or Active) - only if Dining module is enabled
        boolean diningActive = isDiningEnabled(shop);
        List<DiningBill> diningBills = (diningBillRepository != null && diningActive)
                ? diningBillRepository.findByShopIdAndCreatedAtBetween(shop.getId(), startInstant, endInstant).stream()
                    .filter(b -> !"CANCELLED".equalsIgnoreCase(b.getPaymentStatus()) &&
                            (b.getPaidAmount().compareTo(BigDecimal.ZERO) > 0 || "PAID".equalsIgnoreCase(b.getPaymentStatus())))
                    .collect(Collectors.toList())
                : Collections.emptyList();

        BigDecimal retailGross = BigDecimal.ZERO;
        BigDecimal retailDiscounts = BigDecimal.ZERO;
        BigDecimal retailTax = BigDecimal.ZERO;
        BigDecimal retailGrandTotal = BigDecimal.ZERO;
        BigDecimal cogs = BigDecimal.ZERO;

        for (Invoice inv : invoices) {
            retailGross = retailGross.add(inv.getSubtotal() != null ? inv.getSubtotal() : BigDecimal.ZERO);
            BigDecimal disc = (inv.getItemDiscountTotal() != null ? inv.getItemDiscountTotal() : BigDecimal.ZERO)
                    .add(inv.getInvoiceDiscountTotal() != null ? inv.getInvoiceDiscountTotal() : BigDecimal.ZERO);
            retailDiscounts = retailDiscounts.add(disc);
            retailTax = retailTax.add(inv.getTotalTax() != null ? inv.getTotalTax() : BigDecimal.ZERO);
            retailGrandTotal = retailGrandTotal.add(inv.getGrandTotal() != null ? inv.getGrandTotal() : BigDecimal.ZERO);

            if (inv.getItems() != null) {
                for (InvoiceItem item : inv.getItems()) {
                    BigDecimal unitCost = item.getUnitCost() != null ? item.getUnitCost() : BigDecimal.ZERO;
                    BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                    cogs = cogs.add(unitCost.multiply(qty));
                }
            }
        }

        BigDecimal diningGross = BigDecimal.ZERO;
        BigDecimal diningDiscounts = BigDecimal.ZERO;
        BigDecimal diningTax = BigDecimal.ZERO;
        BigDecimal diningGrandTotal = BigDecimal.ZERO;

        for (DiningBill bill : diningBills) {
            diningGross = diningGross.add(bill.getSubtotal() != null ? bill.getSubtotal() : BigDecimal.ZERO);
            diningDiscounts = diningDiscounts.add(bill.getDiscountTotal() != null ? bill.getDiscountTotal() : BigDecimal.ZERO);
            diningTax = diningTax.add(bill.getTaxTotal() != null ? bill.getTaxTotal() : BigDecimal.ZERO);
            diningGrandTotal = diningGrandTotal.add(bill.getPaidAmount() != null && bill.getPaidAmount().compareTo(BigDecimal.ZERO) > 0
                    ? bill.getPaidAmount() : (bill.getGrandTotal() != null ? bill.getGrandTotal() : BigDecimal.ZERO));
        }

        BigDecimal grossRevenue = retailGross.add(diningGross);
        BigDecimal totalDiscounts = retailDiscounts.add(diningDiscounts);
        BigDecimal totalTax = retailTax.add(diningTax);
        BigDecimal grandTotal = retailGrandTotal.add(diningGrandTotal);

        BigDecimal netRevenue = grossRevenue.subtract(totalDiscounts);
        BigDecimal grossProfit = netRevenue.subtract(cogs);

        double grossMarginPercent = (netRevenue.compareTo(BigDecimal.ZERO) > 0)
                ? grossProfit.divide(netRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                : 0.0;

        BigDecimal operatingExpenses = expenseRepository.sumExpensesByShopIdAndDateBetween(shop.getId(), start, end);
        if (operatingExpenses == null) operatingExpenses = BigDecimal.ZERO;

        BigDecimal shrinkageLoss = inventoryTransactionRepository.sumInventoryLossBetween(shop.getId(), startInstant, endInstant);
        if (shrinkageLoss == null) shrinkageLoss = BigDecimal.ZERO;

        BigDecimal totalOutflows = operatingExpenses.add(shrinkageLoss);
        BigDecimal netProfit = grossProfit.subtract(totalOutflows);

        double netMarginPercent = (netRevenue.compareTo(BigDecimal.ZERO) > 0)
                ? netProfit.divide(netRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                : 0.0;

        long totalBillsCount = invoices.size() + diningBills.size();
        BigDecimal averageBillValue = (totalBillsCount > 0)
                ? grandTotal.divide(BigDecimal.valueOf(totalBillsCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Dynamic calculation vs immediately preceding identical duration period
        long periodDays = ChronoUnit.DAYS.between(start, end) + 1;
        LocalDate prevStart = start.minusDays(periodDays);
        LocalDate prevEnd = start.minusDays(1);
        Instant prevStartInstant = prevStart.atStartOfDay(zone).toInstant();
        Instant prevEndInstant = prevEnd.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1);

        BigDecimal prevGrossRevenue = invoiceRepository.sumRevenueBetween(shop.getId(), prevStartInstant, prevEndInstant);
        if (prevGrossRevenue == null) prevGrossRevenue = BigDecimal.ZERO;
        long prevInvoicesCount = invoiceRepository.countCompletedBetween(shop.getId(), prevStartInstant, prevEndInstant);

        if (diningBillRepository != null && diningActive) {
            BigDecimal prevDiningGross = diningBillRepository.sumPaidRevenueBetween(shop.getId(), prevStartInstant, prevEndInstant);
            if (prevDiningGross != null) prevGrossRevenue = prevGrossRevenue.add(prevDiningGross);
            prevInvoicesCount += diningBillRepository.countPaidBillsBetween(shop.getId(), prevStartInstant, prevEndInstant);
        }

        Double growthPercent = null;
        if (prevGrossRevenue.compareTo(BigDecimal.ZERO) > 0) {
            growthPercent = grossRevenue.subtract(prevGrossRevenue)
                    .divide(prevGrossRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP)
                    .doubleValue();
        } else if (grossRevenue.compareTo(BigDecimal.ZERO) > 0) {
            growthPercent = 100.0;
        } else {
            growthPercent = 0.0;
        }

        return FinancialSummaryResponse.builder()
                .startDate(start)
                .endDate(end)
                .periodLabel(start.equals(end) ? start.toString() : start + " to " + end)
                .totalInvoicesCount(totalBillsCount)
                .grossRevenue(grossRevenue.setScale(2, RoundingMode.HALF_UP))
                .totalDiscounts(totalDiscounts.setScale(2, RoundingMode.HALF_UP))
                .netRevenue(netRevenue.setScale(2, RoundingMode.HALF_UP))
                .costOfGoodsSold(cogs.setScale(2, RoundingMode.HALF_UP))
                .grossProfit(grossProfit.setScale(2, RoundingMode.HALF_UP))
                .grossMarginPercent(Math.round(grossMarginPercent * 10.0) / 10.0)
                .operatingExpenses(operatingExpenses.setScale(2, RoundingMode.HALF_UP))
                .inventoryShrinkageLoss(shrinkageLoss.setScale(2, RoundingMode.HALF_UP))
                .totalOutflows(totalOutflows.setScale(2, RoundingMode.HALF_UP))
                .netProfit(netProfit.setScale(2, RoundingMode.HALF_UP))
                .netMarginPercent(Math.round(netMarginPercent * 10.0) / 10.0)
                .isNetProfit(netProfit.compareTo(BigDecimal.ZERO) >= 0)
                .totalGstCollected(totalTax.setScale(2, RoundingMode.HALF_UP))
                .averageBillValue(averageBillValue)
                .previousGrossRevenue(prevGrossRevenue.setScale(2, RoundingMode.HALF_UP))
                .revenueGrowthPercent(growthPercent)
                .previousInvoicesCount(prevInvoicesCount)
                .diningRevenue(diningGross.subtract(diningDiscounts).setScale(2, RoundingMode.HALF_UP))
                .diningBillsCount(diningBills.size())
                .retailRevenue(retailGross.subtract(retailDiscounts).setScale(2, RoundingMode.HALF_UP))
                .retailInvoicesCount(invoices.size())
                .build();
    }

    @Transactional(readOnly = true)
    public List<DailyTrendPoint> getDailyTrends(UserPrincipal principal, LocalDate startDate, LocalDate endDate) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        LocalDate start = (startDate != null) ? startDate : LocalDate.now().minusDays(14);
        LocalDate end = (endDate != null) ? endDate : LocalDate.now();

        final ZoneId zone = resolveZone(shop);
        Instant startInstant = start.atStartOfDay(zone).toInstant();
        Instant endInstant = end.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1);

        List<Invoice> invoices = invoiceRepository.findByShopIdAndCreatedAtBetween(shop.getId(), startInstant, endInstant);
        boolean diningActive = isDiningEnabled(shop);
        List<DiningBill> diningBills = (diningBillRepository != null && diningActive)
                ? diningBillRepository.findByShopIdAndCreatedAtBetween(shop.getId(), startInstant, endInstant).stream()
                    .filter(b -> !"CANCELLED".equalsIgnoreCase(b.getPaymentStatus()) &&
                            (b.getPaidAmount().compareTo(BigDecimal.ZERO) > 0 || "PAID".equalsIgnoreCase(b.getPaymentStatus())))
                    .collect(Collectors.toList())
                : Collections.emptyList();

        // CASE 1: Single Day / Today -> Group by operating hours timing intervals (08:00 to 22:00)
        if (start.equals(end)) {
            List<DailyTrendPoint> hourlyPoints = new ArrayList<>();
            int[] hours = {8, 10, 12, 14, 16, 18, 20, 22};
            for (int h : hours) {
                int nextH = h + 2;
                String label = String.format("%02d:00", h);
                BigDecimal slotRev = BigDecimal.ZERO;
                BigDecimal slotCogs = BigDecimal.ZERO;
                int billCount = 0;

                for (Invoice inv : invoices) {
                    int invHour = inv.getCreatedAt().atZone(zone).getHour();
                    if (invHour >= h && invHour < nextH) {
                        BigDecimal net = (inv.getSubtotal() != null ? inv.getSubtotal() : BigDecimal.ZERO)
                                .subtract(inv.getItemDiscountTotal() != null ? inv.getItemDiscountTotal() : BigDecimal.ZERO)
                                .subtract(inv.getInvoiceDiscountTotal() != null ? inv.getInvoiceDiscountTotal() : BigDecimal.ZERO);
                        slotRev = slotRev.add(net);
                        if (inv.getItems() != null) {
                            for (InvoiceItem item : inv.getItems()) {
                                BigDecimal cost = item.getUnitCost() != null ? item.getUnitCost() : BigDecimal.ZERO;
                                BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                                slotCogs = slotCogs.add(cost.multiply(qty));
                            }
                        }
                        billCount++;
                    }
                }

                for (DiningBill bill : diningBills) {
                    int billHour = bill.getCreatedAt().atZone(zone).getHour();
                    if (billHour >= h && billHour < nextH) {
                        BigDecimal net = (bill.getSubtotal() != null ? bill.getSubtotal() : BigDecimal.ZERO)
                                .subtract(bill.getDiscountTotal() != null ? bill.getDiscountTotal() : BigDecimal.ZERO);
                        slotRev = slotRev.add(net);
                        billCount++;
                    }
                }

                BigDecimal slotGross = slotRev.subtract(slotCogs);
                hourlyPoints.add(DailyTrendPoint.builder()
                        .dateFormatted(label)
                        .revenue(slotRev.setScale(2, RoundingMode.HALF_UP))
                        .cogs(slotCogs.setScale(2, RoundingMode.HALF_UP))
                        .grossProfit(slotGross.setScale(2, RoundingMode.HALF_UP))
                        .expenses(BigDecimal.ZERO)
                        .netProfit(slotGross.setScale(2, RoundingMode.HALF_UP))
                        .billCount(billCount)
                        .build());
            }
            return hourlyPoints;
        }

        // CASE 2: Multi-month / Quarter / Year -> If span > 62 days, group by Month
        long daysDiff = ChronoUnit.DAYS.between(start, end);
        if (daysDiff > 62) {
            Map<YearMonth, List<Invoice>> invoicesByMonth = invoices.stream()
                    .collect(Collectors.groupingBy(inv -> YearMonth.from(inv.getCreatedAt().atZone(zone))));
            Map<YearMonth, List<DiningBill>> diningByMonth = diningBills.stream()
                    .collect(Collectors.groupingBy(b -> YearMonth.from(b.getCreatedAt().atZone(zone))));

            DateTimeFormatter ymFormatter = DateTimeFormatter.ofPattern("MMM yyyy");
            List<DailyTrendPoint> monthlyPoints = new ArrayList<>();
            YearMonth startYm = YearMonth.from(start);
            YearMonth endYm = YearMonth.from(end);

            for (YearMonth ym = startYm; !ym.isAfter(endYm); ym = ym.plusMonths(1)) {
                List<Invoice> monthInvoices = invoicesByMonth.getOrDefault(ym, Collections.emptyList());
                List<DiningBill> monthDining = diningByMonth.getOrDefault(ym, Collections.emptyList());

                BigDecimal mRev = BigDecimal.ZERO;
                BigDecimal mCogs = BigDecimal.ZERO;
                for (Invoice inv : monthInvoices) {
                    BigDecimal net = (inv.getSubtotal() != null ? inv.getSubtotal() : BigDecimal.ZERO)
                            .subtract(inv.getItemDiscountTotal() != null ? inv.getItemDiscountTotal() : BigDecimal.ZERO)
                            .subtract(inv.getInvoiceDiscountTotal() != null ? inv.getInvoiceDiscountTotal() : BigDecimal.ZERO);
                    mRev = mRev.add(net);
                    if (inv.getItems() != null) {
                        for (InvoiceItem item : inv.getItems()) {
                            BigDecimal cost = item.getUnitCost() != null ? item.getUnitCost() : BigDecimal.ZERO;
                            BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                            mCogs = mCogs.add(cost.multiply(qty));
                        }
                    }
                }
                for (DiningBill bill : monthDining) {
                    BigDecimal net = (bill.getSubtotal() != null ? bill.getSubtotal() : BigDecimal.ZERO)
                            .subtract(bill.getDiscountTotal() != null ? bill.getDiscountTotal() : BigDecimal.ZERO);
                    mRev = mRev.add(net);
                }

                LocalDate monthStart = ym.atDay(1);
                LocalDate monthEnd = ym.atEndOfMonth();
                BigDecimal mExpenses = expenseRepository.sumExpensesByShopIdAndDateBetween(shop.getId(), monthStart, monthEnd);
                if (mExpenses == null) mExpenses = BigDecimal.ZERO;

                BigDecimal mGross = mRev.subtract(mCogs);
                BigDecimal mNet = mGross.subtract(mExpenses);

                monthlyPoints.add(DailyTrendPoint.builder()
                        .dateFormatted(ym.format(ymFormatter))
                        .revenue(mRev.setScale(2, RoundingMode.HALF_UP))
                        .cogs(mCogs.setScale(2, RoundingMode.HALF_UP))
                        .grossProfit(mGross.setScale(2, RoundingMode.HALF_UP))
                        .expenses(mExpenses.setScale(2, RoundingMode.HALF_UP))
                        .netProfit(mNet.setScale(2, RoundingMode.HALF_UP))
                        .billCount(monthInvoices.size() + monthDining.size())
                        .build());
            }
            return monthlyPoints;
        }

        // CASE 3: Days interval (7 Days, This Month, Last Month) -> Group by individual day
        Map<LocalDate, List<Invoice>> invoicesByDate = invoices.stream()
                .collect(Collectors.groupingBy(inv -> inv.getCreatedAt().atZone(zone).toLocalDate()));
        Map<LocalDate, List<DiningBill>> diningByDate = diningBills.stream()
                .collect(Collectors.groupingBy(b -> b.getCreatedAt().atZone(zone).toLocalDate()));

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        List<DailyTrendPoint> points = new ArrayList<>();

        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            List<Invoice> dayInvoices = invoicesByDate.getOrDefault(d, Collections.emptyList());
            List<DiningBill> dayDining = diningByDate.getOrDefault(d, Collections.emptyList());

            BigDecimal dayRev = BigDecimal.ZERO;
            BigDecimal dayCogs = BigDecimal.ZERO;
            for (Invoice inv : dayInvoices) {
                BigDecimal net = (inv.getSubtotal() != null ? inv.getSubtotal() : BigDecimal.ZERO)
                        .subtract(inv.getItemDiscountTotal() != null ? inv.getItemDiscountTotal() : BigDecimal.ZERO)
                        .subtract(inv.getInvoiceDiscountTotal() != null ? inv.getInvoiceDiscountTotal() : BigDecimal.ZERO);
                dayRev = dayRev.add(net);

                if (inv.getItems() != null) {
                    for (InvoiceItem item : inv.getItems()) {
                        BigDecimal cost = item.getUnitCost() != null ? item.getUnitCost() : BigDecimal.ZERO;
                        BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                        dayCogs = dayCogs.add(cost.multiply(qty));
                    }
                }
            }
            for (DiningBill bill : dayDining) {
                BigDecimal net = (bill.getSubtotal() != null ? bill.getSubtotal() : BigDecimal.ZERO)
                        .subtract(bill.getDiscountTotal() != null ? bill.getDiscountTotal() : BigDecimal.ZERO);
                dayRev = dayRev.add(net);
            }

            BigDecimal dayExpenses = expenseRepository.sumExpensesByShopIdAndDateBetween(shop.getId(), d, d);
            if (dayExpenses == null) dayExpenses = BigDecimal.ZERO;

            BigDecimal dayGross = dayRev.subtract(dayCogs);
            BigDecimal dayNet = dayGross.subtract(dayExpenses);

            points.add(DailyTrendPoint.builder()
                    .dateFormatted(d.format(dtf))
                    .revenue(dayRev.setScale(2, RoundingMode.HALF_UP))
                    .cogs(dayCogs.setScale(2, RoundingMode.HALF_UP))
                    .grossProfit(dayGross.setScale(2, RoundingMode.HALF_UP))
                    .expenses(dayExpenses.setScale(2, RoundingMode.HALF_UP))
                    .netProfit(dayNet.setScale(2, RoundingMode.HALF_UP))
                    .billCount(dayInvoices.size() + dayDining.size())
                    .build());
        }

        return points;
    }

    @Transactional(readOnly = true)
    public List<ProductProfitabilityStat> getProductProfitability(UserPrincipal principal, LocalDate startDate, LocalDate endDate, int limit) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        LocalDate start = (startDate != null) ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = (endDate != null) ? endDate : LocalDate.now();

        ZoneId zone = resolveZone(shop);
        Instant startInstant = start.atStartOfDay(zone).toInstant();
        Instant endInstant = end.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1);

        List<Invoice> invoices = invoiceRepository.findByShopIdAndCreatedAtBetween(shop.getId(), startInstant, endInstant);

        Map<Long, ProductProfitabilityStat> map = new HashMap<>();

        for (Invoice inv : invoices) {
            if (inv.getItems() == null) continue;
            for (InvoiceItem it : inv.getItems()) {
                Long pId = (it.getProduct() != null) ? it.getProduct().getId() : 0L;
                BigDecimal qty = it.getQuantity() != null ? it.getQuantity() : BigDecimal.ZERO;
                BigDecimal lineRev = it.getLineTotal() != null ? it.getLineTotal() : BigDecimal.ZERO;
                BigDecimal cost = (it.getUnitCost() != null ? it.getUnitCost() : BigDecimal.ZERO).multiply(qty);

                ProductProfitabilityStat stat = map.computeIfAbsent(pId, k -> ProductProfitabilityStat.builder()
                        .productId(pId)
                        .productName(it.getProductName())
                        .sku(it.getSku())
                        .quantitySold(BigDecimal.ZERO)
                        .totalRevenue(BigDecimal.ZERO)
                        .totalCost(BigDecimal.ZERO)
                        .grossProfit(BigDecimal.ZERO)
                        .marginPercent(0.0)
                        .build());

                stat.setQuantitySold(stat.getQuantitySold().add(qty));
                stat.setTotalRevenue(stat.getTotalRevenue().add(lineRev));
                stat.setTotalCost(stat.getTotalCost().add(cost));
            }
        }

        // Merge Dine-In dishes sold from Restaurant & Dining module (if module enabled)
        if (diningOrderItemRepository != null && isDiningEnabled(shop)) {
            List<Object[]> dishStats = diningOrderItemRepository.findDishSalesStatsBetween(shop.getId(), startInstant, endInstant);
            for (Object[] r : dishStats) {
                Long dishId = (Long) r[0];
                String dishName = (String) r[1];
                BigDecimal qty = (r[2] instanceof BigDecimal) ? (BigDecimal) r[2] : BigDecimal.valueOf(((Number) r[2]).longValue());
                BigDecimal rev = (BigDecimal) r[3];
                Long virtualDishKey = -(1000000L + (dishId != null ? dishId : 0L));

                ProductProfitabilityStat stat = map.computeIfAbsent(virtualDishKey, k -> ProductProfitabilityStat.builder()
                        .productId(virtualDishKey)
                        .productName(dishName + " (🍽️ Dine-In)")
                        .sku("DINE-IN-" + dishId)
                        .quantitySold(BigDecimal.ZERO)
                        .totalRevenue(BigDecimal.ZERO)
                        .totalCost(BigDecimal.ZERO)
                        .grossProfit(BigDecimal.ZERO)
                        .marginPercent(0.0)
                        .build());

                stat.setQuantitySold(stat.getQuantitySold().add(qty));
                stat.setTotalRevenue(stat.getTotalRevenue().add(rev));
            }
        }

        List<ProductProfitabilityStat> list = new ArrayList<>(map.values());
        for (ProductProfitabilityStat stat : list) {
            BigDecimal profit = stat.getTotalRevenue().subtract(stat.getTotalCost());
            stat.setGrossProfit(profit.setScale(2, RoundingMode.HALF_UP));
            double margin = (stat.getTotalRevenue().compareTo(BigDecimal.ZERO) > 0)
                    ? profit.divide(stat.getTotalRevenue(), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;
            stat.setMarginPercent(Math.round(margin * 10.0) / 10.0);
        }

        list.sort((a, b) -> b.getGrossProfit().compareTo(a.getGrossProfit()));
        return list.stream().limit(Math.max(1, limit)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentModeStat> getPaymentModeBreakdown(UserPrincipal principal, LocalDate startDate, LocalDate endDate) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        LocalDate start = (startDate != null) ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = (endDate != null) ? endDate : LocalDate.now();

        ZoneId zone = resolveZone(shop);
        Instant startInstant = start.atStartOfDay(zone).toInstant();
        Instant endInstant = end.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1);

        List<Object[]> rawInvoices = invoiceRepository.sumRevenueByPaymentModeBetween(shop.getId(), startInstant, endInstant);
        List<Object[]> rawDining = (diningPaymentRepository != null && isDiningEnabled(shop))
                ? diningPaymentRepository.sumRevenueByPaymentModeBetween(shop.getId(), startInstant, endInstant)
                : Collections.emptyList();

        Map<String, BigDecimal> modeAmounts = new HashMap<>();
        Map<String, Long> modeCounts = new HashMap<>();
        BigDecimal total = BigDecimal.ZERO;

        for (Object[] r : rawInvoices) {
            String mode = (r[0] != null ? ((String) r[0]).toUpperCase() : "CASH");
            BigDecimal amount = (BigDecimal) r[1];
            long count = (Long) r[2];

            modeAmounts.put(mode, modeAmounts.getOrDefault(mode, BigDecimal.ZERO).add(amount));
            modeCounts.put(mode, modeCounts.getOrDefault(mode, 0L) + count);
            total = total.add(amount);
        }

        for (Object[] r : rawDining) {
            String mode = (r[0] != null ? ((String) r[0]).toUpperCase() : "CASH");
            BigDecimal amount = (BigDecimal) r[1];
            long count = (Long) r[2];

            modeAmounts.put(mode, modeAmounts.getOrDefault(mode, BigDecimal.ZERO).add(amount));
            modeCounts.put(mode, modeCounts.getOrDefault(mode, 0L) + count);
            total = total.add(amount);
        }

        List<PaymentModeStat> list = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : modeAmounts.entrySet()) {
            String mode = entry.getKey();
            BigDecimal amount = entry.getValue();
            long count = modeCounts.getOrDefault(mode, 0L);

            double pct = (total.compareTo(BigDecimal.ZERO) > 0)
                    ? amount.divide(total, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;

            list.add(PaymentModeStat.builder()
                    .paymentMode(mode)
                    .totalAmount(amount.setScale(2, RoundingMode.HALF_UP))
                    .transactionCount(count)
                    .percentage(Math.round(pct * 10.0) / 10.0)
                    .build());
        }

        list.sort((a, b) -> b.getTotalAmount().compareTo(a.getTotalAmount()));
        return list;
    }

    @Transactional(readOnly = true)
    public List<SlowMovingStockStat> getSlowMovingStock(UserPrincipal principal, int limit) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        List<Inventory> inventories = inventoryRepository.searchInventories(
                shop.getId(), null, null, org.springframework.data.domain.Pageable.unpaged()).getContent();

        List<SlowMovingStockStat> list = new ArrayList<>();
        for (Inventory inv : inventories) {
            BigDecimal stock = (inv.getCurrentStock() != null) ? inv.getCurrentStock() : BigDecimal.ZERO;
            if (stock.compareTo(BigDecimal.ZERO) <= 0) continue;

            Product p = inv.getProduct();
            if (p == null) continue;

            BigDecimal cost = (p.getCostPrice() != null) ? p.getCostPrice() : BigDecimal.ZERO;
            BigDecimal tiedUp = stock.multiply(cost);

            list.add(SlowMovingStockStat.builder()
                    .productId(p.getId())
                    .productName(p.getName())
                    .sku(p.getSku())
                    .currentStock(stock)
                    .unitCost(cost)
                    .tiedUpCapital(tiedUp.setScale(2, RoundingMode.HALF_UP))
                    .categoryName(p.getCategory() != null ? p.getCategory().getName() : "General")
                    .build());
        }

        list.sort((a, b) -> b.getTiedUpCapital().compareTo(a.getTiedUpCapital()));
        return list.stream().limit(Math.max(1, limit)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaxGstSummaryResponse getTaxGstSummary(UserPrincipal principal, LocalDate startDate, LocalDate endDate) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        LocalDate start = (startDate != null) ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = (endDate != null) ? endDate : LocalDate.now();

        ZoneId zone = resolveZone(shop);
        Instant startInstant = start.atStartOfDay(zone).toInstant();
        Instant endInstant = end.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1);

        List<Invoice> invoices = invoiceRepository.findByShopIdAndCreatedAtBetween(shop.getId(), startInstant, endInstant);
        List<DiningBill> diningBills = (diningBillRepository != null && isDiningEnabled(shop))
                ? diningBillRepository.findByShopIdAndCreatedAtBetween(shop.getId(), startInstant, endInstant).stream()
                    .filter(b -> !"CANCELLED".equalsIgnoreCase(b.getPaymentStatus()) &&
                            (b.getPaidAmount().compareTo(BigDecimal.ZERO) > 0 || "PAID".equalsIgnoreCase(b.getPaymentStatus())))
                    .collect(Collectors.toList())
                : Collections.emptyList();

        BigDecimal taxableTurnover = BigDecimal.ZERO;
        BigDecimal cgstTotal = BigDecimal.ZERO;
        BigDecimal sgstTotal = BigDecimal.ZERO;
        BigDecimal igstTotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        for (Invoice inv : invoices) {
            taxableTurnover = taxableTurnover.add(inv.getSubtotal() != null ? inv.getSubtotal() : BigDecimal.ZERO);
            cgstTotal = cgstTotal.add(inv.getCgstTotal() != null ? inv.getCgstTotal() : BigDecimal.ZERO);
            sgstTotal = sgstTotal.add(inv.getSgstTotal() != null ? inv.getSgstTotal() : BigDecimal.ZERO);
            igstTotal = igstTotal.add(inv.getIgstTotal() != null ? inv.getIgstTotal() : BigDecimal.ZERO);
            totalTax = totalTax.add(inv.getTotalTax() != null ? inv.getTotalTax() : BigDecimal.ZERO);
        }

        for (DiningBill bill : diningBills) {
            taxableTurnover = taxableTurnover.add(bill.getSubtotal() != null ? bill.getSubtotal() : BigDecimal.ZERO);
            BigDecimal billTax = bill.getTaxTotal() != null ? bill.getTaxTotal() : BigDecimal.ZERO;
            totalTax = totalTax.add(billTax);
            BigDecimal halfGst = billTax.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            cgstTotal = cgstTotal.add(halfGst);
            sgstTotal = sgstTotal.add(halfGst);
        }

        return TaxGstSummaryResponse.builder()
                .totalTaxableTurnover(taxableTurnover.setScale(2, RoundingMode.HALF_UP))
                .cgstTotal(cgstTotal.setScale(2, RoundingMode.HALF_UP))
                .sgstTotal(sgstTotal.setScale(2, RoundingMode.HALF_UP))
                .igstTotal(igstTotal.setScale(2, RoundingMode.HALF_UP))
                .totalTaxCollected(totalTax.setScale(2, RoundingMode.HALF_UP))
                .totalTaxableInvoices(invoices.size() + diningBills.size())
                .build();
    }

    private ZoneId resolveZone(Shop shop) {
        if (shop != null && shop.getTimezone() != null && !shop.getTimezone().isBlank()) {
            try {
                return ZoneId.of(shop.getTimezone());
            } catch (Exception ignored) {}
        }
        return ZoneId.systemDefault();
    }
}
