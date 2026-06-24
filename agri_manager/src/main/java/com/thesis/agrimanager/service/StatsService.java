package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.AdminFieldAnalyticsDTO;
import com.thesis.agrimanager.dto.DashboardDTO;
import com.thesis.agrimanager.dto.FarmerStatsDTO;
import com.thesis.agrimanager.model.Field;
import com.thesis.agrimanager.model.FinancialRecord;
import com.thesis.agrimanager.model.FinancialRecordType;
import com.thesis.agrimanager.model.Task;
import com.thesis.agrimanager.repository.FieldRepository;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.TaskRepository;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

    @Transactional(readOnly = true)
    public List<AdminFieldAnalyticsDTO> getFieldBreakdown(String username) {
        Map<Long, MutableFieldAnalytics> fieldsById = new LinkedHashMap<>();
        fieldRepository.findByOwnerUsername(username).stream()
                .sorted(Comparator.comparing(Field::getName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .forEach(field -> fieldsById.put(
                        field.getId(),
                        new MutableFieldAnalytics(
                                field.getName() == null ? "Χωράφι #" + field.getId() : field.getName(),
                                field.getSoilType(),
                                field.getSoilPh(),
                                field.getArea()
                        )
                ));

        for (Task task : taskRepository.findAllForFarmerProfit(username)) {
            if (!userProfitService.isCompletedHarvest(task)) {
                continue;
            }

            Field field = task.getCrop().getField();
            MutableFieldAnalytics fieldAnalytics = fieldsById.get(field.getId());
            if (fieldAnalytics != null) {
                fieldAnalytics.totalYieldKg += task.getHarvestedYieldAmount() == null
                        ? 0.0
                        : task.getHarvestedYieldAmount();
            }
        }

        for (FinancialRecord record : financialRecordService.getRecords(username)) {
            Long fieldId = record.getFieldId();
            if (fieldId == null) {
                continue;
            }

            MutableFieldAnalytics fieldAnalytics = fieldsById.computeIfAbsent(
                    fieldId,
                    ignored -> new MutableFieldAnalytics(
                            record.getFieldName() == null ? "Χωράφι #" + fieldId : record.getFieldName(),
                            null,
                            null,
                            0.0
                    )
            );

            BigDecimal amount = zeroIfNull(record.getAmount());
            if (record.getType() == FinancialRecordType.REVENUE) {
                fieldAnalytics.revenue = fieldAnalytics.revenue.add(amount);
            } else if (record.getType() == FinancialRecordType.EXPENSE) {
                fieldAnalytics.expenses = fieldAnalytics.expenses.add(amount);
            }
        }

        return fieldsById.values().stream()
                .map(field -> new AdminFieldAnalyticsDTO(
                        field.name,
                        field.totalYieldKg,
                        field.revenue,
                        field.expenses,
                        field.soilType,
                        field.soilPh,
                        field.area
                ))
                .toList();
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

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static class MutableFieldAnalytics {
        private final String name;
        private final String soilType;
        private final Double soilPh;
        private final double area;
        private double totalYieldKg;
        private BigDecimal revenue = BigDecimal.ZERO;
        private BigDecimal expenses = BigDecimal.ZERO;

        private MutableFieldAnalytics(
                String name,
                String soilType,
                Double soilPh,
                Double area
        ) {
            this.name = name;
            this.soilType = soilType;
            this.soilPh = soilPh;
            this.area = area == null ? 0.0 : area;
        }
    }
}
