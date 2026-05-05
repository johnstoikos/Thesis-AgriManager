package com.thesis.agrimanager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import org.locationtech.jts.geom.Point;
import java.time.LocalDate; // Βεβαιώσου ότι είναι LocalDate

@Data
public class TaskDTO {
    private Long id;
    private String taskType;
    private String description;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate taskDate; // ΑΛΛΑΓΗ ΑΠΟ LocalDateTime ΣΕ LocalDate

    private String status;
    private Point location;
    private Long cropId;


    // Getters και Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTaskType() { return taskType; }
    public void setTaskType(String taskType) { this.taskType = taskType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getTaskDate() { return taskDate; }
    public void setTaskDate(LocalDate taskDate) { this.taskDate = taskDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Point getLocation() { return location; }
    public void setLocation(Point location) { this.location = location; }
    public Long getCropId() { return cropId; }
    public void setCropId(Long cropId) { this.cropId = cropId; }
}