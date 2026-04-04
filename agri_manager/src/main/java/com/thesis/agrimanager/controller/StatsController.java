package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.DashboardDTO;
import com.thesis.agrimanager.service.StatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {
    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/dashboard")
    public DashboardDTO getDashboard() {
        return statsService.getDashboardStats();
    }
}