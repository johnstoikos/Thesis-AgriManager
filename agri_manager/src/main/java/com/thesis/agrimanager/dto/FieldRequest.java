package com.thesis.agrimanager.dto;

import org.locationtech.jts.geom.Polygon;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import org.n52.jackson.datatype.jts.GeometryDeserializer;

public record FieldRequest(
        String name,
        Double area,
        String soilType,
        Double soilPh,
        String irrigationType,
        @JsonDeserialize(using = GeometryDeserializer.class)
        Polygon boundary
) {
}
