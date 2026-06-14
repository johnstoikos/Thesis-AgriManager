package com.thesis.agrimanager.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class AdminAnalyticsDTO {
    private final BigDecimal totalExpenses;
    private final BigDecimal totalRevenue;
    private final BigDecimal netProfit;
    private final Long totalFieldsCount;
    private final Double totalAreaStremmata;
    private final Long totalCropsCount;
    private final Long pendingTasksCount;
    private final Long completedTasksCount;
    private final Double totalYieldKg;
    private final Map<String, BigDecimal> monthlyExpenses;
    private final Map<String, BigDecimal> monthlyRevenue;
    private final List<AdminFieldAnalyticsDTO> fieldsBreakdown;
    private final Map<String, Double> pieChartData;

    public AdminAnalyticsDTO(
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
        this.totalExpenses = totalExpenses;
        this.totalRevenue = totalRevenue;
        this.netProfit = netProfit;
        this.totalFieldsCount = totalFieldsCount;
        this.totalAreaStremmata = totalAreaStremmata;
        this.totalCropsCount = totalCropsCount;
        this.pendingTasksCount = pendingTasksCount;
        this.completedTasksCount = completedTasksCount;
        this.totalYieldKg = totalYieldKg;
        this.monthlyExpenses = monthlyExpenses;
        this.monthlyRevenue = monthlyRevenue;
        this.fieldsBreakdown = fieldsBreakdown;
        this.pieChartData = pieChartData;
    }

    public BigDecimal getTotalExpenses() {
        return totalExpenses;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public BigDecimal getNetProfit() {
        return netProfit;
    }

    public Long getTotalFieldsCount() {
        return totalFieldsCount;
    }

    public Double getTotalAreaStremmata() {
        return totalAreaStremmata;
    }

    public Long getTotalCropsCount() {
        return totalCropsCount;
    }

    public Long getPendingTasksCount() {
        return pendingTasksCount;
    }

    public Long getCompletedTasksCount() {
        return completedTasksCount;
    }

    public Double getTotalYieldKg() {
        return totalYieldKg;
    }

    public Map<String, BigDecimal> getMonthlyExpenses() {
        return monthlyExpenses;
    }

    public Map<String, BigDecimal> getMonthlyRevenue() {
        return monthlyRevenue;
    }

    public List<AdminFieldAnalyticsDTO> getFieldsBreakdown() {
        return fieldsBreakdown;
    }

    public Map<String, Double> getPieChartData() {
        return pieChartData;
    }
}
