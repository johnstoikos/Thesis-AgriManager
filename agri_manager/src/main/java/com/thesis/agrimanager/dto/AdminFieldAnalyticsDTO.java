package com.thesis.agrimanager.dto;

import java.math.BigDecimal;

public record AdminFieldAnalyticsDTO(
        String fieldName,
        Double totalYieldKg,
        BigDecimal fieldRevenue,
        BigDecimal fieldExpenses,
        String soilType,
        Double soilPh,
        Double area
) {
}
