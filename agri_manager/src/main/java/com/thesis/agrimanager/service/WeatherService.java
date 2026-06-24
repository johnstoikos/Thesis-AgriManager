package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.WeatherInfo;
import com.thesis.agrimanager.dto.WeatherResponse;
import com.thesis.agrimanager.model.Field;
import com.thesis.agrimanager.repository.FieldRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class WeatherService {

    private final FieldRepository fieldRepository;
    private final RestTemplate restTemplate;

    @Value("${weather.api.key}")
    private String apiKey;

    // Αρχικοποιεί τις εξαρτήσεις.
    public WeatherService(FieldRepository fieldRepository, RestTemplate restTemplate) {
        this.fieldRepository = fieldRepository;
        this.restTemplate = restTemplate;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public WeatherInfo getWeatherForField(Long fieldId) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new RuntimeException("Field not found"));

        double lat = field.getBoundary().getCentroid().getY();
        double lon = field.getBoundary().getCentroid().getX();

        String url = String.format(
                "https://api.openweathermap.org/data/2.5/weather?lat=%f&lon=%f&appid=%s&units=metric&lang=el",
                lat, lon, apiKey
        );

        WeatherResponse response = restTemplate.getForObject(url, WeatherResponse.class);

        if (response != null) {
            return new WeatherInfo(
                    response.getTemp(),
                    response.getHumidity().intValue(),
                    response.getDescription(),
                    response.getIcon()
            );
        }
        throw new RuntimeException("Could not fetch weather data");
    }
}
