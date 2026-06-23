package com.thesis.agrimanager.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminUserStatsDTO(
        Long id,
        String username,
        String email,
        String fullName,
        List<String> roles,
        long totalFields,
        long totalCrops,
        long totalTasks,
        long pendingTasks,
        long completedTasks,
        double totalArea,
        BigDecimal totalCompletedTaskCost,
        List<CropDistributionDTO> cropDistribution,
        List<MonthlyActivityDTO> monthlyActivity
) {
}
