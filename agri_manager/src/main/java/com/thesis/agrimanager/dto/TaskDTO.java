package com.thesis.agrimanager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.locationtech.jts.geom.Point;
import java.math.BigDecimal;
import java.time.LocalDate;

public class TaskDTO {
    private final Long id;
    private final String taskType;
    private final String description;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private final LocalDate taskDate;

    private final String status;
    private final Integer completionPercentage;
    private final Double harvestedYieldAmount;
    private final BigDecimal netHarvestProfit;
    private final BigDecimal cost;
    private final BigDecimal hourlyCost;
    private final Double laborHours;
    private final Point location;
    private final Long cropId;

    @JsonCreator
    public TaskDTO(
            @JsonProperty("id") Long id,
            @JsonProperty("taskType") String taskType,
            @JsonProperty("description") String description,
            @JsonProperty("taskDate") LocalDate taskDate,
            @JsonProperty("status") String status,
            @JsonProperty("completionPercentage") Integer completionPercentage,
            @JsonProperty("harvestedYieldAmount") Double harvestedYieldAmount,
            @JsonProperty("netHarvestProfit") BigDecimal netHarvestProfit,
            @JsonProperty("cost") BigDecimal cost,
            @JsonProperty("hourlyCost") BigDecimal hourlyCost,
            @JsonProperty("laborHours") Double laborHours,
            @JsonProperty("location") Point location,
            @JsonProperty("cropId") Long cropId) {
        this.id = id;
        this.taskType = taskType;
        this.description = description;
        this.taskDate = taskDate;
        this.status = status;
        this.completionPercentage = completionPercentage;
        this.harvestedYieldAmount = harvestedYieldAmount;
        this.netHarvestProfit = netHarvestProfit;
        this.cost = cost;
        this.hourlyCost = hourlyCost;
        this.laborHours = laborHours;
        this.location = location;
        this.cropId = cropId;
    }

    public Long getId() { return id; }
    public String getTaskType() { return taskType; }
    public String getDescription() { return description; }
    public LocalDate getTaskDate() { return taskDate; }
    public String getStatus() { return status; }
    public Integer getCompletionPercentage() { return completionPercentage; }
    public Double getHarvestedYieldAmount() { return harvestedYieldAmount; }
    public BigDecimal getNetHarvestProfit() { return netHarvestProfit; }
    public BigDecimal getCost() { return cost; }
    public BigDecimal getHourlyCost() { return hourlyCost; }
    public Double getLaborHours() { return laborHours; }
    public Point getLocation() { return location; }
    public Long getCropId() { return cropId; }
}
