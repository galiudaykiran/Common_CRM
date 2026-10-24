package com.commoncrm.platform.common.exception;

import com.commoncrm.platform.common.api.ErrorCodes;
import org.springframework.http.HttpStatus;

public class ForbiddenException extends BaseException {
    public ForbiddenException(String message) {
        super(message, ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN);
    }
}
