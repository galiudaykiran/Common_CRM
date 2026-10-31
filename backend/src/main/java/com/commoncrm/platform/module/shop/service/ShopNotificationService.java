package com.commoncrm.platform.module.shop.service;

import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.billing.entity.CustomerNotificationSchedule;
import com.commoncrm.platform.module.billing.entity.Invoice;
import com.commoncrm.platform.module.billing.repository.CustomerNotificationScheduleRepository;
import com.commoncrm.platform.module.billing.repository.InvoiceRepository;
import com.commoncrm.platform.module.inventory.entity.Inventory;
import com.commoncrm.platform.module.inventory.repository.InventoryRepository;
import com.commoncrm.platform.module.shop.dto.AlertSettingsDto;
import com.commoncrm.platform.module.shop.dto.StoreAlertResponse;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.entity.ShopConfiguration;
import com.commoncrm.platform.module.shop.entity.ShopNotification;
import com.commoncrm.platform.module.shop.repository.ShopConfigurationRepository;
import com.commoncrm.platform.module.shop.repository.ShopNotificationRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ShopNotificationService {

    private static final Logger log = LoggerFactory.getLogger(ShopNotificationService.class);

    private final ShopNotificationRepository notificationRepository;
    private final ShopContextService shopContextService;
    private final ShopConfigurationRepository shopConfigurationRepository;
    private final InventoryRepository inventoryRepository;
    private final InvoiceRepository invoiceRepository;
    private final CustomerNotificationScheduleRepository scheduleRepository;
    private final ObjectMapper objectMapper;

    public ShopNotificationService(ShopNotificationRepository notificationRepository,
                                   ShopContextService shopContextService,
                                   ShopConfigurationRepository shopConfigurationRepository,
                                   InventoryRepository inventoryRepository,
                                   InvoiceRepository invoiceRepository,
                                   CustomerNotificationScheduleRepository scheduleRepository,
                                   ObjectMapper objectMapper) {
        this.notificationRepository = notificationRepository;
        this.shopContextService = shopContextService;
        this.shopConfigurationRepository = shopConfigurationRepository;
        this.inventoryRepository = inventoryRepository;
        this.invoiceRepository = invoiceRepository;
        this.scheduleRepository = scheduleRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public List<StoreAlertResponse> getActiveAlerts(UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        AlertSettingsDto settings = getAlertSettingsForShop(shop);

        // 1. Evaluate rules and register/update live notifications
        evaluateRules(shop, settings);

        // 2. Fetch all active, non-dismissed notifications
        List<ShopNotification> active = notificationRepository.findByShopIdAndDismissedFalseOrderByCreatedAtDesc(shop.getId());

        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("hh:mm a").withZone(ZoneId.systemDefault());

        return active.stream().map(n -> StoreAlertResponse.builder()
                .id(n.getAlertKey())
                .alertKey(n.getAlertKey())
                .type(n.getAlertType())
                .title(n.getTitle())
                .message(n.getMessage())
                .severity(n.getSeverity())
                .timestamp(n.getCreatedAt() != null ? timeFmt.format(n.getCreatedAt()) : "Active now")
                .read(n.isRead())
                .actionLabel(n.getActionLabel())
                .actionUrl(n.getActionUrl())
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional
    public void dismissAlert(UserPrincipal principal, String alertKey) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Optional<ShopNotification> existing = notificationRepository.findByShopIdAndAlertKey(shop.getId(), alertKey);

        if (existing.isPresent()) {
            ShopNotification notif = existing.get();
            notif.setDismissed(true);
            notif.setDismissedAt(Instant.now());
            notificationRepository.save(notif);
        } else {
            // Tombstone creation: prevent this alertKey from ever showing
            ShopNotification tombstone = ShopNotification.builder()
                    .tenantId(shop.getTenant().getId())
                    .shop(shop)
                    .alertKey(alertKey)
                    .alertType("DISMISSED_TOMBSTONE")
                    .title("Dismissed")
                    .message("Dismissed")
                    .severity("info")
                    .read(true)
                    .dismissed(true)
                    .dismissedAt(Instant.now())
                    .build();
            notificationRepository.save(tombstone);
        }
    }

    @Transactional
    public void dismissAll(UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        notificationRepository.dismissAllAlerts(shop.getId(), Instant.now());
    }

    @Transactional
    public void markAsRead(UserPrincipal principal, String alertKey) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        notificationRepository.markAsRead(shop.getId(), alertKey);
    }

    @Transactional
    public void markAllAsRead(UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        notificationRepository.markAllAsRead(shop.getId());
    }

    @Transactional(readOnly = true)
    public AlertSettingsDto getAlertSettings(UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return getAlertSettingsForShop(shop);
    }

    @Transactional
    public AlertSettingsDto updateAlertSettings(UserPrincipal principal, AlertSettingsDto request) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        ShopConfiguration config = shopConfigurationRepository.findByShopId(shop.getId())
                .orElseGet(() -> ShopConfiguration.builder()
                        .shop(shop)
                        .invoicePrefix("INV-")
                        .defaultTaxRate(BigDecimal.ZERO)
                        .build());

        try {
            String json = objectMapper.writeValueAsString(request);
            config.setSettingsJson(json);
            shopConfigurationRepository.save(config);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize alert settings for shop {}", shop.getId(), e);
        }

        return request;
    }

    private AlertSettingsDto getAlertSettingsForShop(Shop shop) {
        Optional<ShopConfiguration> configOpt = shopConfigurationRepository.findByShopId(shop.getId());
        if (configOpt.isPresent() && configOpt.get().getSettingsJson() != null && !configOpt.get().getSettingsJson().isBlank()) {
            try {
                return objectMapper.readValue(configOpt.get().getSettingsJson(), AlertSettingsDto.class);
            } catch (Exception e) {
                log.warn("Failed to parse alert settings JSON for shop {}, returning defaults", shop.getId());
            }
        }
        return new AlertSettingsDto();
    }

    private void evaluateRules(Shop shop, AlertSettingsDto settings) {
        LocalDate today = LocalDate.now();

        // 1. Low Stock Rule
        if (settings.isEnableLowStockAlerts()) {
            List<Inventory> lowStockList = inventoryRepository.findLowStockInventories(shop.getId());
            int threshold = settings.getLowStockThreshold();
            for (Inventory inv : lowStockList) {
                var p = inv.getProduct();
                BigDecimal currentStock = inv.getCurrentStock() != null ? inv.getCurrentStock() : BigDecimal.ZERO;
                int reorder = p.getReorderLevel() != null ? p.getReorderLevel() : threshold;
                BigDecimal maxThreshold = BigDecimal.valueOf(Math.max(reorder, threshold));
                if (currentStock.compareTo(maxThreshold) <= 0) {
                    upsertAlert(shop,
                            "low-stock-" + p.getId(),
                            "LOW_STOCK",
                            "Low Stock: " + p.getName(),
                            "Only " + currentStock.stripTrailingZeros().toPlainString() + " " + p.getUnitOfMeasure() + " remaining (threshold: " + threshold + ").",
                            currentStock.compareTo(BigDecimal.valueOf(2)) <= 0 ? "critical" : "warning",
                            "Restock Product",
                            "/shop/inventory?search=" + (p.getSku() != null ? p.getSku() : p.getName())
                    );
                }
            }
        }

        // 2. Daily Closing Reminder Rule (10 PM or 11 PM configured by shop holder)
        if (settings.isEnableDailyClosingReminder() && settings.getDailyClosingReminderTime() != null) {
            try {
                String[] parts = settings.getDailyClosingReminderTime().split(":");
                int targetHour = Integer.parseInt(parts[0]);
                int targetMin = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;

                LocalTime nowTime = LocalTime.now();
                if (nowTime.getHour() >= targetHour || (nowTime.getHour() == targetHour - 1 && nowTime.getMinute() >= 30)) {
                    int displayHour = targetHour % 12 == 0 ? 12 : targetHour % 12;
                    String amPm = targetHour >= 12 ? "PM" : "AM";
                    String targetFormatted = String.format("%d:%02d %s", displayHour, targetMin, amPm);

                    upsertAlert(shop,
                            "closing-reminder-" + today,
                            "DAILY_CLOSING_REMINDER",
                            "Store Closing Reminder (" + targetFormatted + ")",
                            "Scheduled end-of-day digest: Verify daily register cash, balance credit totals, and file pending expenses.",
                            "info",
                            "Check P&L Summary",
                            "/shop/reports"
                    );
                }
            } catch (Exception e) {
                log.warn("Invalid closing reminder time format: {}", settings.getDailyClosingReminderTime());
            }
        }

        // 3. Daily Sales Target Milestone Rule
        if (settings.getDailyRevenueTarget() != null && settings.getDailyRevenueTarget().compareTo(BigDecimal.ZERO) > 0) {
            ZoneId zone = ZoneId.systemDefault();
            Instant startInstant = today.atStartOfDay(zone).toInstant();
            Instant endInstant = today.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1);

            List<Invoice> todayInvoices = invoiceRepository.findByShopIdAndCreatedAtBetween(shop.getId(), startInstant, endInstant);
            BigDecimal todayRevenue = todayInvoices.stream()
                    .map(inv -> inv.getGrandTotal() != null ? inv.getGrandTotal() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (todayRevenue.compareTo(settings.getDailyRevenueTarget()) >= 0) {
                upsertAlert(shop,
                        "target-reached-" + today,
                        "REVENUE_TARGET",
                        "Daily Revenue Target Reached!",
                        String.format("Congratulations! Today's register revenue (₹%,.2f) reached your daily target of ₹%,.2f.",
                                todayRevenue, settings.getDailyRevenueTarget()),
                        "info",
                        "View Sales Desk",
                        "/shop/pos"
                );
            }
        }

        // 4. Customer Due Reminders Rule
        List<CustomerNotificationSchedule> dueSchedules = scheduleRepository.findDueSchedules(today);
        List<CustomerNotificationSchedule> shopDueSchedules = dueSchedules.stream()
                .filter(s -> s.getShop().getId().equals(shop.getId()))
                .collect(Collectors.toList());

        if (!shopDueSchedules.isEmpty()) {
            String names = shopDueSchedules.stream()
                    .map(s -> s.getCustomer() != null ? s.getCustomer().getName() : s.getTitle())
                    .limit(3)
                    .collect(Collectors.joining(", "));
            if (shopDueSchedules.size() > 3) {
                names += " and " + (shopDueSchedules.size() - 3) + " more";
            }

            upsertAlert(shop,
                    "due-reminders-" + today,
                    "DAILY_CLOSING_REMINDER",
                    shopDueSchedules.size() + " Customer Reminder" + (shopDueSchedules.size() > 1 ? "s" : "") + " Due Today",
                    "Recurring visit notifications are scheduled for " + names + " today.",
                    "info",
                    "Dispatch Reminders",
                    "/shop/reminders"
            );
        }
    }

    private void upsertAlert(Shop shop,
                             String alertKey,
                             String alertType,
                             String title,
                             String message,
                             String severity,
                             String actionLabel,
                             String actionUrl) {
        Optional<ShopNotification> existing = notificationRepository.findByShopIdAndAlertKey(shop.getId(), alertKey);

        if (existing.isPresent()) {
            ShopNotification notif = existing.get();
            // If already dismissed by user, NEVER resurrect it!
            if (notif.isDismissed()) {
                return;
            }
            // Update message and title if changed
            notif.setTitle(title);
            notif.setMessage(message);
            notif.setSeverity(severity);
            notificationRepository.save(notif);
        } else {
            ShopNotification notif = ShopNotification.builder()
                    .tenantId(shop.getTenant().getId())
                    .shop(shop)
                    .alertKey(alertKey)
                    .alertType(alertType)
                    .title(title)
                    .message(message)
                    .severity(severity)
                    .actionLabel(actionLabel)
                    .actionUrl(actionUrl)
                    .read(false)
                    .dismissed(false)
                    .build();
            notificationRepository.save(notif);
        }
    }
}
