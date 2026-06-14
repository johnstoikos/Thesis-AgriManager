package com.thesis.agrimanager.dto;

import org.locationtech.jts.geom.Polygon;
import java.math.BigDecimal;
import java.time.LocalDate;

public class CropDTO {
    private Long id;
    private String type;
    private String variety;
    private LocalDate plantingDate;
    private Double harvestYield;
    private BigDecimal sellingPricePerKg;
    private Polygon zoneBoundary; 
    private Long fieldId; 
    private Double zoneArea;
    private Double coveragePercentage;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getVariety() { return variety; }
    public void setVariety(String variety) { this.variety = variety; }

    public LocalDate getPlantingDate() { return plantingDate; }
    public void setPlantingDate(LocalDate plantingDate) { this.plantingDate = plantingDate; }

    public Double getHarvestYield() { return harvestYield; }
    public void setHarvestYield(Double harvestYield) { this.harvestYield = harvestYield; }

    public BigDecimal getSellingPricePerKg() { return sellingPricePerKg; }
    public void setSellingPricePerKg(BigDecimal sellingPricePerKg) { this.sellingPricePerKg = sellingPricePerKg; }

    public Polygon getZoneBoundary() { return zoneBoundary; }
    public void setZoneBoundary(Polygon zoneBoundary) { this.zoneBoundary = zoneBoundary; }

    public Long getFieldId() { return fieldId; }
    public void setFieldId(Long fieldId) { this.fieldId = fieldId; }

    public Double getZoneArea() {return zoneArea;}
    public void setZoneArea(Double zoneArea) {this.zoneArea = zoneArea;}

    public Double getCoveragePercentage() {return coveragePercentage;}
    public void setCoveragePercentage(Double coveragePercentage) {this.coveragePercentage = coveragePercentage;}
}
