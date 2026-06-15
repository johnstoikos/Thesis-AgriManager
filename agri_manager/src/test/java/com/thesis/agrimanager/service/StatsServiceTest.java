package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.FarmerStatsDTO;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.FieldRepository;
import com.thesis.agrimanager.repository.TaskRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
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

        assertMoney("60.00", result.getTotalRevenue());
        assertMoney("17.00", result.getTotalExpenses());
        assertMoney("43.00", result.getTotalProfit());
        assertEquals(LocalDate.of(2026, 6, 1), result.getMonthlyPeriodStart());
        assertEquals(LocalDate.of(2026, 1, 1), result.getProfitPeriodStart());
        assertEquals(LocalDate.of(2026, 6, 30), result.getProfitPeriodEnd());
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

        assertMoney("60.00", result.getTotalRevenue());
        assertMoney("0.00", result.getTotalExpenses());
        assertMoney("43.00", result.getTotalProfit());
        verify(userProfitService).resetFinancialData(
                "farmer",
                UserProfitService.FinancialResetTarget.EXPENSES
        );
    }

    private StatsService service() {
        return new StatsService(fieldRepository, cropRepository, taskRepository, userProfitService);
    }

    private void assertMoney(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual));
    }
}
