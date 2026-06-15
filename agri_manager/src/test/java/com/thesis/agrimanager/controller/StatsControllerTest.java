package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.FarmerStatsDTO;
import com.thesis.agrimanager.service.StatsService;
import com.thesis.agrimanager.service.UserProfitService;
import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatsControllerTest {

    @Mock
    private StatsService statsService;

    @Test
    void resetsFinancialDataForAuthenticatedUser() {
        Principal principal = () -> "farmer";
        FarmerStatsDTO expected = new FarmerStatsDTO(
                new BigDecimal("60.00"),
                BigDecimal.ZERO,
                new BigDecimal("45.00"),
                LocalDate.of(2026, 6, 1),
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 6, 30)
        );
        when(statsService.resetFinancialStats(
                "farmer",
                UserProfitService.FinancialResetTarget.EXPENSES
        )).thenReturn(expected);

        FarmerStatsDTO result = new StatsController(statsService).resetFinancialStats(
                UserProfitService.FinancialResetTarget.EXPENSES,
                principal
        );

        assertSame(expected, result);
        verify(statsService).resetFinancialStats(
                "farmer",
                UserProfitService.FinancialResetTarget.EXPENSES
        );
    }
}
