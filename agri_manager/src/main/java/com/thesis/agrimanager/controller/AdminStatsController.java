package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.AdminOverviewDTO;
import com.thesis.agrimanager.dto.CropDistributionDTO;
import com.thesis.agrimanager.service.AdminStatsService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/stats")
public class AdminStatsController {
    private final AdminStatsService adminStatsService;

    // Αρχικοποιεί τις εξαρτήσεις.
    public AdminStatsController(AdminStatsService adminStatsService) {
        this.adminStatsService = adminStatsService;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    @GetMapping("/overview")
    public AdminOverviewDTO getOverview() {
        return adminStatsService.getOverview();
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    @GetMapping("/crops-dist")
    public List<CropDistributionDTO> getCropDistribution() {
        return adminStatsService.getCropDistribution();
    }
}
