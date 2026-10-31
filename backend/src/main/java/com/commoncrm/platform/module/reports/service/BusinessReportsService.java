package com.commoncrm.platform.module.reports.service;

import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.billing.entity.Invoice;
import com.commoncrm.platform.module.billing.entity.InvoiceItem;
import com.commoncrm.platform.module.billing.repository.InvoiceRepository;
import com.commoncrm.platform.module.inventory.entity.Inventory;
import com.commoncrm.platform.module.inventory.entity.Product;
import com.commoncrm.platform.module.inventory.repository.InventoryRepository;
import com.commoncrm.platform.module.inventory.repository.InventoryTransactionRepository;
import com.commoncrm.platform.module.reports.dto.BusinessReportsDto.*;
import com.commoncrm.platform.module.reports.repository.ShopExpenseRepository;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.service.ShopContextService;
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

    public BusinessReportsService(InvoiceRepository invoiceRepository,
                                  ShopExpenseRepository expenseRepository,
                                  InventoryTransactionRepository inventoryTransactionRepository,
                                  InventoryRepository inventoryRepository,
                                  ShopContextService shopContextService) {
        this.invoiceRepository = invoiceRepository;
        this.expenseRepository = expenseRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.inventoryRepository = inventoryRepository;
        this.shopContextService = shopContextService;
    }

    @Transactional(readOnly = true)
    public FinancialSummaryResponse getFinancialSummary(UserPrincipal principal, LocalDate startDate, LocalDate endDate) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        LocalDate start = (startDate != null) ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = (endDate != null) ? endDate : LocalDate.now();

        ZoneId zone = ZoneId.systemDefault();
        Instant startInstant = start.atStartOfDay(zone).toInstant();
        Instant endInstant = end.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1);

        List<Invoice> invoices = invoiceRepository.findByShopIdAndCreatedAtBetween(shop.getId(), startInstant, endInstant);

        BigDecimal grossRevenue = BigDecimal.ZERO;
        BigDecimal totalDiscounts = BigDecimal.ZERO;
        BigDecimal cogs = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal grandTotal = BigDecimal.ZERO;

        for (Invoice inv : invoices) {
            grossRevenue = grossRevenue.add(inv.getSubtotal() != null ? inv.getSubtotal() : BigDecimal.ZERO);
            BigDecimal disc = (inv.getItemDiscountTotal() != null ? inv.getItemDiscountTotal() : BigDecimal.ZERO)
                    .add(inv.getInvoiceDiscountTotal() != null ? inv.getInvoiceDiscountTotal() : BigDecimal.ZERO);
            totalDiscounts = totalDiscounts.add(disc);
            totalTax = totalTax.add(inv.getTotalTax() != null ? inv.getTotalTax() : BigDecimal.ZERO);
            grandTotal = grandTotal.add(inv.getGrandTotal() != null ? inv.getGrandTotal() : BigDecimal.ZERO);

            if (inv.getItems() != null) {
                for (InvoiceItem item : inv.getItems()) {
                    BigDecimal unitCost = item.getUnitCost() != null ? item.getUnitCost() : BigDecimal.ZERO;
                    BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                    cogs = cogs.add(unitCost.multiply(qty));
                }
            }
        }

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

        BigDecimal averageBillValue = !invoices.isEmpty()
                ? grandTotal.divide(BigDecimal.valueOf(invoices.size()), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return FinancialSummaryResponse.builder()
                .startDate(start)
                .endDate(end)
                .periodLabel(start.equals(end) ? start.toString() : start + " to " + end)
                .totalInvoicesCount(invoices.size())
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
                .build();
    }

    @Transactional(readOnly = true)
    public List<DailyTrendPoint> getDailyTrends(UserPrincipal principal, LocalDate startDate, LocalDate endDate) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        LocalDate start = (startDate != null) ? startDate : LocalDate.now().minusDays(14);
        LocalDate end = (endDate != null) ? endDate : LocalDate.now();

        ZoneId zone = ZoneId.systemDefault();
        Instant startInstant = start.atStartOfDay(zone).toInstant();
        Instant endInstant = end.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1);

        List<Invoice> invoices = invoiceRepository.findByShopIdAndCreatedAtBetween(shop.getId(), startInstant, endInstant);

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

            DateTimeFormatter ymFormatter = DateTimeFormatter.ofPattern("MMM yyyy");
            List<DailyTrendPoint> monthlyPoints = new ArrayList<>();
            YearMonth startYm = YearMonth.from(start);
            YearMonth endYm = YearMonth.from(end);

            for (YearMonth ym = startYm; !ym.isAfter(endYm); ym = ym.plusMonths(1)) {
                List<Invoice> monthInvoices = invoicesByMonth.getOrDefault(ym, Collections.emptyList());
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
                        .billCount(monthInvoices.size())
                        .build());
            }
            return monthlyPoints;
        }

        // CASE 3: Days interval (7 Days, This Month, Last Month) -> Group by individual day
        Map<LocalDate, List<Invoice>> invoicesByDate = invoices.stream()
                .collect(Collectors.groupingBy(inv -> inv.getCreatedAt().atZone(zone).toLocalDate()));

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        List<DailyTrendPoint> points = new ArrayList<>();

        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            List<Invoice> dayInvoices = invoicesByDate.getOrDefault(d, Collections.emptyList());

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
                    .billCount(dayInvoices.size())
                    .build());
        }

        return points;
    }

    @Transactional(readOnly = true)
    public List<ProductProfitabilityStat> getProductProfitability(UserPrincipal principal, LocalDate startDate, LocalDate endDate, int limit) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        LocalDate start = (startDate != null) ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = (endDate != null) ? endDate : LocalDate.now();

        ZoneId zone = ZoneId.systemDefault();
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

        ZoneId zone = ZoneId.systemDefault();
        Instant startInstant = start.atStartOfDay(zone).toInstant();
        Instant endInstant = end.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1);

        List<Object[]> raw = invoiceRepository.sumRevenueByPaymentModeBetween(shop.getId(), startInstant, endInstant);

        BigDecimal total = BigDecimal.ZERO;
        for (Object[] r : raw) {
            total = total.add((BigDecimal) r[1]);
        }

        List<PaymentModeStat> list = new ArrayList<>();
        for (Object[] r : raw) {
            String mode = (String) r[0];
            BigDecimal amount = (BigDecimal) r[1];
            long count = (Long) r[2];

            double pct = (total.compareTo(BigDecimal.ZERO) > 0)
                    ? amount.divide(total, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;

            list.add(PaymentModeStat.builder()
                    .paymentMode(mode != null ? mode : "CASH")
                    .totalAmount(amount.setScale(2, RoundingMode.HALF_UP))
                    .transactionCount(count)
                    .percentage(Math.round(pct * 10.0) / 10.0)
                    .build());
        }

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

        ZoneId zone = ZoneId.systemDefault();
        Instant startInstant = start.atStartOfDay(zone).toInstant();
        Instant endInstant = end.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1);

        List<Invoice> invoices = invoiceRepository.findByShopIdAndCreatedAtBetween(shop.getId(), startInstant, endInstant);

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

        return TaxGstSummaryResponse.builder()
                .totalTaxableTurnover(taxableTurnover.setScale(2, RoundingMode.HALF_UP))
                .cgstTotal(cgstTotal.setScale(2, RoundingMode.HALF_UP))
                .sgstTotal(sgstTotal.setScale(2, RoundingMode.HALF_UP))
                .igstTotal(igstTotal.setScale(2, RoundingMode.HALF_UP))
                .totalTaxCollected(totalTax.setScale(2, RoundingMode.HALF_UP))
                .totalTaxableInvoices(invoices.size())
                .build();
    }
}
