package com.thesis.agrimanager.dto;

import java.math.BigDecimal;
import java.util.List;

public class FarmerStatsDTO {
    private final BigDecimal totalRevenue;
    private final BigDecimal totalExpenses;
    private final List<FarmerMonthlyFinancialDTO> monthlyFinancials;

    public FarmerStatsDTO(
            BigDecimal totalRevenue,
            BigDecimal totalExpenses,
            List<FarmerMonthlyFinancialDTO> monthlyFinancials
    ) {
        this.totalRevenue = totalRevenue;
        this.totalExpenses = totalExpenses;
        this.monthlyFinancials = monthlyFinancials;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public BigDecimal getTotalExpenses() {
        return totalExpenses;
    }

    public List<FarmerMonthlyFinancialDTO> getMonthlyFinancials() {
        return monthlyFinancials;
    }
}
