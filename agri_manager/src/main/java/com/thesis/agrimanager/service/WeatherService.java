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

    public WeatherService(FieldRepository fieldRepository, RestTemplate restTemplate) {
        this.fieldRepository = fieldRepository;
        this.restTemplate = restTemplate;
    }

    public WeatherInfo getWeatherForField(Long fieldId) {
        // 1. Βρίσκουμε το χωράφι
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new RuntimeException("Field not found"));

        // 2. Παίρνουμε το κέντρο του χωραφιού (Centroid)
        double lat = field.getBoundary().getCentroid().getY();
        double lon = field.getBoundary().getCentroid().getX();

        // 3. URL για OpenWeather (Metric = Κελσίου, Lang el = Ελληνικά)
        String url = String.format(
                "https://api.openweathermap.org/data/2.5/weather?lat=%f&lon=%f&appid=%s&units=metric&lang=el",
                lat, lon, apiKey
        );

        // 4. Κλήση και μετατροπή στο ΔΙΚΟ ΣΟΥ WeatherInfo
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