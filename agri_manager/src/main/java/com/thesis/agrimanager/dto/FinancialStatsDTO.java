package com.thesis.agrimanager.dto;

import java.math.BigDecimal;

public class FinancialStatsDTO {
    private final String fieldName;
    private final BigDecimal totalCost;

    public FinancialStatsDTO(String fieldName, BigDecimal totalCost) {
        this.fieldName = fieldName;
        this.totalCost = totalCost;
    }

    public String getFieldName() {
        return fieldName;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }
}
