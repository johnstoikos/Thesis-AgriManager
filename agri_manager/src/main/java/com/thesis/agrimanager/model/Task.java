package com.thesis.agrimanager.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String taskType; // π.χ. Πότισμα, Λίπανση, Ψεκασμός
    private String description;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate taskDate; // Χρησιμοποιούμε LocalDate για μόνο ημερομηνία

    private String status; // PENDING, COMPLETED

    private Integer completionPercentage;

    private Double harvestedYieldAmount;

    @Column(precision = 12, scale = 2)
    private BigDecimal cost; // Συνολικό κόστος: ωριαίο κόστος x ώρες εργασίας

    @Column(precision = 12, scale = 2)
    private BigDecimal hourlyCost;

    @Column(precision = 14, scale = 2)
    private BigDecimal bookedRevenue;

    private Double laborHours; // Ώρες εργασίας

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

    // ΔΙΟΡΘΩΜΕΝΟ: Επιστρέφει LocalDate
    public LocalDate getTaskDate() {
        return taskDate;
    }

    // ΔΙΟΡΘΩΜΕΝΟ: Δέχεται LocalDate
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
