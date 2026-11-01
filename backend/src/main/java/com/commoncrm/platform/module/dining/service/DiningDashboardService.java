package com.commoncrm.platform.module.dining.service;

import com.commoncrm.platform.module.dining.dto.DiningDtos.DiningDashboardResponse;
import com.commoncrm.platform.module.dining.entity.DiningTable;
import com.commoncrm.platform.module.dining.repository.*;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.repository.ShopModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiningDashboardService {

    private final DiningTableRepository tableRepository;
    private final DiningSessionRepository sessionRepository;
    private final DiningOrderRepository orderRepository;
    private final DiningOrderItemRepository itemRepository;
    private final DiningBillRepository billRepository;
    private final ShopModuleRepository shopModuleRepository;

    @Transactional(readOnly = true)
    public DiningDashboardResponse getDashboardStats(Shop shop) {
        List<DiningTable> tables = tableRepository.findByShopId(shop.getId());
        long totalTables = tables.size();

        boolean isDiningEnabled = shopModuleRepository != null && shopModuleRepository.findAllWithModuleByShopId(shop.getId()).stream()
                .anyMatch(sm -> "DINING".equalsIgnoreCase(sm.getModule().getCode())
                        && sm.isEnabled()
                        && sm.getModule() != null
                        && sm.getModule().isActive());

        if (!isDiningEnabled) {
            return DiningDashboardResponse.builder()
                    .moduleEnabled(false)
                    .totalTables(totalTables)
                    .availableTables(0)
                    .occupiedTables(0)
                    .reservedTables(0)
                    .billRequestedTables(0)
                    .cleaningTables(0)
                    .activeSessions(0)
                    .activeOrders(0)
                    .preparingItems(0)
                    .readyItems(0)
                    .servedItems(0)
                    .todayOrderCount(0)
                    .todayDiningRevenue(BigDecimal.ZERO)
                    .build();
        }

        long availableTables = tables.stream().filter(t -> "AVAILABLE".equalsIgnoreCase(t.getStatus())).count();
        long occupiedTables = tables.stream().filter(t -> "OCCUPIED".equalsIgnoreCase(t.getStatus())).count();
        long reservedTables = tables.stream().filter(t -> "RESERVED".equalsIgnoreCase(t.getStatus())).count();
        long billRequestedTables = tables.stream().filter(t -> "BILL_REQUESTED".equalsIgnoreCase(t.getStatus())).count();
        long cleaningTables = tables.stream().filter(t -> "CLEANING".equalsIgnoreCase(t.getStatus())).count();

        long activeSessions = sessionRepository.findByShopIdAndStatus(shop.getId(), "ACTIVE").size();

        long activeOrders = orderRepository.findByShopIdAndStatusNotInOrderByPlacedAtDesc(
                shop.getId(), List.of("COMPLETED", "CANCELLED")).size();

        long preparingItems = itemRepository.countByShopIdAndStatus(shop.getId(), "PREPARING");
        long readyItems = itemRepository.countByShopIdAndStatus(shop.getId(), "READY");
        long servedItems = itemRepository.countByShopIdAndStatus(shop.getId(), "SERVED");

        // Today's range in shop's timezone
        ZoneId zone = ZoneId.of(shop.getTimezone() != null ? shop.getTimezone() : "Asia/Kolkata");
        var startOfDay = LocalDate.now(zone).atStartOfDay(zone).toInstant();

        long todayOrderCount = orderRepository.countByShopIdAndPlacedAtGreaterThanEqual(shop.getId(), startOfDay);
        BigDecimal todayRevenue = billRepository.sumGrandTotalByShopIdAndPaymentStatusAndCreatedAtGreaterThanEqual(
                shop.getId(), "PAID", startOfDay);

        if (todayRevenue == null) {
            todayRevenue = BigDecimal.ZERO;
        }

        return DiningDashboardResponse.builder()
                .moduleEnabled(true)
                .totalTables(totalTables)
                .availableTables(availableTables)
                .occupiedTables(occupiedTables)
                .reservedTables(reservedTables)
                .billRequestedTables(billRequestedTables)
                .cleaningTables(cleaningTables)
                .activeSessions(activeSessions)
                .activeOrders(activeOrders)
                .preparingItems(preparingItems)
                .readyItems(readyItems)
                .servedItems(servedItems)
                .todayOrderCount(todayOrderCount)
                .todayDiningRevenue(todayRevenue)
                .build();
    }
}
