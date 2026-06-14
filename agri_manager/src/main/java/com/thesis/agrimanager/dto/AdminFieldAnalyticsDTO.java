package com.thesis.agrimanager.dto;

import java.math.BigDecimal;

public class AdminFieldAnalyticsDTO {
    private final String fieldName;
    private final Double totalYieldKg;
    private final BigDecimal fieldRevenue;
    private final BigDecimal fieldExpenses;
    private final String soilType;
    private final Double soilPh;
    private final Double area;

    public AdminFieldAnalyticsDTO(
            String fieldName,
            Double totalYieldKg,
            BigDecimal fieldRevenue,
            BigDecimal fieldExpenses,
            String soilType,
            Double soilPh,
            Double area
    ) {
        this.fieldName = fieldName;
        this.totalYieldKg = totalYieldKg;
        this.fieldRevenue = fieldRevenue;
        this.fieldExpenses = fieldExpenses;
        this.soilType = soilType;
        this.soilPh = soilPh;
        this.area = area;
    }

    public String getFieldName() {
        return fieldName;
    }

    public Double getTotalYieldKg() {
        return totalYieldKg;
    }

    public BigDecimal getFieldRevenue() {
        return fieldRevenue;
    }

    public BigDecimal getFieldExpenses() {
        return fieldExpenses;
    }

    public String getSoilType() {
        return soilType;
    }

    public Double getSoilPh() {
        return soilPh;
    }

    public Double getArea() {
        return area;
    }
}
