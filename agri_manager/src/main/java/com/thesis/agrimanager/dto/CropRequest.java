package com.thesis.agrimanager.dto;

import org.locationtech.jts.geom.Polygon;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import org.n52.jackson.datatype.jts.GeometryDeserializer;
import java.time.LocalDate;

public class CropRequest {
    private String type;
    private String variety;
    private LocalDate plantingDate;

    @JsonDeserialize(using = GeometryDeserializer.class)
    private Polygon zoneBoundary;

    // Getters / Setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getVariety() { return variety; }
    public void setVariety(String variety) { this.variety = variety; }
    public LocalDate getPlantingDate() { return plantingDate; }
    public void setPlantingDate(LocalDate plantingDate) { this.plantingDate = plantingDate; }
    public Polygon getZoneBoundary() { return zoneBoundary; }
    public void setZoneBoundary(Polygon zoneBoundary) { this.zoneBoundary = zoneBoundary; }
}