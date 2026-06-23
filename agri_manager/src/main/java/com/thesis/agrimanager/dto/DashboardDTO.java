package com.thesis.agrimanager.dto;

public record DashboardDTO(
        long totalFields,
        long activeCrops,
        long pendingTasks,
        double totalArea
) {
}
