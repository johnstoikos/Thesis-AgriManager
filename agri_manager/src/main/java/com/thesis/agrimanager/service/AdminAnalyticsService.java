package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.AdminAnalyticsDTO;
import com.thesis.agrimanager.dto.AdminFieldAnalyticsDTO;
import com.thesis.agrimanager.model.Crop;
import com.thesis.agrimanager.model.Field;
import com.thesis.agrimanager.model.Task;
import com.thesis.agrimanager.model.User;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.FieldRepository;
import com.thesis.agrimanager.repository.TaskRepository;
import com.thesis.agrimanager.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminAnalyticsService {
    private final UserRepository userRepository;
    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;
    private final TaskRepository taskRepository;
    private final UserProfitService userProfitService;

    public AdminAnalyticsService(
            UserRepository userRepository,
            FieldRepository fieldRepository,
            CropRepository cropRepository,
            TaskRepository taskRepository,
            UserProfitService userProfitService
    ) {
        this.userRepository = userRepository;
        this.fieldRepository = fieldRepository;
        this.cropRepository = cropRepository;
        this.taskRepository = taskRepository;
        this.userProfitService = userProfitService;
    }

    @Transactional
    public AdminAnalyticsDTO getAdminAnalytics(Long userId, String timeRange) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = calculateStartDate(endDate, timeRange);

        User selectedFarmer = userId == null
                ? null
                : userRepository.findFarmerById(userId)
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Ο αγρότης με ID " + userId + " δεν βρέθηκε."
                        ));

        List<Field> fields = userId == null
                ? fieldRepository.findAllOwnedByFarmers()
                : fieldRepository.findOwnedByFarmerId(userId);
        List<Crop> periodCrops = userId == null
                ? cropRepository.findForAdminAnalytics(startDate, endDate)
                : cropRepository.findForAdminAnalyticsByOwnerId(userId, startDate, endDate);
        List<Task> periodTasks = userId == null
                ? taskRepository.findForAdminAnalytics(startDate, endDate)
                : taskRepository.findForAdminAnalyticsByOwnerId(userId, startDate, endDate);
        List<Crop> cropsForTotals = userId == null
                ? cropRepository.findAllOwnedByFarmers()
                : cropRepository.findAllOwnedByFarmerId(userId);
        List<Crop> cropsForFieldBreakdown = userId == null ? List.of() : cropsForTotals;
        List<Task> tasksForTotals = userId == null
                ? taskRepository.findAllOwnedByFarmers()
                : periodTasks;
        long totalCropsCount = userId == null
                ? cropRepository.countOwnedByFarmers()
                : cropRepository.countByFieldOwnerId(userId);
        long pendingTasksCount = userId == null
                ? taskRepository.countByStatusForFarmers("PENDING")
                : taskRepository.countByStatusAndCropFieldOwnerId("PENDING", userId);
        long completedTasksCount = userId == null
                ? taskRepository.countByStatusForFarmers("COMPLETED")
                : taskRepository.countByStatusAndCropFieldOwnerId("COMPLETED", userId);

        Map<Long, MutableFieldAnalytics> fieldsById = new LinkedHashMap<>();
        fields.stream()
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

        Map<String, BigDecimal> monthlyExpenses = initializeMonthlySeries(startDate, endDate);
        Map<String, BigDecimal> monthlyRevenue = initializeMonthlySeries(startDate, endDate);
        Map<String, Double> pieChartData = new LinkedHashMap<>();
        double totalAreaStremmata = 0.0;
        for (MutableFieldAnalytics field : fieldsById.values()) {
            totalAreaStremmata += field.area;
            pieChartData.merge(field.name, field.area, Double::sum);
        }

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;
        BigDecimal netProfit;
        double totalYieldKg = 0.0;

        if (selectedFarmer == null) {
            for (Task task : tasksForTotals) {
                if (!userProfitService.isCompletedHarvest(task)) {
                    continue;
                }
                double harvestedYield = task.getHarvestedYieldAmount() == null
                        ? 0.0
                        : task.getHarvestedYieldAmount();
                totalYieldKg += harvestedYield;
                totalRevenue = totalRevenue.add(userProfitService.getHarvestRevenue(task));
            }
        } else {
            for (Crop crop : cropsForTotals) {
                double cropYield = crop.getHarvestYield() == null ? 0.0 : crop.getHarvestYield();
                BigDecimal cropRevenue = calculateRevenue(cropYield, crop.getSellingPricePerKg());
                totalYieldKg += cropYield;
                totalRevenue = totalRevenue.add(cropRevenue);
            }
        }

        for (Task task : tasksForTotals) {
            BigDecimal taskCost = task.getCost() == null ? BigDecimal.ZERO : task.getCost();
            totalExpenses = totalExpenses.add(taskCost);
        }

        for (Crop crop : cropsForFieldBreakdown) {
            double cropYield = crop.getHarvestYield() == null ? 0.0 : crop.getHarvestYield();
            BigDecimal cropRevenue = calculateRevenue(cropYield, crop.getSellingPricePerKg());
            MutableFieldAnalytics fieldAnalytics = fieldsById.get(crop.getField().getId());
            if (fieldAnalytics != null) {
                fieldAnalytics.totalYieldKg += cropYield;
                fieldAnalytics.revenue = fieldAnalytics.revenue.add(cropRevenue);
            }

            addToMonth(monthlyRevenue, crop.getPlantingDate(), cropRevenue);
        }

        for (Task task : periodTasks) {
            BigDecimal taskCost = task.getCost() == null ? BigDecimal.ZERO : task.getCost();

            MutableFieldAnalytics fieldAnalytics = fieldsById.get(task.getCrop().getField().getId());
            if (fieldAnalytics != null) {
                fieldAnalytics.expenses = fieldAnalytics.expenses.add(taskCost);
                if (selectedFarmer == null && userProfitService.isCompletedHarvest(task)) {
                    double harvestedYield = task.getHarvestedYieldAmount() == null
                            ? 0.0
                            : task.getHarvestedYieldAmount();
                    BigDecimal harvestRevenue = userProfitService.getHarvestRevenue(task);
                    fieldAnalytics.totalYieldKg += harvestedYield;
                    fieldAnalytics.revenue = fieldAnalytics.revenue.add(harvestRevenue);
                }
            }

            addToMonth(monthlyExpenses, task.getTaskDate(), taskCost);
            if (selectedFarmer == null && userProfitService.isCompletedHarvest(task)) {
                addToMonth(monthlyRevenue, task.getTaskDate(), userProfitService.getHarvestRevenue(task));
            }
        }

        if (selectedFarmer != null) {
            UserProfitService.FinancialSnapshot snapshot = userProfitService.getSnapshot(
                    selectedFarmer.getUsername()
            );
            totalRevenue = snapshot.monthlyRevenue();
            totalExpenses = snapshot.monthlyExpenses();
            netProfit = snapshot.semesterProfit();

            monthlyExpenses.replaceAll((ignored, amount) -> BigDecimal.ZERO);
            monthlyRevenue.replaceAll((ignored, amount) -> BigDecimal.ZERO);
            addToMonth(monthlyExpenses, snapshot.monthlyPeriodStart(), snapshot.monthlyExpenses());
            addToMonth(monthlyRevenue, snapshot.monthlyPeriodStart(), snapshot.monthlyRevenue());
        } else {
            netProfit = totalRevenue.subtract(totalExpenses);
        }

        List<AdminFieldAnalyticsDTO> fieldsBreakdown = fieldsById.values().stream()
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

        return new AdminAnalyticsDTO(
                totalExpenses,
                totalRevenue,
                netProfit,
                (long) fields.size(),
                totalAreaStremmata,
                totalCropsCount,
                pendingTasksCount,
                completedTasksCount,
                totalYieldKg,
                monthlyExpenses,
                monthlyRevenue,
                fieldsBreakdown,
                pieChartData
        );
    }

    private LocalDate calculateStartDate(LocalDate endDate, String timeRange) {
        String normalizedRange = timeRange == null || timeRange.isBlank() ? "year" : timeRange;
        return switch (normalizedRange) {
            case "month" -> endDate.minusMonths(1);
            case "six_months" -> endDate.minusMonths(6);
            case "year" -> endDate.minusYears(1);
            default -> throw new IllegalArgumentException(
                    "Μη έγκυρο χρονικό διάστημα. Επιτρεπτές τιμές: month, six_months, year."
            );
        };
    }

    private Map<String, BigDecimal> initializeMonthlySeries(LocalDate startDate, LocalDate endDate) {
        Map<String, BigDecimal> monthlySeries = new LinkedHashMap<>();
        YearMonth currentMonth = YearMonth.from(startDate);
        YearMonth lastMonth = YearMonth.from(endDate);

        while (!currentMonth.isAfter(lastMonth)) {
            monthlySeries.put(currentMonth.toString(), BigDecimal.ZERO);
            currentMonth = currentMonth.plusMonths(1);
        }

        return monthlySeries;
    }

    private void addToMonth(
            Map<String, BigDecimal> monthlySeries,
            LocalDate date,
            BigDecimal amount
    ) {
        if (date == null || amount == null) {
            return;
        }

        String month = YearMonth.from(date).toString();
        monthlySeries.computeIfPresent(
                month,
                (ignored, currentAmount) -> currentAmount.add(amount)
        );
    }

    private BigDecimal calculateRevenue(double harvestYield, BigDecimal sellingPricePerKg) {
        if (harvestYield <= 0 || sellingPricePerKg == null) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(harvestYield).multiply(sellingPricePerKg);
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
