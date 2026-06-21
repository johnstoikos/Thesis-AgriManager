package com.thesis.agrimanager.service;

import com.thesis.agrimanager.model.Crop;
import com.thesis.agrimanager.model.Field;
import com.thesis.agrimanager.model.Task;
import com.thesis.agrimanager.model.User;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.TaskRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private CropRepository cropRepository;

    @Mock
    private UserProfitService userProfitService;

    @Mock
    private FinancialRecordService financialRecordService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void completingHarvestAddsYieldOnlyOnce() {
        Task task = harvestTask(40, null);
        TaskService taskService = serviceFor(task);
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var updatedTask = taskService.updateTaskProgress(task.getId(), 100, 25.5);
        taskService.updateTaskProgress(task.getId(), 100, 25.5);

        assertEquals(100, task.getCompletionPercentage());
        assertEquals("COMPLETED", task.getStatus());
        assertEquals(25.5, task.getHarvestedYieldAmount());
        assertEquals(125.5, task.getCrop().getHarvestYield());
        assertEquals(0, new BigDecimal("41.00").compareTo(updatedTask.getNetHarvestProfit()));
        verify(cropRepository).save(task.getCrop());
        verify(userProfitService).recordRevenue(
                task.getCrop().getField().getOwner(),
                new BigDecimal("51.000")
        );
    }

    @Test
    void completingHarvestWithoutYieldIsRejected() {
        Task task = harvestTask(80, null);
        TaskService taskService = serviceFor(task);

        assertThrows(
                IllegalArgumentException.class,
                () -> taskService.updateTaskProgress(task.getId(), 100, null)
        );

        assertEquals(80, task.getCompletionPercentage());
        assertEquals(100.0, task.getCrop().getHarvestYield());
        verify(cropRepository, never()).save(any(Crop.class));
        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    void completingHarvestWithoutSellingPriceIsRejected() {
        Task task = harvestTask(80, 25.5);
        task.getCrop().setSellingPricePerKg(null);
        TaskService taskService = serviceFor(task);

        assertThrows(
                IllegalArgumentException.class,
                () -> taskService.updateTaskProgress(task.getId(), 100, null)
        );

        assertEquals(100.0, task.getCrop().getHarvestYield());
        verify(cropRepository, never()).save(any(Crop.class));
        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    void deletingCompletedHarvestPreservesCropYieldAndSellingPrice() {
        Task task = harvestTask(100, 25.5);
        task.setStatus("COMPLETED");
        TaskService taskService = new TaskService(
                taskRepository,
                cropRepository,
                userProfitService,
                financialRecordService
        );
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        doAnswer(invocation -> {
            task.getCrop().setHarvestYield(
                    task.getCrop().getHarvestYield() - task.getHarvestedYieldAmount()
            );
            task.getCrop().setSellingPricePerKg(BigDecimal.ZERO);
            return null;
        }).when(taskRepository).delete(task);

        taskService.deleteTask(task.getId(), "farmer");

        assertEquals(100.0, task.getCrop().getHarvestYield());
        assertEquals(0, new BigDecimal("2.00").compareTo(task.getCrop().getSellingPricePerKg()));
        verify(taskRepository).delete(task);
        verify(cropRepository, never()).save(any(Crop.class));
        verify(userProfitService).preserveFinancialsAfterDeletion(
                task.getCrop().getField().getOwner()
        );
    }

    @Test
    void creatingTaskForAnotherFarmersCropIsRejectedBeforeProfitChanges() {
        Task task = harvestTask(0, null);
        task.getCrop().getField().getOwner().setUsername("other-farmer");
        TaskService taskService = serviceForAuthentication("farmer");
        when(cropRepository.findById(task.getCrop().getId())).thenReturn(Optional.of(task.getCrop()));

        assertThrows(
                RuntimeException.class,
                () -> taskService.saveTask(new com.thesis.agrimanager.dto.TaskDTO(
                        null,
                        "Ψεκασμός",
                        "",
                        java.time.LocalDate.now(),
                        "PENDING",
                        0,
                        null,
                        null,
                        null,
                        new BigDecimal("10.00"),
                        1.0,
                        null,
                        task.getCrop().getId()
                ))
        );

        verify(userProfitService, never()).ensureInitialized(any(String.class));
        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    void creatingTaskCalculatesTotalCostFromHourlyCostAndLaborHours() {
        Task template = harvestTask(0, null);
        TaskService taskService = serviceForAuthentication("farmer");
        when(cropRepository.findById(template.getCrop().getId()))
                .thenReturn(Optional.of(template.getCrop()));
        when(taskRepository.save(any(Task.class)))
                .thenAnswer(invocation -> {
                    Task saved = invocation.getArgument(0);
                    saved.setId(30L);
                    return saved;
                });

        var result = taskService.saveTask(new com.thesis.agrimanager.dto.TaskDTO(
                null,
                "Ψεκασμός",
                "",
                java.time.LocalDate.now(),
                "PENDING",
                0,
                null,
                null,
                null,
                new BigDecimal("12.50"),
                3.0,
                null,
                template.getCrop().getId()
        ));

        assertEquals(0, new BigDecimal("12.50").compareTo(result.getHourlyCost()));
        assertEquals(0, new BigDecimal("37.50").compareTo(result.getCost()));
        verify(userProfitService).recordTask(
                template.getCrop().getField().getOwner(),
                BigDecimal.ZERO,
                new BigDecimal("37.50")
        );
    }

    private TaskService serviceFor(Task task) {
        TaskService service = serviceForAuthentication("farmer");
        when(taskRepository.findByIdForProgressUpdate(task.getId())).thenReturn(Optional.of(task));
        return service;
    }

    private TaskService serviceForAuthentication(String username) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(username, null)
        );
        org.mockito.Mockito.lenient()
                .when(userProfitService.bookHarvestRevenue(any(Task.class)))
                .thenAnswer(invocation -> {
                    Task harvest = invocation.getArgument(0);
                    BigDecimal revenue = BigDecimal.valueOf(harvest.getHarvestedYieldAmount())
                            .multiply(harvest.getCrop().getSellingPricePerKg());
                    harvest.setBookedRevenue(revenue);
                    return revenue;
                });
        org.mockito.Mockito.lenient()
                .when(userProfitService.isCompletedHarvest(any(Task.class)))
                .thenAnswer(invocation -> {
                    Task candidate = invocation.getArgument(0);
                    return "COMPLETED".equals(candidate.getStatus())
                            || Integer.valueOf(100).equals(candidate.getCompletionPercentage());
                });
        org.mockito.Mockito.lenient()
                .when(userProfitService.getHarvestRevenue(any(Task.class)))
                .thenAnswer(invocation -> {
                    Task harvest = invocation.getArgument(0);
                    return harvest.getBookedRevenue() == null
                            ? BigDecimal.ZERO
                            : harvest.getBookedRevenue();
                });
        return new TaskService(
                taskRepository,
                cropRepository,
                userProfitService,
                financialRecordService
        );
    }

    private Task harvestTask(int progress, Double harvestedYieldAmount) {
        User owner = new User();
        owner.setUsername("farmer");

        Field field = new Field();
        field.setOwner(owner);

        Crop crop = new Crop();
        crop.setId(20L);
        crop.setField(field);
        crop.setHarvestYield(100.0);
        crop.setSellingPricePerKg(new BigDecimal("2.00"));

        Task task = new Task();
        task.setId(10L);
        task.setTaskType("Συγκομιδή");
        task.setStatus("PENDING");
        task.setCompletionPercentage(progress);
        task.setHarvestedYieldAmount(harvestedYieldAmount);
        task.setCost(new BigDecimal("10.00"));
        task.setCrop(crop);
        return task;
    }
}
