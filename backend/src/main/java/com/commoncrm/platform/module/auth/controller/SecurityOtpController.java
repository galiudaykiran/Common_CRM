package com.commoncrm.platform.module.auth.controller;

import com.commoncrm.platform.common.api.ApiResponse;
import com.commoncrm.platform.common.audit.service.AuditService;
import com.commoncrm.platform.module.auth.dto.GenerateOtpRequest;
import com.commoncrm.platform.module.auth.dto.OtpResponse;
import com.commoncrm.platform.module.auth.service.OtpService;
import com.commoncrm.platform.common.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/security")
@Tag(name = "Security", description = "Administrative Security, MFA, and OTP verifications")
public class SecurityOtpController {

    private final OtpService otpService;
    private final AuditService auditService;

    public SecurityOtpController(OtpService otpService, AuditService auditService) {
        this.otpService = otpService;
        this.auditService = auditService;
    }

    @PostMapping("/generate-otp")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Generate 6-digit Security OTP for administrative operations")
    public ResponseEntity<ApiResponse<OtpResponse>> generateOtp(
            @RequestBody(required = false) GenerateOtpRequest request,
            @RequestParam(required = false) String purpose) {

        String effectivePurpose = (request != null && request.purpose() != null && !request.purpose().isBlank())
                ? request.purpose().trim()
                : (purpose != null && !purpose.isBlank() ? purpose.trim() : "GENERAL_ADMIN_ACTION");

        String code = otpService.generateOtp(effectivePurpose);

        // Audit OTP request
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
                auditService.logAction(
                        principal.getId(),
                        principal.getUsername(),
                        null,
                        "ADMIN_REQUESTED_SECURITY_OTP",
                        "SECURITY",
                        effectivePurpose,
                        null,
                        "Generated OTP for " + effectivePurpose
                );
            }
        } catch (Exception ignored) {}

        OtpResponse response = new OtpResponse(
                code,
                otpService.getValiditySeconds(),
                effectivePurpose,
                "Security OTP generated successfully. Valid for 5 minutes."
        );

        return ResponseEntity.ok(ApiResponse.success(response, "Security verification OTP generated"));
    }
}
