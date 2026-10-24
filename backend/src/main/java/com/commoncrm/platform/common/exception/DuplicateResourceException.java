package com.commoncrm.platform.common.exception;

import com.commoncrm.platform.common.api.ErrorCodes;
import org.springframework.http.HttpStatus;

public class DuplicateResourceException extends BaseException {

    public DuplicateResourceException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s already exists with %s: '%s'", resourceName, fieldName, fieldValue),
                ErrorCodes.DUPLICATE_RESOURCE, HttpStatus.CONFLICT);
    }

    public DuplicateResourceException(String message) {
        super(message, ErrorCodes.DUPLICATE_RESOURCE, HttpStatus.CONFLICT);
    }
}
