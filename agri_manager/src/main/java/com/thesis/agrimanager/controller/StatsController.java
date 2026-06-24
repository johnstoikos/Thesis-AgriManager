package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.AdminFieldAnalyticsDTO;
import com.thesis.agrimanager.dto.DashboardDTO;
import com.thesis.agrimanager.dto.FarmerStatsDTO;
import com.thesis.agrimanager.service.StatsService;
import com.thesis.agrimanager.service.UserProfitService;
import java.security.Principal;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
    public DashboardDTO getDashboard(Principal principal) {
        return statsService.getDashboardStats(principal.getName());
    }

    @GetMapping("/farmer-dashboard")
    public FarmerStatsDTO getFarmerDashboardStats(Principal principal) {
        return statsService.getFarmerDashboardStats(principal.getName());
    }

    @GetMapping("/field-breakdown")
    public List<AdminFieldAnalyticsDTO> getFieldBreakdown(Principal principal) {
        return statsService.getFieldBreakdown(principal.getName());
    }

    @DeleteMapping("/financial/{target}")
    public FarmerStatsDTO resetFinancialStats(
            @PathVariable UserProfitService.FinancialResetTarget target,
            Principal principal
    ) {
        return statsService.resetFinancialStats(principal.getName(), target);
    }
}
