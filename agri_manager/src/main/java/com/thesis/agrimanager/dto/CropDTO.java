package com.thesis.agrimanager.dto;

import org.locationtech.jts.geom.Polygon;
import java.time.LocalDate;

public class CropDTO {
    private Long id;
    private String type;
    private String variety;
    private LocalDate plantingDate;
    private Polygon zoneBoundary; // Η γεωμετρία της συγκεκριμένης καλλιέργειας
    private Long fieldId; // Το ID του χωραφιού στο οποίο ανήκει
    private Double zoneArea;       // Η έκταση της ζώνης σε τ.μ. ή στρέμματα
    private Double coveragePercentage; // Το % κάλυψης του χωραφιού


    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getVariety() { return variety; }
    public void setVariety(String variety) { this.variety = variety; }

    public LocalDate getPlantingDate() { return plantingDate; }
    public void setPlantingDate(LocalDate plantingDate) { this.plantingDate = plantingDate; }

    public Polygon getZoneBoundary() { return zoneBoundary; }
    public void setZoneBoundary(Polygon zoneBoundary) { this.zoneBoundary = zoneBoundary; }

    public Long getFieldId() { return fieldId; }
    public void setFieldId(Long fieldId) { this.fieldId = fieldId; }

    public Double getZoneArea() {return zoneArea;}
    public void setZoneArea(Double zoneArea) {this.zoneArea = zoneArea;}

    public Double getCoveragePercentage() {return coveragePercentage;}
    public void setCoveragePercentage(Double coveragePercentage) {this.coveragePercentage = coveragePercentage;}
}