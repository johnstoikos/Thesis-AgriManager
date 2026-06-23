package com.thesis.agrimanager.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record AdminAnalyticsDTO(
        BigDecimal totalExpenses,
        BigDecimal totalRevenue,
        BigDecimal netProfit,
        Long totalFieldsCount,
        Double totalAreaStremmata,
        Long totalCropsCount,
        Long pendingTasksCount,
        Long completedTasksCount,
        Double totalYieldKg,
        Map<String, BigDecimal> monthlyExpenses,
        Map<String, BigDecimal> monthlyRevenue,
        List<AdminFieldAnalyticsDTO> fieldsBreakdown,
        Map<String, Double> pieChartData
) {
}
