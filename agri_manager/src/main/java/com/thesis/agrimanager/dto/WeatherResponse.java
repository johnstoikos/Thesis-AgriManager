package com.thesis.agrimanager.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record WeatherResponse(
        @JsonProperty("main")
        Map<String, Double> main,
        @JsonProperty("weather")
        List<Map<String, Object>> weather
) {
    public Double getTemp() { return main.get("temp"); }
    public Double getHumidity() { return main.get("humidity"); }
    public String getDescription() {
        return (String) weather.get(0).get("description");
    }
    public String getIcon() {
        return (String) weather.get(0).get("icon");
    }
}
