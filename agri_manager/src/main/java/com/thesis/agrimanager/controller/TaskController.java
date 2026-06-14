package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.TaskDTO;
import com.thesis.agrimanager.service.TaskService;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public TaskDTO createTask(@RequestBody TaskDTO dto) {
        return taskService.saveTask(dto);
    }

    @GetMapping("/crop/{cropId}")
    public List<TaskDTO> getTasksByCrop(@PathVariable Long cropId) {
        return taskService.getTasksByCrop(cropId);
    }

    @GetMapping("/notifications")
    public List<TaskDTO> getNotifications(Principal principal) {
        return taskService.getUrgentTasks(principal.getName());
    }

    @PutMapping("/{id}")
    public TaskDTO updateTask(@PathVariable Long id, @RequestBody TaskDTO dto, Principal principal) {
        return taskService.updateTask(id, dto, principal.getName());
    }

    @PatchMapping("/{id}/complete")
    public TaskDTO completeTask(@PathVariable Long id) {
        return taskService.completeTask(id);
    }

    @PatchMapping("/{id}/progress")
    public TaskDTO updateTaskProgress(
            @PathVariable Long id,
            @RequestParam Integer progress,
            @RequestParam(required = false) Double yieldAmount
    ) {
        return taskService.updateTaskProgress(id, progress, yieldAmount);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id, Principal principal) {
        taskService.deleteTask(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
