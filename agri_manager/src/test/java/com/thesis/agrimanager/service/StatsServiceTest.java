package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.FarmerStatsDTO;
import com.thesis.agrimanager.model.Crop;
import com.thesis.agrimanager.model.Task;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.FieldRepository;
import com.thesis.agrimanager.repository.TaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatsServiceTest {

    @Mock
    private FieldRepository fieldRepository;

    @Mock
    private CropRepository cropRepository;

    @Mock
    private TaskRepository taskRepository;

    @Test
    void farmerStatsGroupExpensesAndCompletedHarvestRevenueByMonth() {
        Task irrigation = task(
                "Πότισμα",
                "COMPLETED",
                LocalDate.of(2026, 1, 5),
                "10.00",
                null,
                null
        );
        Task completedHarvest = task(
                "Συγκομιδή",
                "COMPLETED",
                LocalDate.of(2026, 1, 20),
                "5.00",
                20.0,
                "3.00"
        );
        Task pendingHarvest = task(
                "HARVEST",
                "PENDING",
                LocalDate.of(2026, 2, 10),
                "2.00",
                10.0,
                "4.00"
        );
        when(taskRepository.findForFarmerFinancials("farmer"))
                .thenReturn(List.of(irrigation, completedHarvest, pendingHarvest));

        FarmerStatsDTO result = service().getFarmerDashboardStats("farmer");

        assertEquals(0, new BigDecimal("60.00").compareTo(result.getTotalRevenue()));
        assertEquals(0, new BigDecimal("17.00").compareTo(result.getTotalExpenses()));
        assertEquals(2, result.getMonthlyFinancials().size());
        assertEquals("2026-01", result.getMonthlyFinancials().get(0).getMonth());
        assertEquals(
                0,
                new BigDecimal("60.00").compareTo(result.getMonthlyFinancials().get(0).getRevenue())
        );
        assertEquals(
                0,
                new BigDecimal("15.00").compareTo(result.getMonthlyFinancials().get(0).getExpenses())
        );
        assertEquals("2026-02", result.getMonthlyFinancials().get(1).getMonth());
        assertEquals(
                0,
                BigDecimal.ZERO.compareTo(result.getMonthlyFinancials().get(1).getRevenue())
        );
        assertEquals(
                0,
                new BigDecimal("2.00").compareTo(result.getMonthlyFinancials().get(1).getExpenses())
        );
    }

    private StatsService service() {
        return new StatsService(fieldRepository, cropRepository, taskRepository);
    }

    private Task task(
            String taskType,
            String status,
            LocalDate taskDate,
            String cost,
            Double harvestedYield,
            String sellingPrice
    ) {
        Crop crop = new Crop();
        if (sellingPrice != null) {
            crop.setSellingPricePerKg(new BigDecimal(sellingPrice));
        }

        Task task = new Task();
        task.setTaskType(taskType);
        task.setStatus(status);
        task.setTaskDate(taskDate);
        task.setCost(new BigDecimal(cost));
        task.setHarvestedYieldAmount(harvestedYield);
        task.setCrop(crop);
        return task;
    }
}
