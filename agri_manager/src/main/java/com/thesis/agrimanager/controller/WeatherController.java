package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.WeatherInfo;
import com.thesis.agrimanager.service.WeatherService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/weather")
public class WeatherController {

    private final WeatherService weatherService;

    // Αρχικοποιεί τις εξαρτήσεις.
    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    @GetMapping("/field/{fieldId}")
    public WeatherInfo getWeather(@PathVariable Long fieldId) {
        return weatherService.getWeatherForField(fieldId);
    }
}
