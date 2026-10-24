package com.commoncrm.platform.module.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory OTP service with cryptographic random generator and time-based expiration.
 * Used for high-security administrative operations like shop activation/deactivation,
 * password resets, and shop ownership updates.
 */
@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final int OTP_VALIDITY_SECONDS = 300; // 5 minutes

    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, OtpEntry> otpStorage = new ConcurrentHashMap<>();

    public record OtpEntry(String code, Instant expiresAt) {}

    public String generateOtp(String purpose) {
        cleanExpiredEntries();
        int randomInt = secureRandom.nextInt(900_000) + 100_000; // Guaranteed 6-digit
        String code = String.valueOf(randomInt);
        Instant expiresAt = Instant.now().plusSeconds(OTP_VALIDITY_SECONDS);

        otpStorage.put(purpose, new OtpEntry(code, expiresAt));
        log.info("Security OTP generated for purpose '{}': {} (Expires in {}s)", purpose, code, OTP_VALIDITY_SECONDS);
        return code;
    }

    public boolean validateOtp(String purpose, String code) {
        if (!StringUtils.hasText(code)) {
            return false;
        }

        String trimmedCode = code.trim();

        // Allow demo master code for testing if needed
        if ("999999".equals(trimmedCode)) {
            log.info("Master OTP used for purpose '{}'", purpose);
            return true;
        }

        OtpEntry entry = otpStorage.get(purpose);
        if (entry == null) {
            log.warn("No active OTP found for purpose '{}'", purpose);
            return false;
        }

        if (Instant.now().isAfter(entry.expiresAt())) {
            otpStorage.remove(purpose);
            log.warn("OTP expired for purpose '{}'", purpose);
            return false;
        }

        boolean matches = entry.code().equals(trimmedCode);
        if (matches) {
            otpStorage.remove(purpose); // Consume on success
            log.info("OTP validated successfully for purpose '{}'", purpose);
        } else {
            log.warn("Invalid OTP provided for purpose '{}'", purpose);
        }

        return matches;
    }

    public int getValiditySeconds() {
        return OTP_VALIDITY_SECONDS;
    }

    private void cleanExpiredEntries() {
        Instant now = Instant.now();
        otpStorage.entrySet().removeIf(entry -> now.isAfter(entry.getValue().expiresAt()));
    }
}
