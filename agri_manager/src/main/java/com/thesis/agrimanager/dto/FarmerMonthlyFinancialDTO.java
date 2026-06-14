package com.thesis.agrimanager.dto;

import java.math.BigDecimal;

public class FarmerMonthlyFinancialDTO {
    private final String month;
    private final BigDecimal revenue;
    private final BigDecimal expenses;

    public FarmerMonthlyFinancialDTO(
            String month,
            BigDecimal revenue,
            BigDecimal expenses
    ) {
        this.month = month;
        this.revenue = revenue;
        this.expenses = expenses;
    }

    public String getMonth() {
        return month;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public BigDecimal getExpenses() {
        return expenses;
    }
}
