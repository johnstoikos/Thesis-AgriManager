package com.thesis.agrimanager.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class FarmerStatsDTO {
    private final BigDecimal totalRevenue;
    private final BigDecimal totalExpenses;
    private final BigDecimal totalProfit;
    private final LocalDate monthlyPeriodStart;
    private final LocalDate profitPeriodStart;
    private final LocalDate profitPeriodEnd;

    public FarmerStatsDTO(
            BigDecimal totalRevenue,
            BigDecimal totalExpenses,
            BigDecimal totalProfit,
            LocalDate monthlyPeriodStart,
            LocalDate profitPeriodStart,
            LocalDate profitPeriodEnd
    ) {
        this.totalRevenue = totalRevenue;
        this.totalExpenses = totalExpenses;
        this.totalProfit = totalProfit;
        this.monthlyPeriodStart = monthlyPeriodStart;
        this.profitPeriodStart = profitPeriodStart;
        this.profitPeriodEnd = profitPeriodEnd;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public BigDecimal getTotalExpenses() {
        return totalExpenses;
    }

    public BigDecimal getTotalProfit() {
        return totalProfit;
    }

    public LocalDate getMonthlyPeriodStart() {
        return monthlyPeriodStart;
    }

    public LocalDate getProfitPeriodStart() {
        return profitPeriodStart;
    }

    public LocalDate getProfitPeriodEnd() {
        return profitPeriodEnd;
    }
}
