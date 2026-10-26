package com.commoncrm.platform.module.billing.service;

import com.commoncrm.platform.common.api.PageResponse;
import com.commoncrm.platform.common.exception.BusinessException;
import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.billing.dto.NotificationDto.*;
import com.commoncrm.platform.module.billing.entity.Customer;
import com.commoncrm.platform.module.billing.entity.CustomerNotificationSchedule;
import com.commoncrm.platform.module.billing.entity.NotificationDeliveryLog;
import com.commoncrm.platform.module.billing.repository.CustomerNotificationScheduleRepository;
import com.commoncrm.platform.module.billing.repository.CustomerRepository;
import com.commoncrm.platform.module.billing.repository.NotificationDeliveryLogRepository;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.service.ShopContextService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationScheduleService {

    private final CustomerNotificationScheduleRepository scheduleRepository;
    private final NotificationDeliveryLogRepository deliveryLogRepository;
    private final CustomerRepository customerRepository;
    private final ShopContextService shopContextService;

    public NotificationScheduleService(CustomerNotificationScheduleRepository scheduleRepository,
                                       NotificationDeliveryLogRepository deliveryLogRepository,
                                       CustomerRepository customerRepository,
                                       ShopContextService shopContextService) {
        this.scheduleRepository = scheduleRepository;
        this.deliveryLogRepository = deliveryLogRepository;
        this.customerRepository = customerRepository;
        this.shopContextService = shopContextService;
    }

    @Transactional
    public ScheduleResponse createSchedule(UserPrincipal principal, CreateScheduleRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);

        Customer customer = customerRepository.findByIdAndShopId(request.getCustomerId(), shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        int targetDay = request.getDayOfMonth();
        LocalDate now = LocalDate.now();
        LocalDate nextRun;

        // Calculate next run date based on target day of month
        int safeDayThisMonth = Math.min(targetDay, now.lengthOfMonth());
        LocalDate candidateThisMonth = now.withDayOfMonth(safeDayThisMonth);

        if (!candidateThisMonth.isBefore(now)) {
            nextRun = candidateThisMonth;
        } else {
            // Already passed this month -> schedule for next month
            LocalDate nextMonth = now.plusMonths(1);
            int safeDayNextMonth = Math.min(targetDay, nextMonth.lengthOfMonth());
            nextRun = nextMonth.withDayOfMonth(safeDayNextMonth);
        }

        CustomerNotificationSchedule schedule = CustomerNotificationSchedule.builder()
                .tenantId(shop.getTenant().getId())
                .shop(shop)
                .customer(customer)
                .title(request.getTitle().trim())
                .scheduleType(request.getScheduleType())
                .dayOfMonth(targetDay)
                .channel(request.getChannel().toUpperCase())
                .messageTemplate(request.getMessageTemplate().trim())
                .active(true)
                .createdByUserId(principal.getId())
                .createdByName(principal.getUsername())
                .nextRunDate(nextRun)
                .build();

        schedule = scheduleRepository.save(schedule);
        return toScheduleResponse(schedule);
    }

    @Transactional(readOnly = true)
    public PageResponse<ScheduleResponse> getSchedules(UserPrincipal principal, int page, int size) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.ASC, "nextRunDate"));

        Page<CustomerNotificationSchedule> schedulePage = scheduleRepository.findByShopIdOrderByNextRunDateAsc(shop.getId(), pageable);

        List<ScheduleResponse> content = schedulePage.getContent().stream()
                .map(this::toScheduleResponse)
                .collect(Collectors.toList());

        return PageResponse.<ScheduleResponse>builder()
                .content(content)
                .page(schedulePage.getNumber())
                .size(schedulePage.getSize())
                .totalElements(schedulePage.getTotalElements())
                .totalPages(schedulePage.getTotalPages())
                .first(schedulePage.isFirst())
                .last(schedulePage.isLast())
                .build();
    }

    @Transactional
    public ScheduleResponse toggleSchedule(UserPrincipal principal, Long id) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        CustomerNotificationSchedule schedule = scheduleRepository.findByIdAndShopId(id, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Schedule rule not found with id: " + id));

        schedule.setActive(!schedule.isActive());
        schedule = scheduleRepository.save(schedule);
        return toScheduleResponse(schedule);
    }

    @Transactional
    public void deleteSchedule(UserPrincipal principal, Long id) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        CustomerNotificationSchedule schedule = scheduleRepository.findByIdAndShopId(id, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Schedule rule not found with id: " + id));
        scheduleRepository.delete(schedule);
    }

    @Transactional(readOnly = true)
    public PageResponse<DeliveryLogResponse> getDeliveryLogs(UserPrincipal principal, int page, int size) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));

        Page<NotificationDeliveryLog> logPage = deliveryLogRepository.findByShopIdOrderByCreatedAtDesc(shop.getId(), pageable);

        List<DeliveryLogResponse> content = logPage.getContent().stream().map(l -> DeliveryLogResponse.builder()
                .id(l.getId())
                .customerId(l.getCustomer() != null ? l.getCustomer().getId() : null)
                .customerName(l.getCustomer() != null ? l.getCustomer().getName() : "Direct Recipient")
                .notificationType(l.getNotificationType())
                .referenceInvoiceNumber(l.getReferenceInvoiceNumber())
                .recipientPhone(l.getRecipientPhone())
                .recipientEmail(l.getRecipientEmail())
                .channel(l.getChannel())
                .messageContent(l.getMessageContent())
                .deliveryStatus(l.getDeliveryStatus())
                .failureReason(l.getFailureReason())
                .createdAt(l.getCreatedAt())
                .build()
        ).collect(Collectors.toList());

        return PageResponse.<DeliveryLogResponse>builder()
                .content(content)
                .page(logPage.getNumber())
                .size(logPage.getSize())
                .totalElements(logPage.getTotalElements())
                .totalPages(logPage.getTotalPages())
                .first(logPage.isFirst())
                .last(logPage.isLast())
                .build();
    }

    /**
     * Automated recurring dispatch worker running daily at 09:00 AM.
     * Evaluates all active monthly reminder schedules due today.
     */
    @Scheduled(cron = "0 0 9 * * ?")
    @Transactional
    public void runDailyScheduledDispatches() {
        LocalDate today = LocalDate.now();
        List<CustomerNotificationSchedule> due = scheduleRepository.findDueSchedules(today);

        for (CustomerNotificationSchedule s : due) {
            try {
                // Parse template variables
                String message = s.getMessageTemplate()
                        .replace("{customer_name}", s.getCustomer().getName())
                        .replace("{shop_name}", s.getShop().getName())
                        .replace("{phone}", s.getCustomer().getPhone());

                NotificationDeliveryLog log = NotificationDeliveryLog.builder()
                        .tenantId(s.getTenantId())
                        .shop(s.getShop())
                        .customer(s.getCustomer())
                        .notificationType("MONTHLY_REMINDER")
                        .recipientPhone(s.getCustomer().getPhone())
                        .recipientEmail(s.getCustomer().getEmail())
                        .channel(s.getChannel())
                        .messageContent(message)
                        .deliveryStatus("SENT")
                        .build();

                deliveryLogRepository.save(log);

                // Advance schedule to next month on the designated day
                s.setLastSentAt(Instant.now());
                LocalDate nextMonth = today.plusMonths(1);
                int safeDay = Math.min(s.getDayOfMonth(), nextMonth.lengthOfMonth());
                s.setNextRunDate(nextMonth.withDayOfMonth(safeDay));
                scheduleRepository.save(s);
            } catch (Exception ex) {
                System.err.println("Failed to dispatch scheduled reminder for schedule id: " + s.getId() + " - " + ex.getMessage());
            }
        }
    }

    /**
     * Manual trigger to test/force dispatch immediately.
     */
    @Transactional
    public int triggerDueSchedulesNow(UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        LocalDate today = LocalDate.now();
        List<CustomerNotificationSchedule> due = scheduleRepository.findDueSchedules(today).stream()
                .filter(s -> s.getShop().getId().equals(shop.getId()))
                .collect(Collectors.toList());

        int count = 0;
        for (CustomerNotificationSchedule s : due) {
            String message = s.getMessageTemplate()
                    .replace("{customer_name}", s.getCustomer().getName())
                    .replace("{shop_name}", s.getShop().getName())
                    .replace("{phone}", s.getCustomer().getPhone());

            NotificationDeliveryLog log = NotificationDeliveryLog.builder()
                    .tenantId(s.getTenantId())
                    .shop(s.getShop())
                    .customer(s.getCustomer())
                    .notificationType("MONTHLY_REMINDER")
                    .recipientPhone(s.getCustomer().getPhone())
                    .recipientEmail(s.getCustomer().getEmail())
                    .channel(s.getChannel())
                    .messageContent(message)
                    .deliveryStatus("SENT")
                    .build();

            deliveryLogRepository.save(log);
            s.setLastSentAt(Instant.now());
            LocalDate nextMonth = today.plusMonths(1);
            int safeDay = Math.min(s.getDayOfMonth(), nextMonth.lengthOfMonth());
            s.setNextRunDate(nextMonth.withDayOfMonth(safeDay));
            scheduleRepository.save(s);
            count++;
        }
        return count;
    }

    public ScheduleResponse toScheduleResponse(CustomerNotificationSchedule s) {
        return ScheduleResponse.builder()
                .id(s.getId())
                .customerId(s.getCustomer().getId())
                .customerName(s.getCustomer().getName())
                .customerPhone(s.getCustomer().getPhone())
                .title(s.getTitle())
                .scheduleType(s.getScheduleType())
                .dayOfMonth(s.getDayOfMonth())
                .channel(s.getChannel())
                .messageTemplate(s.getMessageTemplate())
                .active(s.isActive())
                .createdByName(s.getCreatedByName())
                .lastSentAt(s.getLastSentAt())
                .nextRunDate(s.getNextRunDate())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
