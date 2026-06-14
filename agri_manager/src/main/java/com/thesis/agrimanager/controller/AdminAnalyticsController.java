package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.AdminAnalyticsDTO;
import com.thesis.agrimanager.service.AdminAnalyticsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/analytics")
public class AdminAnalyticsController {
    private final AdminAnalyticsService adminAnalyticsService;

    public AdminAnalyticsController(AdminAnalyticsService adminAnalyticsService) {
        this.adminAnalyticsService = adminAnalyticsService;
    }

    @GetMapping
    public AdminAnalyticsDTO getAdminAnalytics(
            @RequestParam(required = false) Long userId,
            @RequestParam(name = "range", defaultValue = "year") String timeRange
    ) {
        return adminAnalyticsService.getAdminAnalytics(userId, timeRange);
    }
}
