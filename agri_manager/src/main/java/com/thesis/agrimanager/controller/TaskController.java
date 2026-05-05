package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.TaskDTO;
import com.thesis.agrimanager.service.TaskService;
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

    @PatchMapping("/{id}/complete")
    public TaskDTO completeTask(@PathVariable Long id) {
        return taskService.completeTask(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id, java.security.Principal principal) {
        taskService.deleteTask(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}