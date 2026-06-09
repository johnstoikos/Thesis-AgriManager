package com.thesis.agrimanager.dto;

public class CropDistributionDTO {
    private String cropType;
    private double totalAcres;

    public CropDistributionDTO(String cropType, double totalAcres) {
        this.cropType = cropType;
        this.totalAcres = totalAcres;
    }

    public String getCropType() {
        return cropType;
    }

    public double getTotalAcres() {
        return totalAcres;
    }
}
