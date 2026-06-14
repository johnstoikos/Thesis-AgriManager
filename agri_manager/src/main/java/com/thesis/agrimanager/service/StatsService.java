package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.DashboardDTO;
import com.thesis.agrimanager.dto.FarmerMonthlyFinancialDTO;
import com.thesis.agrimanager.dto.FarmerStatsDTO;
import com.thesis.agrimanager.model.Task;
import com.thesis.agrimanager.repository.FieldRepository;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

@Service
public class StatsService {
    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;
    private final TaskRepository taskRepository;

    public StatsService(FieldRepository fieldRepository, CropRepository cropRepository, TaskRepository taskRepository) {
        this.fieldRepository = fieldRepository;
        this.cropRepository = cropRepository;
        this.taskRepository = taskRepository;
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

    @Transactional(readOnly = true)
    public FarmerStatsDTO getFarmerDashboardStats(String username) {
        List<Task> tasks = taskRepository.findForFarmerFinancials(username);
        Map<YearMonth, MutableMonthlyFinancial> monthlyFinancials = new TreeMap<>();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;

        for (Task task : tasks) {
            YearMonth month = YearMonth.from(task.getTaskDate());
            MutableMonthlyFinancial monthly = monthlyFinancials.computeIfAbsent(
                    month,
                    ignored -> new MutableMonthlyFinancial()
            );

            BigDecimal taskCost = task.getCost() == null ? BigDecimal.ZERO : task.getCost();
            totalExpenses = totalExpenses.add(taskCost);
            monthly.expenses = monthly.expenses.add(taskCost);

            BigDecimal harvestRevenue = calculateHarvestRevenue(task);
            totalRevenue = totalRevenue.add(harvestRevenue);
            monthly.revenue = monthly.revenue.add(harvestRevenue);
        }

        List<FarmerMonthlyFinancialDTO> monthlyResults = monthlyFinancials.entrySet().stream()
                .map(entry -> new FarmerMonthlyFinancialDTO(
                        entry.getKey().toString(),
                        entry.getValue().revenue,
                        entry.getValue().expenses
                ))
                .toList();

        return new FarmerStatsDTO(totalRevenue, totalExpenses, monthlyResults);
    }

    private BigDecimal calculateHarvestRevenue(Task task) {
        if (!isHarvestTask(task.getTaskType())
                || !"COMPLETED".equalsIgnoreCase(task.getStatus())
                || task.getHarvestedYieldAmount() == null
                || task.getCrop().getSellingPricePerKg() == null) {
            return BigDecimal.ZERO;
        }

        return BigDecimal.valueOf(task.getHarvestedYieldAmount())
                .multiply(task.getCrop().getSellingPricePerKg());
    }

    private boolean isHarvestTask(String taskType) {
        if (taskType == null) {
            return false;
        }
        String normalizedType = taskType.trim().toUpperCase(Locale.ROOT);
        return "HARVEST".equals(normalizedType)
                || "ΣΥΓΚΟΜΙΔΗ".equals(normalizedType)
                || "ΣΥΓΚΟΜΙΔΉ".equals(normalizedType);
    }

    private static class MutableMonthlyFinancial {
        private BigDecimal revenue = BigDecimal.ZERO;
        private BigDecimal expenses = BigDecimal.ZERO;
    }
}
