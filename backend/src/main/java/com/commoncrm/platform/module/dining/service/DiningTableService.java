package com.commoncrm.platform.module.dining.service;

import com.commoncrm.platform.common.exception.BusinessException;
import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.module.dining.dto.DiningDtos.*;
import com.commoncrm.platform.module.dining.entity.DiningArea;
import com.commoncrm.platform.module.dining.entity.DiningSession;
import com.commoncrm.platform.module.dining.entity.DiningTable;
import com.commoncrm.platform.module.dining.repository.DiningAreaRepository;
import com.commoncrm.platform.module.dining.repository.DiningSessionRepository;
import com.commoncrm.platform.module.dining.repository.DiningTableRepository;
import com.commoncrm.platform.module.shop.entity.Shop;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiningTableService {

    private final DiningAreaRepository areaRepository;
    private final DiningTableRepository tableRepository;
    private final DiningSessionRepository sessionRepository;

    // --- AREA MANAGEMENT ---

    @Transactional(readOnly = true)
    public List<DiningAreaResponse> getAreas(Shop shop) {
        List<DiningArea> areas = areaRepository.findByShopIdOrderByDisplayOrderAscNameAsc(shop.getId());
        return areas.stream().map(area -> {
            long tableCount = tableRepository.findByShopIdAndAreaId(shop.getId(), area.getId()).size();
            return DiningAreaResponse.builder()
                    .id(area.getId())
                    .name(area.getName())
                    .description(area.getDescription())
                    .displayOrder(area.getDisplayOrder())
                    .active(area.isActive())
                    .tableCount(tableCount)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public DiningAreaResponse createArea(Shop shop, DiningAreaRequest request) {
        DiningArea area = DiningArea.builder()
                .tenantId(shop.getTenant().getId())
                .shop(shop)
                .name(request.getName().trim())
                .description(request.getDescription())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();
        DiningArea saved = areaRepository.save(area);
        return DiningAreaResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .description(saved.getDescription())
                .displayOrder(saved.getDisplayOrder())
                .active(saved.isActive())
                .tableCount(0)
                .build();
    }

    @Transactional
    public DiningAreaResponse updateArea(Shop shop, Long areaId, DiningAreaRequest request) {
        DiningArea area = areaRepository.findByIdAndShopId(areaId, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dining Area", "id", areaId));

        area.setName(request.getName().trim());
        area.setDescription(request.getDescription());
        if (request.getDisplayOrder() != null) {
            area.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getActive() != null) {
            area.setActive(request.getActive());
        }
        DiningArea updated = areaRepository.save(area);
        long count = tableRepository.findByShopIdAndAreaId(shop.getId(), updated.getId()).size();

        return DiningAreaResponse.builder()
                .id(updated.getId())
                .name(updated.getName())
                .description(updated.getDescription())
                .displayOrder(updated.getDisplayOrder())
                .active(updated.isActive())
                .tableCount(count)
                .build();
    }

    @Transactional
    public void deleteArea(Shop shop, Long areaId) {
        DiningArea area = areaRepository.findByIdAndShopId(areaId, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dining Area", "id", areaId));
        long tableCount = tableRepository.findByShopIdAndAreaId(shop.getId(), areaId).size();
        if (tableCount > 0) {
            throw new BusinessException("Cannot delete area with active tables. Please reassign or delete the tables first.");
        }
        areaRepository.delete(area);
    }

    // --- TABLE MANAGEMENT ---

    @Transactional(readOnly = true)
    public List<DiningTableResponse> getTables(Shop shop, Long areaId) {
        List<DiningTable> tables = (areaId != null)
                ? tableRepository.findByShopIdAndAreaId(shop.getId(), areaId)
                : tableRepository.findByShopId(shop.getId());

        return tables.stream().map(this::mapTableToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DiningTableResponse getTableById(Shop shop, Long tableId) {
        DiningTable table = tableRepository.findByIdAndShopId(tableId, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dining Table", "id", tableId));
        return mapTableToResponse(table);
    }

    @Transactional
    public DiningTableResponse createTable(Shop shop, DiningTableRequest request) {
        if (tableRepository.existsByShopIdAndTableNumberIgnoreCase(shop.getId(), request.getTableNumber().trim())) {
            throw new BusinessException("Table number '" + request.getTableNumber() + "' already exists in this store");
        }

        DiningArea area = null;
        if (request.getAreaId() != null) {
            area = areaRepository.findByIdAndShopId(request.getAreaId(), shop.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Dining Area", "id", request.getAreaId()));
        }

        DiningTable table = DiningTable.builder()
                .tenantId(shop.getTenant().getId())
                .shop(shop)
                .area(area)
                .tableNumber(request.getTableNumber().trim())
                .seatingCapacity(request.getSeatingCapacity() != null ? request.getSeatingCapacity() : 4)
                .status("AVAILABLE")
                .qrCodeToken(UUID.randomUUID().toString().replace("-", ""))
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        DiningTable saved = tableRepository.save(table);
        return mapTableToResponse(saved);
    }

    @Transactional
    public DiningTableResponse updateTable(Shop shop, Long tableId, DiningTableRequest request) {
        DiningTable table = tableRepository.findByIdAndShopId(tableId, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dining Table", "id", tableId));

        if (!table.getTableNumber().equalsIgnoreCase(request.getTableNumber().trim())) {
            if (tableRepository.existsByShopIdAndTableNumberIgnoreCase(shop.getId(), request.getTableNumber().trim())) {
                throw new BusinessException("Table number '" + request.getTableNumber() + "' already exists in this store");
            }
            table.setTableNumber(request.getTableNumber().trim());
        }

        if (request.getAreaId() != null) {
            DiningArea area = areaRepository.findByIdAndShopId(request.getAreaId(), shop.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Dining Area", "id", request.getAreaId()));
            table.setArea(area);
        } else {
            table.setArea(null);
        }

        if (request.getSeatingCapacity() != null) {
            table.setSeatingCapacity(request.getSeatingCapacity());
        }
        if (request.getActive() != null) {
            table.setActive(request.getActive());
        }
        if (request.getStatus() != null) {
            table.setStatus(request.getStatus().toUpperCase());
        }

        DiningTable saved = tableRepository.save(table);
        return mapTableToResponse(saved);
    }

    @Transactional
    public DiningTableResponse updateTableStatus(Shop shop, Long tableId, String status) {
        DiningTable table = tableRepository.findByIdAndShopId(tableId, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dining Table", "id", tableId));

        String targetStatus = status.trim().toUpperCase();
        table.setStatus(targetStatus);
        DiningTable saved = tableRepository.save(table);
        return mapTableToResponse(saved);
    }

    @Transactional
    public DiningTableResponse regenerateQrToken(Shop shop, Long tableId) {
        DiningTable table = tableRepository.findByIdAndShopId(tableId, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dining Table", "id", tableId));

        table.setQrCodeToken(UUID.randomUUID().toString().replace("-", ""));
        DiningTable saved = tableRepository.save(table);
        return mapTableToResponse(saved);
    }

    @Transactional
    public void deleteTable(Shop shop, Long tableId) {
        DiningTable table = tableRepository.findByIdAndShopId(tableId, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dining Table", "id", tableId));

        if ("OCCUPIED".equalsIgnoreCase(table.getStatus())) {
            throw new BusinessException("Cannot delete table while it is currently OCCUPIED with an active dining session");
        }

        tableRepository.delete(table);
    }

    private DiningTableResponse mapTableToResponse(DiningTable table) {
        DiningTableResponse.DiningTableResponseBuilder builder = DiningTableResponse.builder()
                .id(table.getId())
                .areaId(table.getArea() != null ? table.getArea().getId() : null)
                .areaName(table.getArea() != null ? table.getArea().getName() : "Unassigned")
                .tableNumber(table.getTableNumber())
                .seatingCapacity(table.getSeatingCapacity())
                .status(table.getStatus())
                .qrCodeToken(table.getQrCodeToken())
                .qrMenuUrl("/dining/public/menu/" + table.getQrCodeToken())
                .active(table.isActive());

        // Check if there is an active session
        Optional<DiningSession> activeSession = sessionRepository.findFirstByTableIdAndStatusOrderByOpenedAtDesc(table.getId(), "ACTIVE");
        if (activeSession.isPresent()) {
            DiningSession session = activeSession.get();
            builder.currentSessionId(session.getId())
                    .currentSessionCode(session.getSessionCode())
                    .guestCount(session.getGuestCount())
                    .customerName(session.getCustomerName())
                    .sessionOpenedAt(session.getOpenedAt());
        }

        return builder.build();
    }
}
