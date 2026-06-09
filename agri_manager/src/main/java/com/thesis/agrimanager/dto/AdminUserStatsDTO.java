package com.thesis.agrimanager.dto;

import java.math.BigDecimal;
import java.util.List;

public class AdminUserStatsDTO {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private List<String> roles;
    private long totalFields;
    private long totalCrops;
    private long totalTasks;
    private long pendingTasks;
    private long completedTasks;
    private double totalArea;
    private BigDecimal totalCompletedTaskCost;
    private List<CropDistributionDTO> cropDistribution;
    private List<MonthlyActivityDTO> monthlyActivity;

    public AdminUserStatsDTO(
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
        this.id = id;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.roles = roles;
        this.totalFields = totalFields;
        this.totalCrops = totalCrops;
        this.totalTasks = totalTasks;
        this.pendingTasks = pendingTasks;
        this.completedTasks = completedTasks;
        this.totalArea = totalArea;
        this.totalCompletedTaskCost = totalCompletedTaskCost;
        this.cropDistribution = cropDistribution;
        this.monthlyActivity = monthlyActivity;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public List<String> getRoles() { return roles; }
    public long getTotalFields() { return totalFields; }
    public long getTotalCrops() { return totalCrops; }
    public long getTotalTasks() { return totalTasks; }
    public long getPendingTasks() { return pendingTasks; }
    public long getCompletedTasks() { return completedTasks; }
    public double getTotalArea() { return totalArea; }
    public BigDecimal getTotalCompletedTaskCost() { return totalCompletedTaskCost; }
    public List<CropDistributionDTO> getCropDistribution() { return cropDistribution; }
    public List<MonthlyActivityDTO> getMonthlyActivity() { return monthlyActivity; }
}
