package com.commoncrm.platform.common.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;
    // 256-bit base64 test key
    private static final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider(TEST_SECRET, 3600000L, 604800000L, "test-issuer");
    }

    @Test
    @DisplayName("Should generate valid JWT access token and correctly parse claims")
    void shouldGenerateAndValidateAccessToken() {
        UserPrincipal principal = UserPrincipal.builder()
                .id(100L)
                .tenantId(200L)
                .username("testadmin")
                .email("testadmin@platform.com")
                .fullName("Test Administrator")
                .active(true)
                .locked(false)
                .authorities(List.of(
                        new SimpleGrantedAuthority("ROLE_PLATFORM_ADMIN"),
                        new SimpleGrantedAuthority("PERM_SHOP_CREATE")
                ))
                .build();

        String token = tokenProvider.generateAccessToken(principal);
        assertNotNull(token);
        assertTrue(tokenProvider.validateToken(token));

        assertEquals("testadmin", tokenProvider.getUsernameFromToken(token));
        assertEquals(100L, tokenProvider.getUserIdFromToken(token));
        assertEquals(200L, tokenProvider.getTenantIdFromToken(token));
    }

    @Test
    @DisplayName("Should reject invalid or tampered JWT token")
    void shouldRejectInvalidToken() {
        String invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.signature";
        assertFalse(tokenProvider.validateToken(invalidToken));
    }
}
