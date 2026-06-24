package com.thesis.agrimanager.service;

import com.thesis.agrimanager.model.Crop;
import com.thesis.agrimanager.model.Task;
import com.thesis.agrimanager.model.User;
import com.thesis.agrimanager.repository.TaskRepository;
import com.thesis.agrimanager.repository.UserRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserProfitServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 6, 14);
    private static final Clock CLOCK = Clock.fixed(
            Instant.parse("2026-06-14T12:00:00Z"),
            ZoneOffset.UTC
    );

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskRepository taskRepository;

    // Ελέγχει σενάριο δοκιμής.
    @Test
    void initializesCurrentPeriodsFromExistingTasks() {
        User user = user("farmer", null);
        Task harvest = task("Συγκομιδή", "COMPLETED", "5.00", LocalDate.of(2026, 6, 5));
        harvest.setCompletionPercentage(100);
        harvest.setHarvestedYieldAmount(20.0);
        harvest.getCrop().setSellingPricePerKg(new BigDecimal("3.00"));
        Task spraying = task("Ψεκασμός", "PENDING", "10.00", LocalDate.of(2026, 6, 10));

        when(userRepository.findByUsernameForFinancialUpdate("farmer"))
                .thenReturn(Optional.of(user));
        when(taskRepository.findAllForFarmerProfit("farmer"))
                .thenReturn(List.of(harvest, spraying));

        UserProfitService.FinancialSnapshot result = service().getSnapshot("farmer");

        assertMoney("60.00", result.monthlyRevenue());
        assertMoney("15.00", result.monthlyExpenses());
        assertMoney("45.00", result.semesterProfit());
        assertEquals(LocalDate.of(2026, 6, 1), result.monthlyPeriodStart());
        assertEquals(LocalDate.of(2026, 1, 1), result.profitPeriodStart());
        assertMoney("60.00", harvest.getBookedRevenue());
        verify(userRepository).save(user);
    }

    // Ελέγχει σενάριο δοκιμής.
    @Test
    void recordsRevenueAndExpenseInCurrentPeriods() {
        User user = initializedUser("farmer", "10.00", "20.00", "-10.00");
        when(userRepository.findByUsernameForFinancialUpdate("farmer"))
                .thenReturn(Optional.of(user));

        UserProfitService.FinancialSnapshot result = service().recordTask(
                user,
                new BigDecimal("25.50"),
                new BigDecimal("5.00")
        );

        assertMoney("35.50", result.monthlyRevenue());
        assertMoney("25.00", result.monthlyExpenses());
        assertMoney("10.50", result.semesterProfit());
    }

    // Ελέγχει σενάριο δοκιμής.
    @Test
    void deletingTasksDoesNotChangeFinancialValues() {
        User user = initializedUser("farmer", "60.00", "15.00", "45.00");
        Task completedHarvest = task("HARVEST", "COMPLETED", "5.00", TODAY);
        Task pendingTask = task("Ψεκασμός", "PENDING", "10.00", TODAY);
        when(userRepository.findByUsernameForFinancialUpdate("farmer"))
                .thenReturn(Optional.of(user));

        service().preserveFinancialsAfterDeletion(user);

        assertMoney("60.00", user.getMonthlyRevenue());
        assertMoney("15.00", user.getMonthlyExpenses());
        assertMoney("45.00", user.getTotalProfit());
        verify(userRepository).save(user);
    }

    // Ελέγχει σενάριο δοκιμής.
    @Test
    void resetsMonthlyAndSemesterValuesWhenPeriodsChange() {
        User user = initializedUser("farmer", "60.00", "15.00", "45.00");
        user.setMonthlyFinancialPeriodStart(LocalDate.of(2026, 5, 1));
        user.setProfitPeriodStart(LocalDate.of(2025, 7, 1));
        when(userRepository.findByUsernameForFinancialUpdate("farmer"))
                .thenReturn(Optional.of(user));

        UserProfitService.FinancialSnapshot result = service().getSnapshot("farmer");

        assertMoney("0.00", result.monthlyRevenue());
        assertMoney("0.00", result.monthlyExpenses());
        assertMoney("0.00", result.semesterProfit());
        assertEquals(LocalDate.of(2026, 6, 1), result.monthlyPeriodStart());
        assertEquals(LocalDate.of(2026, 1, 1), result.profitPeriodStart());
    }

    // Ελέγχει σενάριο δοκιμής.
    @Test
    void resetsOnlySelectedFinancialValue() {
        User user = initializedUser("farmer", "60.00", "15.00", "45.00");
        when(userRepository.findByUsernameForFinancialUpdate("farmer"))
                .thenReturn(Optional.of(user));

        UserProfitService.FinancialSnapshot result = service().resetFinancialData(
                "farmer",
                UserProfitService.FinancialResetTarget.REVENUE
        );

        assertMoney("0.00", result.monthlyRevenue());
        assertMoney("15.00", result.monthlyExpenses());
        assertMoney("45.00", result.semesterProfit());
        verify(userRepository).save(user);
    }

    // Ελέγχει σενάριο δοκιμής.
    @Test
    void resetsAllFinancialValuesTogether() {
        User user = initializedUser("farmer", "60.00", "15.00", "45.00");
        when(userRepository.findByUsernameForFinancialUpdate("farmer"))
                .thenReturn(Optional.of(user));

        UserProfitService.FinancialSnapshot result = service().resetFinancialData(
                "farmer",
                UserProfitService.FinancialResetTarget.ALL
        );

        assertMoney("0.00", result.monthlyRevenue());
        assertMoney("0.00", result.monthlyExpenses());
        assertMoney("0.00", result.semesterProfit());
        verify(userRepository).save(user);
    }

    // Δημιουργεί δεδομένα δοκιμής.
    private UserProfitService service() {
        return new UserProfitService(userRepository, taskRepository, CLOCK);
    }

    // Δημιουργεί δεδομένα δοκιμής.
    private User user(String username, String totalProfit) {
        User user = new User();
        user.setUsername(username);
        if (totalProfit != null) {
            user.setTotalProfit(new BigDecimal(totalProfit));
        }
        return user;
    }

    // Δημιουργεί δεδομένα δοκιμής.
    private User initializedUser(
            String username,
            String monthlyRevenue,
            String monthlyExpenses,
            String totalProfit
    ) {
        User user = user(username, totalProfit);
        user.setMonthlyRevenue(new BigDecimal(monthlyRevenue));
        user.setMonthlyExpenses(new BigDecimal(monthlyExpenses));
        user.setMonthlyFinancialPeriodStart(LocalDate.of(2026, 6, 1));
        user.setProfitPeriodStart(LocalDate.of(2026, 1, 1));
        return user;
    }

    // Δημιουργεί δεδομένα δοκιμής.
    private Task task(String type, String status, String cost, LocalDate taskDate) {
        Crop crop = new Crop();
        Task task = new Task();
        task.setTaskType(type);
        task.setStatus(status);
        task.setCost(new BigDecimal(cost));
        task.setTaskDate(taskDate);
        task.setCrop(crop);
        return task;
    }

    // Ελέγχει αναμενόμενη τιμή.
    private void assertMoney(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual));
    }
}
