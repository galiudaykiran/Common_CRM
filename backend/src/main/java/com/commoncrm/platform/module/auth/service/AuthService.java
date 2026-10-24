package com.commoncrm.platform.module.auth.service;

import com.commoncrm.platform.common.audit.service.AuditService;
import com.commoncrm.platform.common.exception.UnauthorizedException;
import com.commoncrm.platform.common.security.JwtTokenProvider;
import com.commoncrm.platform.common.security.UserPrincipal;
import com.commoncrm.platform.module.auth.dto.AuthResponse;
import com.commoncrm.platform.module.auth.dto.LoginRequest;
import com.commoncrm.platform.module.auth.dto.RefreshTokenRequest;
import com.commoncrm.platform.module.auth.dto.UserProfileDto;
import com.commoncrm.platform.module.employee.entity.Employee;
import com.commoncrm.platform.module.employee.repository.EmployeeRepository;
import com.commoncrm.platform.module.shop.entity.Shop;
import com.commoncrm.platform.module.shop.repository.ShopRepository;
import com.commoncrm.platform.module.user.entity.User;
import com.commoncrm.platform.module.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;
    private final long accessTokenExpirationMs;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtTokenProvider tokenProvider,
            UserRepository userRepository,
            ShopRepository shopRepository,
            EmployeeRepository employeeRepository,
            AuditService auditService,
            @Value("${jwt.access-token-expiration-ms:3600000}") long accessTokenExpirationMs) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.shopRepository = shopRepository;
        this.employeeRepository = employeeRepository;
        this.auditService = auditService;
        this.accessTokenExpirationMs = accessTokenExpirationMs;
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String effectiveUsername = request.getUsername().trim();
        Shop targetShop = null;

        // 1. If employee store code is provided (e.g., NAG_11)
        if (request.getShopCode() != null && !request.getShopCode().trim().isEmpty()) {
            String shopCode = request.getShopCode().trim().toUpperCase();
            targetShop = shopRepository.findByCode(shopCode)
                    .orElseThrow(() -> new UnauthorizedException("Store not found with shop code: '" + shopCode + "'. Please check your store ID."));

            if (!"ACTIVE".equalsIgnoreCase(targetShop.getStatus())) {
                throw new UnauthorizedException("Store '" + targetShop.getName() + "' is currently " + targetShop.getStatus() + ". Login not permitted.");
            }

            // Allow employee to log in with either employeeCode (e.g., EMP-001) or standard username
            Optional<Employee> empOpt = employeeRepository.findByEmployeeCodeIgnoreCaseAndShopId(effectiveUsername, targetShop.getId());
            if (empOpt.isPresent()) {
                effectiveUsername = empOpt.get().getUser().getUsername();
            }
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(effectiveUsername, request.getPassword())
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new UnauthorizedException("User account is " + user.getStatus());
        }

        // 2. Validate that user is authorized for the specified shop if shopCode was provided
        if (targetShop != null) {
            boolean isStaffOfShop = employeeRepository.findByUserIdAndShopId(user.getId(), targetShop.getId()).isPresent();
            boolean isShopOwner = targetShop.getTenant() != null && targetShop.getTenant().getId().equals(user.getTenantId())
                    && principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().contains("SHOP_OWNER"));

            if (!isStaffOfShop && !isShopOwner) {
                throw new UnauthorizedException("Access denied: User '" + request.getUsername() + "' is not registered as an authorized staff member for store '" + targetShop.getName() + "' (" + targetShop.getCode() + ")");
            }
        }

        // Reset failed login attempts on successful login
        if (user.getFailedLoginAttempts() > 0) {
            user.setFailedLoginAttempts(0);
            userRepository.save(user);
        }

        String accessToken = tokenProvider.generateAccessToken(principal);
        String refreshToken = tokenProvider.generateRefreshToken(principal);

        auditService.logAction(
                user.getId(),
                user.getUsername(),
                user.getTenantId(),
                "ADMIN_LOGIN",
                "AUTH",
                user.getId().toString(),
                null,
                "Successful login"
        );

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresInMs(accessTokenExpirationMs)
                .user(mapToProfileDto(principal))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.getRefreshToken();
        if (!tokenProvider.validateToken(token)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        String username = tokenProvider.getUsernameFromToken(token);
        User user = userRepository.findWithRolesAndPermissionsByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new UnauthorizedException("User account is inactive or suspended");
        }

        UserPrincipal principal = UserPrincipal.create(user);
        String newAccessToken = tokenProvider.generateAccessToken(principal);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(token)
                .expiresInMs(accessTokenExpirationMs)
                .user(mapToProfileDto(principal))
                .build();
    }

    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return mapToProfileDto(principal);
    }

    private UserProfileDto mapToProfileDto(UserPrincipal principal) {
        List<String> roles = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .collect(Collectors.toList());

        List<String> permissions = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("PERM_"))
                .map(a -> a.substring(5))
                .collect(Collectors.toList());

        return UserProfileDto.builder()
                .id(principal.getId())
                .tenantId(principal.getTenantId())
                .username(principal.getUsername())
                .email(principal.getEmail())
                .fullName(principal.getFullName())
                .status(principal.isEnabled() ? "ACTIVE" : "INACTIVE")
                .roles(roles)
                .permissions(permissions)
                .build();
    }
}
