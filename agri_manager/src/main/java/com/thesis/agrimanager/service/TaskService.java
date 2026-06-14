package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.TaskDTO;
import com.thesis.agrimanager.model.Crop;
import com.thesis.agrimanager.model.Task;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Locale;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional
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
        int initialProgress = normalizeInitialProgress(dto);
        Double initialYield = isHarvestTask(dto.getTaskType())
                ? normalizeYieldAmount(dto.getHarvestedYieldAmount())
                : null;
        if (isHarvestTask(dto.getTaskType()) && initialProgress == 100 && initialYield == null) {
            throw new IllegalArgumentException(
                    "Η ποσότητα συγκομιδής είναι υποχρεωτική για ολοκλήρωση στο 100%."
            );
        }
        task.setCompletionPercentage(initialProgress);
        task.setStatus(initialProgress == 100 ? "COMPLETED" : "PENDING");
        task.setHarvestedYieldAmount(initialYield);
        task.setCost(dto.getCost());
        task.setLaborHours(dto.getLaborHours());
        task.setLocation(dto.getLocation());
        task.setCrop(crop);

        if (initialProgress == 100 && initialYield != null) {
            addHarvestYield(crop, initialYield);
        }

        return convertToDTO(taskRepository.save(task));
    }

    public List<TaskDTO> getTasksByCrop(Long cropId) {
        return taskRepository.findByCropId(cropId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<TaskDTO> getUrgentTasks(String username) {
        return taskRepository.findPendingUrgentTasks(username, LocalDate.now()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private TaskDTO convertToDTO(Task task) {
        return new TaskDTO(
                task.getId(),
                task.getTaskType(),
                task.getDescription(),
                task.getTaskDate(),
                task.getStatus(),
                getEffectiveProgress(task),
                task.getHarvestedYieldAmount(),
                calculateNetHarvestProfit(task),
                task.getCost(),
                task.getLaborHours(),
                task.getLocation(),
                task.getCrop().getId()
        );
    }

    public TaskDTO completeTask(Long taskId) {
        return updateTaskProgress(taskId, 100, null);
    }

    public TaskDTO updateTask(Long taskId, TaskDTO dto, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        String ownerUsername = task.getCrop().getField().getOwner().getUsername();
        if (!ownerUsername.equals(username)) {
            throw new RuntimeException("Δεν έχετε δικαίωμα να επεξεργαστείτε αυτή την εργασία!");
        }

        int currentProgress = getEffectiveProgress(task);
        if (currentProgress == 100 && !Objects.equals(task.getTaskType(), dto.getTaskType())) {
            throw new IllegalStateException(
                    "Ο τύπος μιας ολοκληρωμένης εργασίας δεν μπορεί να αλλάξει."
            );
        }

        Crop crop = task.getCrop();
        if (dto.getCropId() != null && !dto.getCropId().equals(crop.getId())) {
            if (currentProgress == 100) {
                throw new IllegalStateException(
                        "Η καλλιέργεια μιας ολοκληρωμένης εργασίας δεν μπορεί να αλλάξει."
                );
            }
            crop = cropRepository.findById(dto.getCropId())
                    .orElseThrow(() -> new RuntimeException("Crop not found"));

            if (!crop.getField().getOwner().getUsername().equals(username)) {
                throw new RuntimeException("Δεν έχετε δικαίωμα να μετακινήσετε την εργασία σε αυτή την καλλιέργεια!");
            }
        }

        if (dto.getLocation() != null && !crop.getZoneBoundary().contains(dto.getLocation())) {
            throw new RuntimeException("Το σημείο της εργασίας είναι εκτός της ζώνης καλλιέργειας!");
        }

        task.setTaskType(dto.getTaskType());
        task.setDescription(dto.getDescription());
        task.setTaskDate(dto.getTaskDate());
        task.setCost(dto.getCost());
        task.setLaborHours(dto.getLaborHours());
        task.setCrop(crop);

        if (isHarvestTask(dto.getTaskType())) {
            if (getEffectiveProgress(task) < 100 && dto.getHarvestedYieldAmount() != null) {
                task.setHarvestedYieldAmount(normalizeYieldAmount(dto.getHarvestedYieldAmount()));
            }
        } else {
            task.setHarvestedYieldAmount(null);
        }

        if (dto.getLocation() != null) {
            task.setLocation(dto.getLocation());
        }

        return convertToDTO(taskRepository.save(task));
    }

    public TaskDTO updateTaskProgress(Long taskId, Integer progress, Double yieldAmount) {
        Task task = findOwnedTaskForProgressUpdate(taskId);
        int previousProgress = getEffectiveProgress(task);
        int validatedProgress = validateProgress(progress);

        if (previousProgress == 100 && validatedProgress != 100) {
            throw new RuntimeException("Η ολοκληρωμένη εργασία δεν μπορεί να επιστρέψει σε μικρότερο ποσοστό.");
        }

        boolean harvestTask = isHarvestTask(task.getTaskType());
        if (harvestTask && previousProgress < 100 && yieldAmount != null) {
            task.setHarvestedYieldAmount(normalizeYieldAmount(yieldAmount));
        }
        if (harvestTask && validatedProgress == 100 && task.getHarvestedYieldAmount() == null) {
            throw new IllegalArgumentException(
                    "Η ποσότητα συγκομιδής είναι υποχρεωτική για ολοκλήρωση στο 100%."
            );
        }

        task.setCompletionPercentage(validatedProgress);
        task.setStatus(validatedProgress == 100 ? "COMPLETED" : "PENDING");

        if (harvestTask && previousProgress < 100 && validatedProgress == 100) {
            addHarvestYield(task.getCrop(), task.getHarvestedYieldAmount());
        }

        return convertToDTO(taskRepository.save(task));
    }

    public void deleteTask(Long taskId, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Η εργασία δεν βρέθηκε"));

        // Έλεγχος ιδιοκτησίας: Μόνο ο ιδιοκτήτης του χωραφιού μπορεί να σβήσει την εργασία
        String ownerUsername = task.getCrop().getField().getOwner().getUsername();

        if (!ownerUsername.equals(username)) {
            throw new RuntimeException("Δεν έχετε δικαίωμα να διαγράψετε αυτή την εργασία!");
        }

        taskRepository.delete(task);
    }

    private Task findOwnedTaskForProgressUpdate(Long taskId) {
        Task task = taskRepository.findByIdForProgressUpdate(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        verifyTaskOwner(task);
        return task;
    }

    private void verifyTaskOwner(Task task) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        String ownerUsername = task.getCrop().getField().getOwner().getUsername();
        if (!ownerUsername.equals(currentUsername)) {
            throw new RuntimeException("Δεν έχετε δικαίωμα να ενημερώσετε αυτή την εργασία!");
        }
    }

    private int normalizeInitialProgress(TaskDTO dto) {
        if (dto.getCompletionPercentage() != null) {
            return validateProgress(dto.getCompletionPercentage());
        }
        return "COMPLETED".equalsIgnoreCase(dto.getStatus()) ? 100 : 0;
    }

    private int getEffectiveProgress(Task task) {
        if (task.getCompletionPercentage() != null) {
            return task.getCompletionPercentage();
        }
        return "COMPLETED".equalsIgnoreCase(task.getStatus()) ? 100 : 0;
    }

    private int validateProgress(Integer progress) {
        if (progress == null || progress < 0 || progress > 100) {
            throw new IllegalArgumentException("Το ποσοστό ολοκλήρωσης πρέπει να είναι από 0 έως 100.");
        }
        return progress;
    }

    private Double normalizeYieldAmount(Double yieldAmount) {
        if (yieldAmount == null) {
            return null;
        }
        if (!Double.isFinite(yieldAmount) || yieldAmount < 0) {
            throw new IllegalArgumentException("Η ποσότητα συγκομιδής πρέπει να είναι μη αρνητικός αριθμός.");
        }
        return yieldAmount;
    }

    private void addHarvestYield(Crop crop, double harvestedYield) {
        double currentYield = crop.getHarvestYield() == null ? 0.0 : crop.getHarvestYield();
        crop.setHarvestYield(currentYield + harvestedYield);
        cropRepository.save(crop);
    }

    private BigDecimal calculateNetHarvestProfit(Task task) {
        if (!isHarvestTask(task.getTaskType()) || task.getHarvestedYieldAmount() == null) {
            return null;
        }

        BigDecimal pricePerKg = task.getCrop().getSellingPricePerKg() == null
                ? BigDecimal.ZERO
                : task.getCrop().getSellingPricePerKg();
        BigDecimal taskCost = task.getCost() == null
                ? BigDecimal.ZERO
                : task.getCost();

        return BigDecimal.valueOf(task.getHarvestedYieldAmount())
                .multiply(pricePerKg)
                .subtract(taskCost);
    }

    private boolean isHarvestTask(String taskType) {
        if (taskType == null) {
            return false;
        }
        String normalizedType = taskType.trim().toUpperCase(Locale.ROOT);
        return "HARVEST".equals(normalizedType)
                || "ΣΥΓΚΟΜΙΔΗ".equals(normalizedType)
                || "ΣΥΓΚΟΜΙΔΉ".equals(normalizedType);
    }
}
