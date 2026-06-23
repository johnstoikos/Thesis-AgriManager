package com.thesis.agrimanager.dto;

import org.locationtech.jts.geom.Polygon;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CropDTO(
        Long id,
        String type,
        String variety,
        LocalDate plantingDate,
        BigDecimal sellingPricePerKg,
        Polygon zoneBoundary,
        Long fieldId,
        Double zoneArea,
        Double coveragePercentage
) {
}
