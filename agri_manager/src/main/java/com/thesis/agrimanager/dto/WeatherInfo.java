package com.thesis.agrimanager.dto;

public record WeatherInfo(
        double temperature,
        int humidity,
        String description,
        String icon
) {
}
