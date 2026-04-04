package com.thesis.agrimanager.dto;

import jakarta.persistence.Column;
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
    private Long id;
    private String name;
    private Double area;
    private Polygon boundary; // Αυτό θα χρησιμοποιηθεί για το GET

    // Getters και Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Double getArea() { return area; }
    public void setArea(Double area) { this.area = area; }
    public Polygon getBoundary() { return boundary; }
    public void setBoundary(Polygon boundary) { this.boundary = boundary; }
}