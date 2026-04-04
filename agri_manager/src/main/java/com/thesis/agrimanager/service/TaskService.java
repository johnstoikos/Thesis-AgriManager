package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.TaskDTO;
import com.thesis.agrimanager.model.Crop;
import com.thesis.agrimanager.model.Task;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.TaskRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {
    private final TaskRepository taskRepository;
    private final CropRepository cropRepository;

    public TaskService(TaskRepository taskRepository, CropRepository cropRepository) {
        this.taskRepository = taskRepository;
        this.cropRepository = cropRepository;
    }

    public TaskDTO saveTask(TaskDTO dto) {
        Crop crop = cropRepository.findById(dto.getCropId())
                .orElseThrow(() -> new RuntimeException("Crop not found"));

        // Validation: Το σημείο της εργασίας πρέπει να είναι μέσα στο Crop Zone
        if (dto.getLocation() != null && !crop.getZoneBoundary().contains(dto.getLocation())) {
            throw new RuntimeException("Το σημείο της εργασίας είναι εκτός της ζώνης καλλιέργειας!");
        }

        Task task = new Task();
        task.setTaskType(dto.getTaskType());
        task.setDescription(dto.getDescription());
        task.setTaskDate(dto.getTaskDate());
        task.setStatus(dto.getStatus());
        task.setLocation(dto.getLocation());
        task.setCrop(crop);

        return convertToDTO(taskRepository.save(task));
    }

    public List<TaskDTO> getTasksByCrop(Long cropId) {
        return taskRepository.findByCropId(cropId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private TaskDTO convertToDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setTaskType(task.getTaskType());
        dto.setDescription(task.getDescription());
        dto.setTaskDate(task.getTaskDate());
        dto.setStatus(task.getStatus());
        dto.setLocation(task.getLocation());
        dto.setCropId(task.getCrop().getId());
        return dto;
    }

    public TaskDTO completeTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setStatus("COMPLETED");
        // Μπορείς να προσθέσεις και: task.setTaskDate(LocalDateTime.now());
        // αν θέλεις να καταγράφεται η ώρα ολοκληρωσης

        return convertToDTO(taskRepository.save(task));
    }
}