package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.AdminFieldAnalyticsDTO;
import com.thesis.agrimanager.dto.FarmerStatsDTO;
import com.thesis.agrimanager.model.Crop;
import com.thesis.agrimanager.model.Field;
import com.thesis.agrimanager.model.FinancialRecord;
import com.thesis.agrimanager.model.FinancialRecordType;
import com.thesis.agrimanager.model.Task;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.FieldRepository;
import com.thesis.agrimanager.repository.TaskRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatsServiceTest {

    @Mock
    private FieldRepository fieldRepository;

    @Mock
    private CropRepository cropRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserProfitService userProfitService;

    @Mock
    private FinancialRecordService financialRecordService;

    @Test
    void farmerStatsReturnStoredCurrentPeriodValues() {
        when(userProfitService.getSnapshot("farmer"))
                .thenReturn(new UserProfitService.FinancialSnapshot(
                        new BigDecimal("60.00"),
                        new BigDecimal("17.00"),
                        new BigDecimal("43.00"),
                        LocalDate.of(2026, 6, 1),
                        LocalDate.of(2026, 1, 1),
                        LocalDate.of(2026, 6, 30)
                ));

        FarmerStatsDTO result = service().getFarmerDashboardStats("farmer");

        assertMoney("60.00", result.totalRevenue());
        assertMoney("17.00", result.totalExpenses());
        assertMoney("43.00", result.totalProfit());
        assertEquals(LocalDate.of(2026, 6, 1), result.monthlyPeriodStart());
        assertEquals(LocalDate.of(2026, 1, 1), result.profitPeriodStart());
        assertEquals(LocalDate.of(2026, 6, 30), result.profitPeriodEnd());
    }

    @Test
    void resettingFinancialStatsReturnsUpdatedValues() {
        when(userProfitService.resetFinancialData(
                "farmer",
                UserProfitService.FinancialResetTarget.EXPENSES
        )).thenReturn(new UserProfitService.FinancialSnapshot(
                new BigDecimal("60.00"),
                BigDecimal.ZERO,
                new BigDecimal("43.00"),
                LocalDate.of(2026, 6, 1),
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 6, 30)
        ));

        FarmerStatsDTO result = service().resetFinancialStats(
                "farmer",
                UserProfitService.FinancialResetTarget.EXPENSES
        );

        assertMoney("60.00", result.totalRevenue());
        assertMoney("0.00", result.totalExpenses());
        assertMoney("43.00", result.totalProfit());
        verify(userProfitService).resetFinancialData(
                "farmer",
                UserProfitService.FinancialResetTarget.EXPENSES
        );
        verify(financialRecordService).deleteExpenseRecords("farmer");
    }

    @Test
    void resetAllFinancialStatsDeletesAllLedgerRecords() {
        when(userProfitService.resetFinancialData(
                "farmer",
                UserProfitService.FinancialResetTarget.ALL
        )).thenReturn(new UserProfitService.FinancialSnapshot(
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                LocalDate.of(2026, 6, 1),
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 6, 30)
        ));

        service().resetFinancialStats(
                "farmer",
                UserProfitService.FinancialResetTarget.ALL
        );

        verify(financialRecordService).deleteAllRecords("farmer");
    }

    @Test
    void fieldBreakdownUsesHarvestTasksForYieldAndLedgerRecordsForFinancials() {
        Field field = new Field();
        field.setId(11L);
        field.setName("Κτήμα 1");
        field.setArea(24.33);
        field.setSoilType("Αργιλώδες");
        field.setSoilPh(6.8);

        Crop crop = new Crop();
        crop.setId(21L);
        crop.setField(field);

        Task harvestTask = new Task();
        harvestTask.setCrop(crop);
        harvestTask.setTaskType("Συγκομιδή");
        harvestTask.setStatus("COMPLETED");
        harvestTask.setCompletionPercentage(100);
        harvestTask.setHarvestedYieldAmount(1000.0);

        FinancialRecord revenueRecord = financialRecord(
                field,
                FinancialRecordType.REVENUE,
                "2500.00"
        );
        FinancialRecord expenseRecord = financialRecord(
                field,
                FinancialRecordType.EXPENSE,
                "75.50"
        );

        when(fieldRepository.findByOwnerUsername("farmer")).thenReturn(List.of(field));
        when(taskRepository.findAllForFarmerProfit("farmer")).thenReturn(List.of(harvestTask));
        when(userProfitService.isCompletedHarvest(harvestTask)).thenReturn(true);
        when(financialRecordService.getRecords("farmer")).thenReturn(List.of(revenueRecord, expenseRecord));

        List<AdminFieldAnalyticsDTO> result = service().getFieldBreakdown("farmer");

        assertEquals(1, result.size());
        AdminFieldAnalyticsDTO fieldAnalytics = result.getFirst();
        assertEquals("Κτήμα 1", fieldAnalytics.fieldName());
        assertEquals(24.33, fieldAnalytics.area());
        assertEquals("Αργιλώδες", fieldAnalytics.soilType());
        assertEquals(6.8, fieldAnalytics.soilPh());
        assertEquals(1000.0, fieldAnalytics.totalYieldKg());
        assertMoney("2500.00", fieldAnalytics.fieldRevenue());
        assertMoney("75.50", fieldAnalytics.fieldExpenses());
    }

    private StatsService service() {
        return new StatsService(
                fieldRepository,
                cropRepository,
                taskRepository,
                userProfitService,
                financialRecordService
        );
    }

    private FinancialRecord financialRecord(
            Field field,
            FinancialRecordType type,
            String amount
    ) {
        FinancialRecord record = new FinancialRecord();
        record.setFieldId(field.getId());
        record.setFieldName(field.getName());
        record.setType(type);
        record.setAmount(new BigDecimal(amount));
        return record;
    }

    private void assertMoney(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual));
    }
}
