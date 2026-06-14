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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private CropRepository cropRepository;

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

    private TaskService serviceFor(Task task) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("farmer", null)
        );
        when(taskRepository.findByIdForProgressUpdate(task.getId())).thenReturn(Optional.of(task));
        return new TaskService(taskRepository, cropRepository);
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
