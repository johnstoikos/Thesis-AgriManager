package com.thesis.agrimanager.model;

import jakarta.persistence.*;
import org.locationtech.jts.geom.Point;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String taskType; // π.χ. Πότισμα, Λίπανση, Ψεκασμός
    private String description;
    private LocalDateTime taskDate;
    private String status; // PENDING, COMPLETED

    @Column(columnDefinition = "geometry(Point, 4326)")
    private Point location; // Το σημείο της εργασίας στο χάρτη

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crop_id")
    private Crop crop;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTaskType() { return taskType; }
    public void setTaskType(String taskType) { this.taskType = taskType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getTaskDate() { return taskDate; }
    public void setTaskDate(LocalDateTime taskDate) { this.taskDate = taskDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Point getLocation() { return location; }
    public void setLocation(Point location) { this.location = location; }
    public Crop getCrop() { return crop; }
    public void setCrop(Crop crop) { this.crop = crop; }
}