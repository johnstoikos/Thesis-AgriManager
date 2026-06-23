package com.thesis.agrimanager.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String taskType;
    private String description;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate taskDate;

    private String status;

    private Integer completionPercentage;

    private Double harvestedYieldAmount;

    @Column(precision = 12, scale = 2)
    private BigDecimal cost;

    @Column(precision = 12, scale = 2)
    private BigDecimal hourlyCost;

    @Column(precision = 14, scale = 2)
    private BigDecimal bookedRevenue;

    private Double laborHours;

    @Column(columnDefinition = "geometry(Point, 4326)")
    private Point location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crop_id")
    private Crop crop;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTaskType() { return taskType; }
    public void setTaskType(String taskType) { this.taskType = taskType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getTaskDate() {
        return taskDate;
    }

    public void setTaskDate(LocalDate taskDate) {
        this.taskDate = taskDate;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getCompletionPercentage() { return completionPercentage; }
    public void setCompletionPercentage(Integer completionPercentage) {
        this.completionPercentage = completionPercentage;
    }

    public Double getHarvestedYieldAmount() { return harvestedYieldAmount; }
    public void setHarvestedYieldAmount(Double harvestedYieldAmount) {
        this.harvestedYieldAmount = harvestedYieldAmount;
    }

    public BigDecimal getCost() { return cost; }
    public void setCost(BigDecimal cost) { this.cost = cost; }

    public BigDecimal getHourlyCost() { return hourlyCost; }
    public void setHourlyCost(BigDecimal hourlyCost) { this.hourlyCost = hourlyCost; }

    public BigDecimal getBookedRevenue() { return bookedRevenue; }
    public void setBookedRevenue(BigDecimal bookedRevenue) { this.bookedRevenue = bookedRevenue; }

    public Double getLaborHours() { return laborHours; }
    public void setLaborHours(Double laborHours) { this.laborHours = laborHours; }

    public Point getLocation() { return location; }
    public void setLocation(Point location) { this.location = location; }

    public Crop getCrop() { return crop; }
    public void setCrop(Crop crop) { this.crop = crop; }
}
