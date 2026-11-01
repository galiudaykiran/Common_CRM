package com.commoncrm.platform.module.dining.service;

import com.commoncrm.platform.common.exception.BusinessException;
import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.dining.dto.DiningDtos.*;
import com.commoncrm.platform.module.dining.entity.*;
import com.commoncrm.platform.module.dining.repository.*;
import com.commoncrm.platform.module.shop.entity.Shop;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiningMenuService {

    private final MenuCategoryRepository categoryRepository;
    private final DishRepository dishRepository;
    private final DishAvailabilityRepository availabilityRepository;

    // --- CATEGORIES ---

    @Transactional(readOnly = true)
    public List<MenuCategoryResponse> getCategories(Shop shop) {
        List<MenuCategory> categories = categoryRepository.findByShopIdOrderByDisplayOrderAscNameAsc(shop.getId());
        return categories.stream().map(cat -> {
            long dishCount = dishRepository.findByShopIdAndCategoryId(shop.getId(), cat.getId()).size();
            return MenuCategoryResponse.builder()
                    .id(cat.getId())
                    .name(cat.getName())
                    .description(cat.getDescription())
                    .displayOrder(cat.getDisplayOrder())
                    .active(cat.isActive())
                    .dishCount(dishCount)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public MenuCategoryResponse createCategory(Shop shop, MenuCategoryRequest request) {
        MenuCategory category = MenuCategory.builder()
                .tenantId(shop.getTenant().getId())
                .shop(shop)
                .name(request.getName().trim())
                .description(request.getDescription())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();
        MenuCategory saved = categoryRepository.save(category);
        return MenuCategoryResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .description(saved.getDescription())
                .displayOrder(saved.getDisplayOrder())
                .active(saved.isActive())
                .dishCount(0)
                .build();
    }

    @Transactional
    public MenuCategoryResponse updateCategory(Shop shop, Long id, MenuCategoryRequest request) {
        MenuCategory category = categoryRepository.findByIdAndShopId(id, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Menu Category", "id", id));

        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        if (request.getDisplayOrder() != null) {
            category.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getActive() != null) {
            category.setActive(request.getActive());
        }
        MenuCategory saved = categoryRepository.save(category);
        long count = dishRepository.findByShopIdAndCategoryId(shop.getId(), saved.getId()).size();

        return MenuCategoryResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .description(saved.getDescription())
                .displayOrder(saved.getDisplayOrder())
                .active(saved.isActive())
                .dishCount(count)
                .build();
    }

    @Transactional
    public void deleteCategory(Shop shop, Long id) {
        MenuCategory category = categoryRepository.findByIdAndShopId(id, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Menu Category", "id", id));
        long dishCount = dishRepository.findByShopIdAndCategoryId(shop.getId(), id).size();
        if (dishCount > 0) {
            throw new BusinessException("Cannot delete category with associated dishes. Please reassign or delete dishes first.");
        }
        categoryRepository.delete(category);
    }

    // --- DISHES ---

    @Transactional(readOnly = true)
    public List<DishResponse> getDishes(Shop shop, Long categoryId, String dietaryType, String availabilityStatus, String search) {
        List<Dish> dishes;
        if (categoryId != null) {
            dishes = dishRepository.findByShopIdAndCategoryId(shop.getId(), categoryId);
        } else {
            dishes = dishRepository.findByShopIdOrderByCategoryAscDisplayOrderAscNameAsc(shop.getId());
        }

        return dishes.stream()
                .filter(d -> {
                    if (StringUtils.hasText(dietaryType) && !dietaryType.equalsIgnoreCase("ALL")) {
                        if (!d.getDietaryType().equalsIgnoreCase(dietaryType)) return false;
                    }
                    if (StringUtils.hasText(availabilityStatus) && !availabilityStatus.equalsIgnoreCase("ALL")) {
                        String status = d.getAvailability() != null ? d.getAvailability().getStatus() : "AVAILABLE";
                        if (!status.equalsIgnoreCase(availabilityStatus)) return false;
                    }
                    if (StringUtils.hasText(search)) {
                        String q = search.toLowerCase();
                        boolean matchName = d.getName() != null && d.getName().toLowerCase().contains(q);
                        boolean matchDesc = d.getDescription() != null && d.getDescription().toLowerCase().contains(q);
                        if (!matchName && !matchDesc) return false;
                    }
                    return true;
                })
                .map(this::mapDishToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DishResponse getDishById(Shop shop, Long id) {
        Dish dish = dishRepository.findByIdAndShopId(id, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dish", "id", id));
        return mapDishToResponse(dish);
    }

    @Transactional
    public DishResponse createDish(Shop shop, DishRequest request, UserPrincipal principal) {
        MenuCategory category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findByIdAndShopId(request.getCategoryId(), shop.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Menu Category", "id", request.getCategoryId()));
        }

        Dish dish = Dish.builder()
                .tenantId(shop.getTenant().getId())
                .shop(shop)
                .category(category)
                .name(request.getName().trim())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .dietaryType(request.getDietaryType() != null ? request.getDietaryType().toUpperCase() : "VEG")
                .basePrice(request.getBasePrice() != null ? request.getBasePrice() : BigDecimal.ZERO)
                .preparationTimeMinutes(request.getPreparationTimeMinutes() != null ? request.getPreparationTimeMinutes() : 15)
                .taxRate(request.getTaxRate() != null ? request.getTaxRate() : BigDecimal.ZERO)
                .isFeatured(Boolean.TRUE.equals(request.getIsFeatured()))
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        // Variants
        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            List<DishVariant> variants = new ArrayList<>();
            for (DishVariantDto v : request.getVariants()) {
                variants.add(DishVariant.builder()
                        .dish(dish)
                        .name(v.getName().trim())
                        .price(v.getPrice() != null ? v.getPrice() : BigDecimal.ZERO)
                        .active(v.getActive() != null ? v.getActive() : true)
                        .build());
            }
            dish.setVariants(variants);
        }

        // Addons
        if (request.getAddons() != null && !request.getAddons().isEmpty()) {
            List<DishAddon> addons = new ArrayList<>();
            for (DishAddonDto a : request.getAddons()) {
                addons.add(DishAddon.builder()
                        .dish(dish)
                        .name(a.getName().trim())
                        .price(a.getPrice() != null ? a.getPrice() : BigDecimal.ZERO)
                        .active(a.getActive() != null ? a.getActive() : true)
                        .build());
            }
            dish.setAddons(addons);
        }

        Dish savedDish = dishRepository.save(dish);

        // Availability tracking
        String initialStatus = StringUtils.hasText(request.getAvailabilityStatus())
                ? request.getAvailabilityStatus().toUpperCase() : "AVAILABLE";
        DishAvailability availability = DishAvailability.builder()
                .dish(savedDish)
                .status(initialStatus)
                .reason("Initial creation")
                .updatedByUserId(principal != null ? principal.getId() : null)
                .updatedByUsername(principal != null ? principal.getUsername() : "system")
                .statusUpdatedAt(Instant.now())
                .build();
        availabilityRepository.save(availability);
        savedDish.setAvailability(availability);

        return mapDishToResponse(savedDish);
    }

    @Transactional
    public DishResponse updateDish(Shop shop, Long id, DishRequest request, UserPrincipal principal) {
        Dish dish = dishRepository.findByIdAndShopId(id, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dish", "id", id));

        if (request.getCategoryId() != null) {
            MenuCategory category = categoryRepository.findByIdAndShopId(request.getCategoryId(), shop.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Menu Category", "id", request.getCategoryId()));
            dish.setCategory(category);
        } else {
            dish.setCategory(null);
        }

        dish.setName(request.getName().trim());
        dish.setDescription(request.getDescription());
        dish.setImageUrl(request.getImageUrl());
        if (request.getDietaryType() != null) {
            dish.setDietaryType(request.getDietaryType().toUpperCase());
        }
        if (request.getBasePrice() != null) {
            dish.setBasePrice(request.getBasePrice());
        }
        if (request.getPreparationTimeMinutes() != null) {
            dish.setPreparationTimeMinutes(request.getPreparationTimeMinutes());
        }
        if (request.getTaxRate() != null) {
            dish.setTaxRate(request.getTaxRate());
        }
        if (request.getIsFeatured() != null) {
            dish.setFeatured(request.getIsFeatured());
        }
        if (request.getDisplayOrder() != null) {
            dish.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getActive() != null) {
            dish.setActive(request.getActive());
        }

        // Sync Variants
        dish.getVariants().clear();
        if (request.getVariants() != null) {
            for (DishVariantDto v : request.getVariants()) {
                dish.getVariants().add(DishVariant.builder()
                        .dish(dish)
                        .name(v.getName().trim())
                        .price(v.getPrice() != null ? v.getPrice() : BigDecimal.ZERO)
                        .active(v.getActive() != null ? v.getActive() : true)
                        .build());
            }
        }

        // Sync Addons
        dish.getAddons().clear();
        if (request.getAddons() != null) {
            for (DishAddonDto a : request.getAddons()) {
                dish.getAddons().add(DishAddon.builder()
                        .dish(dish)
                        .name(a.getName().trim())
                        .price(a.getPrice() != null ? a.getPrice() : BigDecimal.ZERO)
                        .active(a.getActive() != null ? a.getActive() : true)
                        .build());
            }
        }

        if (StringUtils.hasText(request.getAvailabilityStatus())) {
            updateSingleDishAvailability(dish, request.getAvailabilityStatus().toUpperCase(), "Dish update", principal);
        }

        Dish saved = dishRepository.save(dish);
        return mapDishToResponse(saved);
    }

    @Transactional
    public void deleteDish(Shop shop, Long id) {
        Dish dish = dishRepository.findByIdAndShopId(id, shop.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dish", "id", id));
        dishRepository.delete(dish);
    }

    // --- INSTANT DISH AVAILABILITY (SINGLE & BULK) ---

    @Transactional
    public List<DishResponse> updateDishAvailability(Shop shop, UpdateDishAvailabilityRequest request, UserPrincipal principal) {
        String newStatus = request.getStatus().trim().toUpperCase();
        List<Dish> targets = new ArrayList<>();

        if (request.getDishIds() != null && !request.getDishIds().isEmpty()) {
            for (Long dishId : request.getDishIds()) {
                dishRepository.findByIdAndShopId(dishId, shop.getId()).ifPresent(targets::add);
            }
        } else if (request.getDishId() != null) {
            Dish dish = dishRepository.findByIdAndShopId(request.getDishId(), shop.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Dish", "id", request.getDishId()));
            targets.add(dish);
        } else {
            throw new BusinessException("Must provide dishId or dishIds for availability update");
        }

        for (Dish dish : targets) {
            updateSingleDishAvailability(dish, newStatus, request.getReason(), principal);
            dishRepository.save(dish);
        }

        return targets.stream().map(this::mapDishToResponse).collect(Collectors.toList());
    }

    private void updateSingleDishAvailability(Dish dish, String status, String reason, UserPrincipal principal) {
        DishAvailability availability = dish.getAvailability();
        if (availability == null) {
            availability = DishAvailability.builder()
                    .dish(dish)
                    .build();
            dish.setAvailability(availability);
        }
        availability.setStatus(status);
        availability.setReason(reason != null ? reason : "Status changed to " + status);
        availability.setUpdatedByUserId(principal != null ? principal.getId() : null);
        availability.setUpdatedByUsername(principal != null ? principal.getUsername() : "system");
        availability.setStatusUpdatedAt(Instant.now());
        availabilityRepository.save(availability);
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
                ? dish.getVariants().stream().map(v -> DishVariantDto.builder()
                .id(v.getId())
                .name(v.getName())
                .price(v.getPrice())
                .active(v.isActive())
                .build()).collect(Collectors.toList())
                : new ArrayList<>();

        List<DishAddonDto> addonDtos = (dish.getAddons() != null)
                ? dish.getAddons().stream().map(a -> DishAddonDto.builder()
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
