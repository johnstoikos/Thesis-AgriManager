package com.thesis.agrimanager.dto;

import java.util.List;

public record AdminOverviewDTO(
        long totalFarmers,
        long totalFields,
        long totalTasks,
        List<MonthlyActivityDTO> monthlyActivity
) {
}
