package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.DashboardDTO;
import com.thesis.agrimanager.dto.FarmerStatsDTO;
import com.thesis.agrimanager.repository.FieldRepository;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StatsService {
    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;
    private final TaskRepository taskRepository;
    private final UserProfitService userProfitService;
    private final FinancialRecordService financialRecordService;

    public StatsService(
            FieldRepository fieldRepository,
            CropRepository cropRepository,
            TaskRepository taskRepository,
            UserProfitService userProfitService,
            FinancialRecordService financialRecordService
    ) {
        this.fieldRepository = fieldRepository;
        this.cropRepository = cropRepository;
        this.taskRepository = taskRepository;
        this.userProfitService = userProfitService;
        this.financialRecordService = financialRecordService;
    }

    public DashboardDTO getDashboardStats(String username) {
        long fields = fieldRepository.countByOwnerUsername(username);
        long crops = cropRepository.countByFieldOwnerUsername(username);

        long tasks = taskRepository.countByStatusAndCropFieldOwnerUsername("PENDING", username);

        double totalArea = fieldRepository.findByOwnerUsername(username).stream()
                .filter(f -> f.getArea() != null)
                .mapToDouble(f -> f.getArea())
                .sum();

        return new DashboardDTO(fields, crops, tasks, totalArea);
    }

    public FarmerStatsDTO getFarmerDashboardStats(String username) {
        return toFarmerStatsDTO(userProfitService.getSnapshot(username));
    }

    @Transactional
    public FarmerStatsDTO resetFinancialStats(
            String username,
            UserProfitService.FinancialResetTarget target
    ) {
        FarmerStatsDTO stats = toFarmerStatsDTO(userProfitService.resetFinancialData(username, target));
        deleteFinancialRecords(username, target);
        return stats;
    }

    private void deleteFinancialRecords(
            String username,
            UserProfitService.FinancialResetTarget target
    ) {
        switch (target) {
            case REVENUE -> financialRecordService.deleteRevenueRecords(username);
            case EXPENSES -> financialRecordService.deleteExpenseRecords(username);
            case ALL -> financialRecordService.deleteAllRecords(username);
            case PROFIT -> { }
        }
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
