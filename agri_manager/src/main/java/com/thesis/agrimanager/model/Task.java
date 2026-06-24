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

    // Επιστρέφει ζητούμενα δεδομένα.
    public Long getId() { return id; }
    // Ενημερώνει τιμή πεδίου.
    public void setId(Long id) { this.id = id; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public String getTaskType() { return taskType; }
    // Ενημερώνει τιμή πεδίου.
    public void setTaskType(String taskType) { this.taskType = taskType; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public String getDescription() { return description; }
    // Ενημερώνει τιμή πεδίου.
    public void setDescription(String description) { this.description = description; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public LocalDate getTaskDate() {
        return taskDate;
    }

    // Ενημερώνει τιμή πεδίου.
    public void setTaskDate(LocalDate taskDate) {
        this.taskDate = taskDate;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public String getStatus() { return status; }
    // Ενημερώνει τιμή πεδίου.
    public void setStatus(String status) { this.status = status; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Integer getCompletionPercentage() { return completionPercentage; }
    // Ενημερώνει τιμή πεδίου.
    public void setCompletionPercentage(Integer completionPercentage) {
        this.completionPercentage = completionPercentage;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Double getHarvestedYieldAmount() { return harvestedYieldAmount; }
    // Ενημερώνει τιμή πεδίου.
    public void setHarvestedYieldAmount(Double harvestedYieldAmount) {
        this.harvestedYieldAmount = harvestedYieldAmount;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public BigDecimal getCost() { return cost; }
    // Ενημερώνει τιμή πεδίου.
    public void setCost(BigDecimal cost) { this.cost = cost; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public BigDecimal getHourlyCost() { return hourlyCost; }
    // Ενημερώνει τιμή πεδίου.
    public void setHourlyCost(BigDecimal hourlyCost) { this.hourlyCost = hourlyCost; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public BigDecimal getBookedRevenue() { return bookedRevenue; }
    // Ενημερώνει τιμή πεδίου.
    public void setBookedRevenue(BigDecimal bookedRevenue) { this.bookedRevenue = bookedRevenue; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Double getLaborHours() { return laborHours; }
    // Ενημερώνει τιμή πεδίου.
    public void setLaborHours(Double laborHours) { this.laborHours = laborHours; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Point getLocation() { return location; }
    // Ενημερώνει τιμή πεδίου.
    public void setLocation(Point location) { this.location = location; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Crop getCrop() { return crop; }
    // Ενημερώνει τιμή πεδίου.
    public void setCrop(Crop crop) { this.crop = crop; }
}
