package com.thesis.agrimanager.dto;

public record MonthlyActivityDTO(
        String month,
        long completedTasksCount
) {
}
