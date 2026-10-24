package com.commoncrm.platform.common.multitenancy;

/**
 * Holds tenant identity for the current execution thread.
 * ThreadLocal is always cleared at the end of the request lifecycle to prevent leakages across pooled servlet threads.
 */
public final class TenantContext {

    private static final ThreadLocal<Long> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {}

    public static void setTenantId(Long tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static Long getTenantId() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
