package com.thesis.agrimanager.dto;

public class DashboardDTO {
    private long totalFields;
    private long activeCrops;
    private long pendingTasks;
    private double totalArea;

    public DashboardDTO(long totalFields, long activeCrops, long pendingTasks, double totalArea) {
        this.totalFields = totalFields;
        this.activeCrops = activeCrops;
        this.pendingTasks = pendingTasks;
        this.totalArea = totalArea;
    }

    // Getters
    public long getTotalFields() { return totalFields; }
    public long getActiveCrops() { return activeCrops; }
    public long getPendingTasks() { return pendingTasks; }
    public double getTotalArea() { return totalArea; }
}