package com.commoncrm.platform.module.inventory.service;

import com.commoncrm.platform.common.exception.BusinessException;
import com.commoncrm.platform.common.exception.ResourceNotFoundException;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.inventory.dto.CategoryResponse;
import com.commoncrm.platform.module.inventory.dto.CreateCategoryRequest;
import com.commoncrm.platform.module.inventory.entity.Category;
import com.commoncrm.platform.module.inventory.repository.CategoryRepository;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.service.ShopContextService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ShopContextService shopContextService;

    public CategoryService(CategoryRepository categoryRepository,
                           ShopContextService shopContextService) {
        this.categoryRepository = categoryRepository;
        this.shopContextService = shopContextService;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getActiveCategories(UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return categoryRepository.findActiveByShopId(shop.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories(UserPrincipal principal) {
        Shop shop = shopContextService.requireCurrentShop(principal);
        return categoryRepository.findAllByShopId(shop.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponse createCategory(UserPrincipal principal, CreateCategoryRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);

        String code = request.getCode();
        if (code == null || code.trim().isEmpty()) {
            code = generateCodeFromName(request.getName(), shop.getId());
        } else {
            code = code.trim().toUpperCase();
            if (categoryRepository.existsByShopIdAndCodeIgnoreCase(shop.getId(), code)) {
                throw new BusinessException("Category code '" + code + "' already exists in this store");
            }
        }

        Category parent = null;
        if (request.getParentId() != null) {
            parent = categoryRepository.findByShopIdAndId(shop.getId(), request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
        }

        Category category = Category.builder()
                .tenantId(shop.getTenant().getId())
                .shop(shop)
                .name(request.getName().trim())
                .code(code)
                .parent(parent)
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus().toUpperCase() : "ACTIVE")
                .build();

        category = categoryRepository.save(category);
        return toResponse(category);
    }

    @Transactional
    public CategoryResponse updateCategory(UserPrincipal principal, Long id, CreateCategoryRequest request) {
        Shop shop = shopContextService.requireCurrentShop(principal);

        Category category = categoryRepository.findByShopIdAndId(shop.getId(), id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        if (request.getCode() != null && !request.getCode().trim().isEmpty()) {
            String code = request.getCode().trim().toUpperCase();
            if (categoryRepository.existsByShopIdAndCodeIgnoreCaseAndIdNot(shop.getId(), code, id)) {
                throw new BusinessException("Category code '" + code + "' already exists in this store");
            }
            category.setCode(code);
        }

        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new BusinessException("Category cannot be its own parent");
            }
            Category parent = categoryRepository.findByShopIdAndId(shop.getId(), request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            category.setStatus(request.getStatus().toUpperCase());
        }

        category = categoryRepository.save(category);
        return toResponse(category);
    }

    private String generateCodeFromName(String name, Long shopId) {
        String base = name.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (base.length() > 6) {
            base = base.substring(0, 6);
        } else if (base.isEmpty()) {
            base = "CAT";
        }
        String candidate = base;
        int count = 1;
        while (categoryRepository.existsByShopIdAndCodeIgnoreCase(shopId, candidate)) {
            candidate = base + count;
            count++;
        }
        return candidate;
    }

    private CategoryResponse toResponse(Category c) {
        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .code(c.getCode())
                .parentId(c.getParent() != null ? c.getParent().getId() : null)
                .parentName(c.getParent() != null ? c.getParent().getName() : null)
                .description(c.getDescription())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
