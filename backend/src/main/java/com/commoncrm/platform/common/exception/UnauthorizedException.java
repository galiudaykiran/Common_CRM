package com.commoncrm.platform.common.exception;

import com.commoncrm.platform.common.api.ErrorCodes;
import org.springframework.http.HttpStatus;

public class UnauthorizedException extends BaseException {
    public UnauthorizedException(String message) {
        super(message, ErrorCodes.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }
}
