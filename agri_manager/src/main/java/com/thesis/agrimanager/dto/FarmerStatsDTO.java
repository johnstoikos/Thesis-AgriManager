package com.thesis.agrimanager.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FarmerStatsDTO(
        BigDecimal totalRevenue,
        BigDecimal totalExpenses,
        BigDecimal totalProfit,
        LocalDate monthlyPeriodStart,
        LocalDate profitPeriodStart,
        LocalDate profitPeriodEnd
) {
}
