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
    private final BigDecimal cost;
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
            @JsonProperty("cost") BigDecimal cost,
            @JsonProperty("laborHours") Double laborHours,
            @JsonProperty("location") Point location,
            @JsonProperty("cropId") Long cropId) {
        this.id = id;
        this.taskType = taskType;
        this.description = description;
        this.taskDate = taskDate;
        this.status = status;
        this.cost = cost;
        this.laborHours = laborHours;
        this.location = location;
        this.cropId = cropId;
    }

    public Long getId() { return id; }
    public String getTaskType() { return taskType; }
    public String getDescription() { return description; }
    public LocalDate getTaskDate() { return taskDate; }
    public String getStatus() { return status; }
    public BigDecimal getCost() { return cost; }
    public Double getLaborHours() { return laborHours; }
    public Point getLocation() { return location; }
    public Long getCropId() { return cropId; }
}
