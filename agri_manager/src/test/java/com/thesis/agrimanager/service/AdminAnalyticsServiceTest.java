package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.AdminAnalyticsDTO;
import com.thesis.agrimanager.model.Crop;
import com.thesis.agrimanager.model.Field;
import com.thesis.agrimanager.model.FinancialRecord;
import com.thesis.agrimanager.model.FinancialRecordType;
import com.thesis.agrimanager.model.Task;
import com.thesis.agrimanager.model.User;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.FieldRepository;
import com.thesis.agrimanager.repository.TaskRepository;
import com.thesis.agrimanager.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAnalyticsServiceTest {

    @Mock
    private UserRepository userRepository;

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
    void globalAnalyticsReturnsSeparateMonthlyExpensesAndRevenue() {
        LocalDate today = LocalDate.now();
        Field field = field(10L, "Βόρειο Χωράφι", 12.5);
        Crop crop = crop(20L, field, today, 100.0, "2.50");
        Task task = task(30L, crop, today, "40.00");

        when(fieldRepository.findAllOwnedByFarmers()).thenReturn(List.of(field));
        when(cropRepository.findForAdminAnalytics(any(LocalDate.class), eq(today)))
                .thenReturn(List.of(crop));
        when(taskRepository.findForAdminAnalytics(any(LocalDate.class), eq(today)))
                .thenReturn(List.of(task));
        when(cropRepository.findAllOwnedByFarmers()).thenReturn(List.of(crop));
        when(taskRepository.findAllOwnedByFarmers()).thenReturn(List.of(task));
        when(userProfitService.isCompletedHarvest(task)).thenReturn(true);
        when(userProfitService.getHarvestRevenue(task)).thenReturn(new BigDecimal("250.00"));
        when(cropRepository.countOwnedByFarmers()).thenReturn(1L);
        when(taskRepository.countByStatusForFarmers("PENDING")).thenReturn(2L);
        when(taskRepository.countByStatusForFarmers("COMPLETED")).thenReturn(3L);

        AdminAnalyticsDTO result = service().getAdminAnalytics(null, "year");
        String currentMonth = YearMonth.from(today).toString();

        assertEquals(0, new BigDecimal("40.00").compareTo(result.totalExpenses()));
        assertEquals(0, new BigDecimal("250.00").compareTo(result.totalRevenue()));
        assertEquals(0, new BigDecimal("210.00").compareTo(result.netProfit()));
        assertEquals(0, new BigDecimal("40.00").compareTo(result.monthlyExpenses().get(currentMonth)));
        assertEquals(0, new BigDecimal("250.00").compareTo(result.monthlyRevenue().get(currentMonth)));
        assertEquals(1, result.fieldsBreakdown().size());
        assertEquals(12.5, result.pieChartData().get("Βόρειο Χωράφι"));
    }

    @Test
    void globalKpisIncludeFarmerDataOutsideSelectedChartRange() {
        LocalDate today = LocalDate.now();
        LocalDate oldDate = today.minusYears(2);
        Field field = field(10L, "Νότιο Χωράφι", 8.0);
        Crop oldCrop = crop(20L, field, oldDate, 50.0, "3.00");
        Task oldTask = task(30L, oldCrop, oldDate, "25.00");

        when(fieldRepository.findAllOwnedByFarmers()).thenReturn(List.of(field));
        when(cropRepository.findForAdminAnalytics(any(LocalDate.class), eq(today)))
                .thenReturn(List.of());
        when(taskRepository.findForAdminAnalytics(any(LocalDate.class), eq(today)))
                .thenReturn(List.of());
        when(cropRepository.findAllOwnedByFarmers()).thenReturn(List.of(oldCrop));
        when(taskRepository.findAllOwnedByFarmers()).thenReturn(List.of(oldTask));
        when(userProfitService.isCompletedHarvest(oldTask)).thenReturn(true);
        when(userProfitService.getHarvestRevenue(oldTask)).thenReturn(new BigDecimal("150.00"));

        AdminAnalyticsDTO result = service().getAdminAnalytics(null, "year");

        assertEquals(0, new BigDecimal("25.00").compareTo(result.totalExpenses()));
        assertEquals(0, new BigDecimal("150.00").compareTo(result.totalRevenue()));
        assertEquals(0, new BigDecimal("125.00").compareTo(result.netProfit()));
        assertEquals(50.0, result.totalYieldKg());
        assertEquals(
                0,
                BigDecimal.ZERO.compareTo(result.monthlyExpenses().get(YearMonth.from(today).toString()))
        );
    }

    @Test
    void globalAnalyticsIgnoresCropHarvestWhenHarvestTaskWasDeleted() {
        LocalDate today = LocalDate.now();
        Field field = field(10L, "ΚΤΗΜΑ 3", 216.29);
        Crop cropWithHistoricalHarvest = crop(20L, field, today, 1200.0, "3.00");

        when(fieldRepository.findAllOwnedByFarmers()).thenReturn(List.of(field));
        when(cropRepository.findForAdminAnalytics(any(LocalDate.class), eq(today)))
                .thenReturn(List.of(cropWithHistoricalHarvest));
        when(taskRepository.findForAdminAnalytics(any(LocalDate.class), eq(today)))
                .thenReturn(List.of());
        when(cropRepository.findAllOwnedByFarmers()).thenReturn(List.of(cropWithHistoricalHarvest));
        when(taskRepository.findAllOwnedByFarmers()).thenReturn(List.of());

        AdminAnalyticsDTO result = service().getAdminAnalytics(null, "year");

        assertEquals(0, BigDecimal.ZERO.compareTo(result.totalRevenue()));
        assertEquals(0.0, result.totalYieldKg());
        assertEquals(0, BigDecimal.ZERO.compareTo(
                result.monthlyRevenue().get(YearMonth.from(today).toString())
        ));
        assertEquals(0, BigDecimal.ZERO.compareTo(
                result.fieldsBreakdown().get(0).fieldRevenue()
        ));
    }

    @Test
    void individualAnalyticsUsesFarmerFilteredQueries() {
        Long farmerId = 7L;
        User farmer = new User();
        farmer.setUsername("farmer");
        when(userRepository.findFarmerById(farmerId)).thenReturn(Optional.of(farmer));
        when(fieldRepository.findOwnedByFarmerId(farmerId)).thenReturn(List.of());
        when(cropRepository.findAllOwnedByFarmerId(farmerId)).thenReturn(List.of());
        when(cropRepository.findForAdminAnalyticsByOwnerId(
                eq(farmerId),
                any(LocalDate.class),
                any(LocalDate.class)
        )).thenReturn(List.of());
        when(taskRepository.findForAdminAnalyticsByOwnerId(
                eq(farmerId),
                any(LocalDate.class),
                any(LocalDate.class)
        )).thenReturn(List.of());
        when(financialRecordService.getRecords(eq(farmerId), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());
        when(userProfitService.getSnapshot("farmer")).thenReturn(snapshot(
                "0.00",
                "0.00",
                "0.00"
        ));

        service().getAdminAnalytics(farmerId, "month");

        verify(fieldRepository).findOwnedByFarmerId(farmerId);
        verify(cropRepository).findAllOwnedByFarmerId(farmerId);
        verify(cropRepository).countByFieldOwnerId(farmerId);
        verify(taskRepository).countByStatusAndCropFieldOwnerId("PENDING", farmerId);
        verify(taskRepository).countByStatusAndCropFieldOwnerId("COMPLETED", farmerId);
    }

    @Test
    void individualAnalyticsUsesStoredFarmerFinancialSnapshotAndAllCropsForProduction() {
        Long farmerId = 7L;
        User farmer = new User();
        farmer.setUsername("farmer");
        Field field = field(10L, "ΚΤΗΜΑ 3", 216.29);
        Crop cropWithoutPlantingDate = crop(20L, field, null, 1200.0, "3.00");
        Task existingTask = task(30L, cropWithoutPlantingDate, LocalDate.now(), "60.00");

        when(userRepository.findFarmerById(farmerId)).thenReturn(Optional.of(farmer));
        when(fieldRepository.findOwnedByFarmerId(farmerId)).thenReturn(List.of(field));
        when(cropRepository.findForAdminAnalyticsByOwnerId(
                eq(farmerId),
                any(LocalDate.class),
                any(LocalDate.class)
        )).thenReturn(List.of());
        when(taskRepository.findForAdminAnalyticsByOwnerId(
                eq(farmerId),
                any(LocalDate.class),
                any(LocalDate.class)
        )).thenReturn(List.of(existingTask));
        when(cropRepository.findAllOwnedByFarmerId(farmerId))
                .thenReturn(List.of(cropWithoutPlantingDate));
        when(cropRepository.countByFieldOwnerId(farmerId)).thenReturn(1L);
        when(taskRepository.countByStatusAndCropFieldOwnerId("PENDING", farmerId)).thenReturn(0L);
        when(taskRepository.countByStatusAndCropFieldOwnerId("COMPLETED", farmerId)).thenReturn(2L);
        when(financialRecordService.getRecords(eq(farmerId), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());
        when(userProfitService.getSnapshot("farmer")).thenReturn(snapshot(
                "3600.00",
                "108.00",
                "3492.00"
        ));

        AdminAnalyticsDTO result = service().getAdminAnalytics(farmerId, "year");

        assertEquals(0, new BigDecimal("108.00").compareTo(result.totalExpenses()));
        assertEquals(0, new BigDecimal("3600.00").compareTo(result.totalRevenue()));
        assertEquals(0, new BigDecimal("3492.00").compareTo(result.netProfit()));
        assertEquals(1200.0, result.totalYieldKg());
        assertEquals(0, BigDecimal.ZERO.compareTo(
                result.fieldsBreakdown().get(0).fieldRevenue()
        ));
    }

    @Test
    void individualAnalyticsDoesNotDoubleCountTaskExpensesWhenFinancialRecordsExist() {
        Long farmerId = 7L;
        LocalDate today = LocalDate.now();
        String currentMonth = YearMonth.from(today).toString();
        User farmer = new User();
        farmer.setUsername("farmer");
        Field field = field(10L, "ΚΤΗΜΑ 1", 24.33);
        Crop crop = crop(20L, field, today, 1000.0, "3.00");
        Task task = task(30L, crop, today, "36.00");
        FinancialRecord expense = financialRecord(
                field,
                FinancialRecordType.EXPENSE,
                "36.00",
                today
        );
        FinancialRecord revenue = financialRecord(
                field,
                FinancialRecordType.REVENUE,
                "3000.00",
                today
        );
        revenue.setQuantityKg(1000.0);

        when(userRepository.findFarmerById(farmerId)).thenReturn(Optional.of(farmer));
        when(fieldRepository.findOwnedByFarmerId(farmerId)).thenReturn(List.of(field));
        when(cropRepository.findForAdminAnalyticsByOwnerId(
                eq(farmerId),
                any(LocalDate.class),
                any(LocalDate.class)
        )).thenReturn(List.of(crop));
        when(taskRepository.findForAdminAnalyticsByOwnerId(
                eq(farmerId),
                any(LocalDate.class),
                any(LocalDate.class)
        )).thenReturn(List.of(task));
        when(cropRepository.findAllOwnedByFarmerId(farmerId)).thenReturn(List.of(crop));
        when(financialRecordService.getRecords(eq(farmerId), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(expense, revenue));
        when(userProfitService.getSnapshot("farmer")).thenReturn(snapshot(
                "3000.00",
                "36.00",
                "2964.00"
        ));

        AdminAnalyticsDTO result = service().getAdminAnalytics(farmerId, "year");

        assertEquals(0, new BigDecimal("36.00").compareTo(result.monthlyExpenses().get(currentMonth)));
        assertEquals(0, new BigDecimal("3000.00").compareTo(result.monthlyRevenue().get(currentMonth)));
        assertEquals(0, new BigDecimal("36.00").compareTo(
                result.fieldsBreakdown().get(0).fieldExpenses()
        ));
        assertEquals(0, new BigDecimal("3000.00").compareTo(
                result.fieldsBreakdown().get(0).fieldRevenue()
        ));
    }

    private AdminAnalyticsService service() {
        return new AdminAnalyticsService(
                userRepository,
                fieldRepository,
                cropRepository,
                taskRepository,
                userProfitService,
                financialRecordService
        );
    }

    private UserProfitService.FinancialSnapshot snapshot(
            String revenue,
            String expenses,
            String profit
    ) {
        LocalDate monthStart = LocalDate.now().withDayOfMonth(1);
        LocalDate profitStart = LocalDate.of(LocalDate.now().getYear(), 1, 1);
        return new UserProfitService.FinancialSnapshot(
                new BigDecimal(revenue),
                new BigDecimal(expenses),
                new BigDecimal(profit),
                monthStart,
                profitStart,
                profitStart.plusMonths(6).minusDays(1)
        );
    }

    private Field field(Long id, String name, Double area) {
        Field field = new Field();
        field.setId(id);
        field.setName(name);
        field.setArea(area);
        field.setSoilType("Αργιλώδες");
        field.setSoilPh(6.8);
        return field;
    }

    private Crop crop(
            Long id,
            Field field,
            LocalDate plantingDate,
            Double harvestYield,
            String sellingPrice
    ) {
        Crop crop = new Crop();
        crop.setId(id);
        crop.setField(field);
        crop.setPlantingDate(plantingDate);
        crop.setHarvestYield(harvestYield);
        crop.setSellingPricePerKg(new BigDecimal(sellingPrice));
        return crop;
    }

    private Task task(Long id, Crop crop, LocalDate taskDate, String cost) {
        Task task = new Task();
        task.setId(id);
        task.setCrop(crop);
        task.setTaskDate(taskDate);
        task.setCost(new BigDecimal(cost));
        task.setStatus("COMPLETED");
        task.setCompletionPercentage(100);
        task.setTaskType("Συγκομιδή");
        task.setHarvestedYieldAmount(crop.getHarvestYield());
        return task;
    }

    private FinancialRecord financialRecord(
            Field field,
            FinancialRecordType type,
            String amount,
            LocalDate recordDate
    ) {
        FinancialRecord record = new FinancialRecord();
        record.setFieldId(field.getId());
        record.setFieldName(field.getName());
        record.setType(type);
        record.setAmount(new BigDecimal(amount));
        record.setRecordDate(recordDate);
        return record;
    }
}
