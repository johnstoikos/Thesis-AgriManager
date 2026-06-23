package com.thesis.agrimanager.dto;

import org.locationtech.jts.geom.Polygon;

public record FieldDTO(
        Long id,
        String name,
        Double area,
        Polygon boundary,
        String soilType,
        Double soilPh,
        String irrigationType
) {
    public FieldDTO(Long id, String name, Double area, Polygon boundary) {
        this(id, name, area, boundary, null, null, null);
    }
}
