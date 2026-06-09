package com.thesis.agrimanager.dto;

public class MonthlyActivityDTO {
    private String month;
    private long completedTasksCount;

    public MonthlyActivityDTO(String month, long completedTasksCount) {
        this.month = month;
        this.completedTasksCount = completedTasksCount;
    }

    public String getMonth() {
        return month;
    }

    public long getCompletedTasksCount() {
        return completedTasksCount;
    }
}
