package com.thesis.agrimanager.dto;

import java.util.List;

public class AdminOverviewDTO {
    private long totalFarmers;
    private long totalFields;
    private long totalTasks;
    private List<MonthlyActivityDTO> monthlyActivity;

    public AdminOverviewDTO(
            long totalFarmers,
            long totalFields,
            long totalTasks,
            List<MonthlyActivityDTO> monthlyActivity
    ) {
        this.totalFarmers = totalFarmers;
        this.totalFields = totalFields;
        this.totalTasks = totalTasks;
        this.monthlyActivity = monthlyActivity;
    }

    public long getTotalFarmers() {
        return totalFarmers;
    }

    public long getTotalFields() {
        return totalFields;
    }

    public long getTotalTasks() {
        return totalTasks;
    }

    public List<MonthlyActivityDTO> getMonthlyActivity() {
        return monthlyActivity;
    }
}
