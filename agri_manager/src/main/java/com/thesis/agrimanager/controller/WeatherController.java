package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.WeatherInfo;
import com.thesis.agrimanager.service.WeatherService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/weather")
public class WeatherController {

    private final WeatherService weatherService;

    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    @GetMapping("/field/{fieldId}")
    public WeatherInfo getWeather(@PathVariable Long fieldId) {
        return weatherService.getWeatherForField(fieldId);
    }
}