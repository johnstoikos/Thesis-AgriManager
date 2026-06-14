package com.thesis.agrimanager.dto;

import lombok.Data;
import org.locationtech.jts.geom.Polygon;

@Data
public class FieldDTO {

    // Μέσα στην κλάση FieldDTO:

    public FieldDTO() {} // Κράτα και τον άδειο, χρειάζεται για το JSON

    public FieldDTO(Long id, String name, Double area, org.locationtech.jts.geom.Polygon boundary) {
        this.id = id;
        this.name = name;
        this.area = area;
        this.boundary = boundary;
    }

    public FieldDTO(Long id, String name, Double area, Polygon boundary, String soilType, Double soilPh,
                    String irrigationType) {
        this.id = id;
        this.name = name;
        this.area = area;
        this.boundary = boundary;
        this.soilType = soilType;
        this.soilPh = soilPh;
        this.irrigationType = irrigationType;
    }

    private Long id;
    private String name;
    private Double area;
    private Polygon boundary; // Αυτό θα χρησιμοποιηθεί για το GET
    private String soilType;
    private Double soilPh;
    private String irrigationType;

    // Getters και Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Double getArea() { return area; }
    public void setArea(Double area) { this.area = area; }
    public Polygon getBoundary() { return boundary; }
    public void setBoundary(Polygon boundary) { this.boundary = boundary; }
    public String getSoilType() { return soilType; }
    public void setSoilType(String soilType) { this.soilType = soilType; }
    public Double getSoilPh() { return soilPh; }
    public void setSoilPh(Double soilPh) { this.soilPh = soilPh; }
    public String getIrrigationType() { return irrigationType; }
    public void setIrrigationType(String irrigationType) { this.irrigationType = irrigationType; }
}
