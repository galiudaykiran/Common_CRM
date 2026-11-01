package com.commoncrm.platform.module.dining.service;

import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.module.dining.dto.DiningDtos.*;
import com.commoncrm.platform.module.dining.entity.*;
import com.commoncrm.platform.module.dining.repository.*;
import com.commoncrm.platform.module.shop.entity.Shop;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PublicDiningMenuService {

    private final DiningTableRepository tableRepository;
    private final MenuCategoryRepository categoryRepository;
    private final DishRepository dishRepository;

    @Transactional(readOnly = true)
    public PublicDiningMenuResponse getPublicMenuByToken(String qrToken) {
        DiningTable table = tableRepository.findByQrCodeToken(qrToken)
                .orElseThrow(() -> new ResourceNotFoundException("Dining Table with QR Token", "token", qrToken));

        Shop shop = table.getShop();

        List<MenuCategory> categories = categoryRepository.findByShopIdOrderByDisplayOrderAscNameAsc(shop.getId());
        List<Dish> dishes = dishRepository.findByShopIdOrderByCategoryAscDisplayOrderAscNameAsc(shop.getId());

        List<MenuCategoryResponse> categoryDtos = categories.stream()
                .filter(MenuCategory::isActive)
                .map(c -> MenuCategoryResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .description(c.getDescription())
                        .displayOrder(c.getDisplayOrder())
                        .active(c.isActive())
                        .build())
                .collect(Collectors.toList());

        List<DishResponse> dishDtos = dishes.stream()
                .filter(Dish::isActive)
                .map(this::mapDishToResponse)
                .collect(Collectors.toList());

        return PublicDiningMenuResponse.builder()
                .shopName(shop.getName())
                .shopCode(shop.getCode())
                .currency(shop.getCurrency())
                .tableNumber(table.getTableNumber())
                .areaName(table.getArea() != null ? table.getArea().getName() : "Main Dining")
                .categories(categoryDtos)
                .dishes(dishDtos)
                .build();
    }

    private DishResponse mapDishToResponse(Dish dish) {
        String availStatus = "AVAILABLE";
        String availReason = null;
        Instant availUpdated = dish.getUpdatedAt();

        if (dish.getAvailability() != null) {
            availStatus = dish.getAvailability().getStatus();
            availReason = dish.getAvailability().getReason();
            availUpdated = dish.getAvailability().getStatusUpdatedAt();
        }

        List<DishVariantDto> variantDtos = (dish.getVariants() != null)
                ? dish.getVariants().stream()
                .filter(DishVariant::isActive)
                .map(v -> DishVariantDto.builder()
                        .id(v.getId())
                        .name(v.getName())
                        .price(v.getPrice())
                        .active(v.isActive())
                        .build()).collect(Collectors.toList())
                : new ArrayList<>();

        List<DishAddonDto> addonDtos = (dish.getAddons() != null)
                ? dish.getAddons().stream()
                .filter(DishAddon::isActive)
                .map(a -> DishAddonDto.builder()
                        .id(a.getId())
                        .name(a.getName())
                        .price(a.getPrice())
                        .active(a.isActive())
                        .build()).collect(Collectors.toList())
                : new ArrayList<>();

        return DishResponse.builder()
                .id(dish.getId())
                .categoryId(dish.getCategory() != null ? dish.getCategory().getId() : null)
                .categoryName(dish.getCategory() != null ? dish.getCategory().getName() : "Uncategorized")
                .name(dish.getName())
                .description(dish.getDescription())
                .imageUrl(dish.getImageUrl())
                .dietaryType(dish.getDietaryType())
                .basePrice(dish.getBasePrice())
                .preparationTimeMinutes(dish.getPreparationTimeMinutes())
                .taxRate(dish.getTaxRate())
                .isFeatured(dish.isFeatured())
                .displayOrder(dish.getDisplayOrder())
                .active(dish.isActive())
                .availabilityStatus(availStatus)
                .availabilityReason(availReason)
                .availabilityUpdatedAt(availUpdated)
                .variants(variantDtos)
                .addons(addonDtos)
                .build();
    }
}
