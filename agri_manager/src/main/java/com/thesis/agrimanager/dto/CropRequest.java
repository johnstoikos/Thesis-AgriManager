package com.thesis.agrimanager.dto;

import org.locationtech.jts.geom.Polygon;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import org.n52.jackson.datatype.jts.GeometryDeserializer;
import java.math.BigDecimal;
import java.time.LocalDate;

public class CropRequest {
    private String type;
    private String variety;
    private LocalDate plantingDate;
    private Double harvestYield;
    private BigDecimal sellingPricePerKg;

    @JsonDeserialize(using = GeometryDeserializer.class)
    private Polygon zoneBoundary;

    // Getters / Setters
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
}
