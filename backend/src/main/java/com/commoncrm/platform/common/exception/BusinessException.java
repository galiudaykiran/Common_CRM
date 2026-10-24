package com.commoncrm.platform.common.exception;

import com.commoncrm.platform.common.api.ErrorCodes;
import org.springframework.http.HttpStatus;

public class BusinessException extends BaseException {
    public BusinessException(String message) {
        super(message, ErrorCodes.BUSINESS_ERROR, HttpStatus.BAD_REQUEST);
    }

    public BusinessException(String message, String errorCode) {
        super(message, errorCode, HttpStatus.BAD_REQUEST);
    }
}
