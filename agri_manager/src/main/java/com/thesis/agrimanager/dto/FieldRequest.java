package com.thesis.agrimanager.dto;

import org.locationtech.jts.geom.Polygon;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import org.n52.jackson.datatype.jts.GeometryDeserializer;

public class FieldRequest {
    private String name;
    private Double area;
    private String soilType;
    private Double soilPh;
    private String irrigationType;

    // Πλέον περιμένουμε "boundary" (όπως το curl) και το κάνουμε κατευθείαν Polygon!
    @JsonDeserialize(using = GeometryDeserializer.class)
    private Polygon boundary;

    // Getters/Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getArea() { return area; }
    public void setArea(Double area) { this.area = area; }

    public String getSoilType() { return soilType; }
    public void setSoilType(String soilType) { this.soilType = soilType; }

    public Double getSoilPh() { return soilPh; }
    public void setSoilPh(Double soilPh) { this.soilPh = soilPh; }

    public String getIrrigationType() { return irrigationType; }
    public void setIrrigationType(String irrigationType) { this.irrigationType = irrigationType; }

    public Polygon getBoundary() { return boundary; }
    public void setBoundary(Polygon boundary) { this.boundary = boundary; }


}
