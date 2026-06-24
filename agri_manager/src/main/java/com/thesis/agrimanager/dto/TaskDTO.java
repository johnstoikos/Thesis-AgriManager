package com.thesis.agrimanager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.locationtech.jts.geom.Point;
import java.math.BigDecimal;
import java.time.LocalDate;

// Αρχικοποιεί τις εξαρτήσεις.
public record TaskDTO(
        Long id,
        String taskType,
        String description,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate taskDate,
        String status,
        Integer completionPercentage,
        Double harvestedYieldAmount,
        BigDecimal netHarvestProfit,
        BigDecimal cost,
        BigDecimal hourlyCost,
        Double laborHours,
        Point location,
        Long cropId
) {
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
            @JsonProperty("cropId") Long cropId
    ) {
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
}
