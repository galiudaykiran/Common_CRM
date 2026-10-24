package com.commoncrm.platform.module.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeStatsResponse {
    private long totalEmployees;
    private long activeEmployees;
    private long onLeaveEmployees;
    private long inactiveEmployees;
    private BigDecimal monthlyPayroll;
}
