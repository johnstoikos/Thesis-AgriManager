package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.TaskDTO;
import com.thesis.agrimanager.service.TaskService;
import java.security.Principal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService taskService;

    // Αρχικοποιεί τις εξαρτήσεις.
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    // Δημιουργεί νέα εγγραφή.
    @PostMapping
    public TaskDTO createTask(@RequestBody TaskDTO dto) {
        return taskService.saveTask(dto);
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    @GetMapping("/crop/{cropId}")
    public List<TaskDTO> getTasksByCrop(@PathVariable Long cropId) {
        return taskService.getTasksByCrop(cropId);
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    @GetMapping("/notifications")
    public List<TaskDTO> getNotifications(Principal principal) {
        return taskService.getUrgentTasks(principal.getName());
    }

    // Ενημερώνει δεδομένα.
    @PutMapping("/{id}")
    public TaskDTO updateTask(@PathVariable Long id, @RequestBody TaskDTO dto, Principal principal) {
        return taskService.updateTask(id, dto, principal.getName());
    }

    // Ολοκληρώνει εργασία.
    @PatchMapping("/{id}/complete")
    public TaskDTO completeTask(@PathVariable Long id) {
        return taskService.completeTask(id);
    }

    // Ενημερώνει δεδομένα.
    @PatchMapping("/{id}/progress")
    public TaskDTO updateTaskProgress(
            @PathVariable Long id,
            @RequestParam Integer progress,
            @RequestParam(required = false) Double yieldAmount
    ) {
        return taskService.updateTaskProgress(id, progress, yieldAmount);
    }

    // Διαγράφει εγγραφές.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id, Principal principal) {
        taskService.deleteTask(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
