package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.DashboardDTO;
import com.thesis.agrimanager.dto.FarmerStatsDTO;
import com.thesis.agrimanager.repository.FieldRepository;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.TaskRepository;
import org.springframework.stereotype.Service;

@Service
public class StatsService {
    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;
    private final TaskRepository taskRepository;
    private final UserProfitService userProfitService;

    public StatsService(
            FieldRepository fieldRepository,
            CropRepository cropRepository,
            TaskRepository taskRepository,
            UserProfitService userProfitService
    ) {
        this.fieldRepository = fieldRepository;
        this.cropRepository = cropRepository;
        this.taskRepository = taskRepository;
        this.userProfitService = userProfitService;
    }

    public DashboardDTO getDashboardStats(String username) {
        long fields = fieldRepository.countByOwnerUsername(username);
        long crops = cropRepository.countByFieldOwnerUsername(username);

        // Φιλτράρουμε τα tasks που έχουν status "PENDING" για τον συνδεδεμένο χρήστη
        long tasks = taskRepository.countByStatusAndCropFieldOwnerUsername("PENDING", username);

        // Υπολογίζουμε το σύνολο των εκταρίων/στρεμμάτων για τον συνδεδεμένο χρήστη
        double totalArea = fieldRepository.findByOwnerUsername(username).stream()
                .filter(f -> f.getArea() != null)
                .mapToDouble(f -> f.getArea())
                .sum();

        return new DashboardDTO(fields, crops, tasks, totalArea);
    }

    public FarmerStatsDTO getFarmerDashboardStats(String username) {
        return toFarmerStatsDTO(userProfitService.getSnapshot(username));
    }

    public FarmerStatsDTO resetFinancialStats(
            String username,
            UserProfitService.FinancialResetTarget target
    ) {
        return toFarmerStatsDTO(userProfitService.resetFinancialData(username, target));
    }

    private FarmerStatsDTO toFarmerStatsDTO(UserProfitService.FinancialSnapshot snapshot) {
        return new FarmerStatsDTO(
                snapshot.monthlyRevenue(),
                snapshot.monthlyExpenses(),
                snapshot.semesterProfit(),
                snapshot.monthlyPeriodStart(),
                snapshot.profitPeriodStart(),
                snapshot.profitPeriodEnd()
        );
    }
}
