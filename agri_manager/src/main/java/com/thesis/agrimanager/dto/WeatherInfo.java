package com.thesis.agrimanager.dto;

public class WeatherInfo {
    private double temperature;
    private int humidity;
    private String description;
    private String icon;

    // Default Constructor (απαραίτητος για το Jackson/JSON)
    public WeatherInfo() {}

    // Constructor με παραμέτρους
    public WeatherInfo(double temperature, int humidity, String description, String icon) {
        this.temperature = temperature;
        this.humidity = humidity;
        this.description = description;
        this.icon = icon;
    }

    // Getters and Setters
    public double getTemperature() {
        return temperature;
    }

    public void setTemperature(double temperature) {
        this.temperature = temperature;
    }

    public int getHumidity() {
        return humidity;
    }

    public void setHumidity(int humidity) {
        this.humidity = humidity;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }
}