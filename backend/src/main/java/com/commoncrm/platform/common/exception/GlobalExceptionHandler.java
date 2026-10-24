package com.commoncrm.platform.common.exception;

import com.commoncrm.platform.common.api.ApiError;
import com.commoncrm.platform.common.api.ApiResponse;
import com.commoncrm.platform.common.api.ErrorCodes;
import com.commoncrm.platform.common.api.RequestIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.ArrayList;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private String getRequestId() {
        String requestId = MDC.get(RequestIdFilter.MDC_REQUEST_ID_KEY);
        return requestId != null ? requestId : "N/A";
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException ex) {
        List<ApiError> errors = new ArrayList<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.add(ApiError.builder()
                    .field(error.getField())
                    .message(error.getDefaultMessage())
                    .rejectedValue(error.getRejectedValue())
                    .build());
        }

        log.warn("Validation error on request [{}]: {}", getRequestId(), errors);
        ApiResponse<Void> response = ApiResponse.error(
                ErrorCodes.VALIDATION_ERROR,
                "Input validation failed",
                errors,
                getRequestId()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ApiResponse<Void>> handleBaseException(BaseException ex) {
        log.warn("Application exception [{}]: {} - {}", getRequestId(), ex.getErrorCode(), ex.getMessage());
        ApiResponse<Void> response = ApiResponse.error(
                ex.getErrorCode(),
                ex.getMessage(),
                null,
                getRequestId()
        );
        return ResponseEntity.status(ex.getStatus()).body(response);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        ApiResponse<Void> response = ApiResponse.error(
                ErrorCodes.BAD_CREDENTIALS,
                "Invalid username or password",
                null,
                getRequestId()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ApiResponse<Void>> handleLockedException(LockedException ex) {
        ApiResponse<Void> response = ApiResponse.error(
                ErrorCodes.ACCOUNT_LOCKED,
                ex.getMessage(),
                null,
                getRequestId()
        );
        return ResponseEntity.status(HttpStatus.LOCKED).body(response);
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiResponse<Void>> handleDisabledException(DisabledException ex) {
        ApiResponse<Void> response = ApiResponse.error(
                ErrorCodes.UNAUTHORIZED,
                "Account is disabled. Please contact administrator.",
                null,
                getRequestId()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Access denied on request [{}]: {}", getRequestId(), ex.getMessage());
        ApiResponse<Void> response = ApiResponse.error(
                ErrorCodes.FORBIDDEN,
                "You do not have permission to perform this action",
                null,
                getRequestId()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.error("Database constraint violation on request [{}]: {}", getRequestId(), ex.getMessage());
        ApiResponse<Void> response = ApiResponse.error(
                ErrorCodes.DUPLICATE_RESOURCE,
                "Database constraint violation or duplicate entry",
                null,
                getRequestId()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneralException(Exception ex) {
        log.error("Unhandled server exception on request [{}]: ", getRequestId(), ex);
        ApiResponse<Void> response = ApiResponse.error(
                ErrorCodes.INTERNAL_SERVER_ERROR,
                "An unexpected internal error occurred. Please contact support with request ID: " + getRequestId(),
                null,
                getRequestId()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
