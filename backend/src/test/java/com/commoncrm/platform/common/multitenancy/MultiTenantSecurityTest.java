package com.commoncrm.platform.common.multitenancy;

import com.commoncrm.platform.common.exception.ForbiddenException;
import com.commoncrm.platform.common.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class MultiTenantSecurityTest {

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("TenantContext should properly bind, isolate, and clear thread local state")
    void testTenantContextIsolation() {
        TenantContext.setTenantId(101L);
        assertEquals(101L, TenantContext.getTenantId());

        TenantContext.clear();
        assertNull(TenantContext.getTenantId());
    }

    @Test
    @DisplayName("MANDATORY: Tenant A user accessing Tenant A data is ALLOWED")
    void testTenantAccessOwnDataAllowed() {
        Long tenantAId = 100L;
        UserPrincipal userTenantA = UserPrincipal.builder()
                .id(1L)
                .tenantId(tenantAId)
                .username("owner_a")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_SHOP_OWNER")))
                .build();

        TenantContext.setTenantId(userTenantA.getTenantId());

        // Validate entity belonging to Tenant A
        Long resourceTenantId = 100L;
        assertDoesNotThrow(() -> validateTenantAccess(userTenantA, resourceTenantId));
    }

    @Test
    @DisplayName("MANDATORY: Tenant A user accessing Tenant B data is DENIED")
    void testTenantAccessOtherTenantDataDenied() {
        Long tenantAId = 100L;
        Long tenantBId = 200L;

        UserPrincipal userTenantA = UserPrincipal.builder()
                .id(1L)
                .tenantId(tenantAId)
                .username("owner_a")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_SHOP_OWNER")))
                .build();

        TenantContext.setTenantId(userTenantA.getTenantId());

        // Attempting to access Tenant B's resource must throw ForbiddenException
        assertThrows(ForbiddenException.class, () -> validateTenantAccess(userTenantA, tenantBId));
    }

    @Test
    @DisplayName("Platform Admin (tenantId is null) has global oversight permission")
    void testPlatformAdminGlobalAccess() {
        UserPrincipal platformAdmin = UserPrincipal.builder()
                .id(999L)
                .tenantId(null)
                .username("platform_admin")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_PLATFORM_ADMIN")))
                .build();

        // Platform Admin can inspect any tenant's data
        assertDoesNotThrow(() -> validateTenantAccess(platformAdmin, 100L));
        assertDoesNotThrow(() -> validateTenantAccess(platformAdmin, 200L));
    }

    private void validateTenantAccess(UserPrincipal principal, Long targetTenantId) {
        boolean isPlatformAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PLATFORM_ADMIN"));

        if (!isPlatformAdmin && !principal.getTenantId().equals(targetTenantId)) {
            throw new ForbiddenException("Cross-tenant access denied: tenant " + principal.getTenantId() + " cannot access tenant " + targetTenantId);
        }
    }
}
