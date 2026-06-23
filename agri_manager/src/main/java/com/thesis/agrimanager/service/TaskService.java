package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.TaskDTO;
import com.thesis.agrimanager.model.Crop;
import com.thesis.agrimanager.model.Task;
import com.thesis.agrimanager.model.User;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Locale;
import java.util.List;
import java.util.Objects;

@Service
@Transactional
public class TaskService {
    private final TaskRepository taskRepository;
    private final CropRepository cropRepository;
    private final UserProfitService userProfitService;
    private final FinancialRecordService financialRecordService;

    public TaskService(
            TaskRepository taskRepository,
            CropRepository cropRepository,
            UserProfitService userProfitService,
            FinancialRecordService financialRecordService
    ) {
        this.taskRepository = taskRepository;
        this.cropRepository = cropRepository;
        this.userProfitService = userProfitService;
        this.financialRecordService = financialRecordService;
    }

    public TaskDTO saveTask(TaskDTO dto) {
        Crop crop = cropRepository.findById(dto.cropId())
                .orElseThrow(() -> new RuntimeException("Crop not found"));
        User owner = crop.getField().getOwner();
        verifyCropOwner(crop);
        userProfitService.ensureInitialized(owner.getUsername());

        if (dto.location() != null && !crop.getZoneBoundary().contains(dto.location())) {
            throw new RuntimeException("Το σημείο της εργασίας είναι εκτός της ζώνης καλλιέργειας!");
        }

        Task task = new Task();
        task.setTaskType(dto.taskType());
        task.setDescription(dto.description());
        task.setTaskDate(dto.taskDate());
        int initialProgress = normalizeInitialProgress(dto);
        Double initialYield = isHarvestTask(dto.taskType())
                ? normalizeYieldAmount(dto.harvestedYieldAmount())
                : null;
        if (isHarvestTask(dto.taskType()) && initialProgress == 100 && initialYield == null) {
            throw new IllegalArgumentException(
                    "Η ποσότητα συγκομιδής είναι υποχρεωτική για ολοκλήρωση στο 100%."
            );
        }
        task.setCompletionPercentage(initialProgress);
        task.setStatus(initialProgress == 100 ? "COMPLETED" : "PENDING");
        task.setHarvestedYieldAmount(initialYield);
        applyLaborCost(task, dto.hourlyCost(), dto.laborHours());
        task.setLocation(dto.location());
        task.setCrop(crop);

        if (initialProgress == 100 && isHarvestTask(dto.taskType())) {
            requireSellingPrice(crop);
        }

        BigDecimal bookedRevenue = BigDecimal.ZERO;
        if (initialProgress == 100 && initialYield != null) {
            addHarvestYield(crop, initialYield);
            bookedRevenue = userProfitService.bookHarvestRevenue(task);
        }

        Task savedTask = taskRepository.save(task);
        financialRecordService.recordHarvestRevenue(savedTask, bookedRevenue);
        financialRecordService.recordTaskExpense(savedTask, savedTask.getCost());
        userProfitService.recordTask(
                owner,
                bookedRevenue,
                savedTask.getCost()
        );
        return convertToDTO(savedTask);
    }

    public List<TaskDTO> getTasksByCrop(Long cropId) {
        return taskRepository.findByCropId(cropId).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<TaskDTO> getUrgentTasks(String username) {
        return taskRepository.findPendingUrgentTasks(username, LocalDate.now()).stream()
                .map(this::convertToDTO)
                .toList();
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
                getEffectiveHourlyCost(task),
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
        User owner = task.getCrop().getField().getOwner();

        String ownerUsername = task.getCrop().getField().getOwner().getUsername();
        if (!ownerUsername.equals(username)) {
            throw new RuntimeException("Δεν έχετε δικαίωμα να επεξεργαστείτε αυτή την εργασία!");
        }
        userProfitService.ensureInitialized(owner.getUsername());

        int currentProgress = getEffectiveProgress(task);
        if (currentProgress == 100 && !Objects.equals(task.getTaskType(), dto.taskType())) {
            throw new IllegalStateException(
                    "Ο τύπος μιας ολοκληρωμένης εργασίας δεν μπορεί να αλλάξει."
            );
        }

        Crop crop = task.getCrop();
        if (dto.cropId() != null && !dto.cropId().equals(crop.getId())) {
            if (currentProgress == 100) {
                throw new IllegalStateException(
                        "Η καλλιέργεια μιας ολοκληρωμένης εργασίας δεν μπορεί να αλλάξει."
                );
            }
            crop = cropRepository.findById(dto.cropId())
                    .orElseThrow(() -> new RuntimeException("Crop not found"));

            if (!crop.getField().getOwner().getUsername().equals(username)) {
                throw new RuntimeException("Δεν έχετε δικαίωμα να μετακινήσετε την εργασία σε αυτή την καλλιέργεια!");
            }
        }

        if (dto.location() != null && !crop.getZoneBoundary().contains(dto.location())) {
            throw new RuntimeException("Το σημείο της εργασίας είναι εκτός της ζώνης καλλιέργειας!");
        }

        task.setTaskType(dto.taskType());
        task.setDescription(dto.description());
        task.setTaskDate(dto.taskDate());
        BigDecimal previousCost = zeroIfNull(task.getCost());
        applyLaborCost(task, dto.hourlyCost(), dto.laborHours());
        task.setCrop(crop);

        if (isHarvestTask(dto.taskType())) {
            if (getEffectiveProgress(task) < 100 && dto.harvestedYieldAmount() != null) {
                task.setHarvestedYieldAmount(normalizeYieldAmount(dto.harvestedYieldAmount()));
            }
        } else {
            task.setHarvestedYieldAmount(null);
        }

        if (dto.location() != null) {
            task.setLocation(dto.location());
        }

        Task savedTask = taskRepository.save(task);
        BigDecimal expenseDelta = zeroIfNull(savedTask.getCost()).subtract(previousCost);
        if (expenseDelta.signum() != 0) {
            financialRecordService.recordTaskExpense(savedTask, expenseDelta);
            userProfitService.adjustExpense(owner, expenseDelta);
        }
        return convertToDTO(savedTask);
    }

    public TaskDTO updateTaskProgress(
            Long taskId,
            Integer progress,
            Double yieldAmount
    ) {
        Task task = findOwnedTaskForProgressUpdate(taskId);
        User owner = task.getCrop().getField().getOwner();
        userProfitService.ensureInitialized(owner.getUsername());
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
        if (harvestTask && validatedProgress == 100) {
            requireSellingPrice(task.getCrop());
        }

        task.setCompletionPercentage(validatedProgress);
        task.setStatus(validatedProgress == 100 ? "COMPLETED" : "PENDING");

        if (harvestTask && previousProgress < 100 && validatedProgress == 100) {
            addHarvestYield(task.getCrop(), task.getHarvestedYieldAmount());
            BigDecimal bookedRevenue = userProfitService.bookHarvestRevenue(task);
            financialRecordService.recordHarvestRevenue(task, bookedRevenue);
            userProfitService.recordRevenue(owner, bookedRevenue);
        } else if (harvestTask && validatedProgress == 100 && task.getBookedRevenue() == null) {
            BigDecimal bookedRevenue = userProfitService.bookHarvestRevenue(task);
            financialRecordService.recordHarvestRevenue(task, bookedRevenue);
        }

        return convertToDTO(taskRepository.save(task));
    }

    public void deleteTask(Long taskId, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Η εργασία δεν βρέθηκε"));

        Crop crop = task.getCrop();
        String ownerUsername = crop.getField().getOwner().getUsername();

        if (!ownerUsername.equals(username)) {
            throw new RuntimeException("Δεν έχετε δικαίωμα να διαγράψετε αυτή την εργασία!");
        }

        userProfitService.preserveFinancialsAfterDeletion(crop.getField().getOwner());

        boolean preserveBookedHarvest = isHarvestTask(task.getTaskType())
                && getEffectiveProgress(task) == 100;
        Double bookedHarvestYield = preserveBookedHarvest ? crop.getHarvestYield() : null;
        BigDecimal bookedSellingPrice = preserveBookedHarvest ? crop.getSellingPricePerKg() : null;

        taskRepository.delete(task);

        if (preserveBookedHarvest) {
            crop.setHarvestYield(bookedHarvestYield);
            crop.setSellingPricePerKg(bookedSellingPrice);
        }
    }

    private Task findOwnedTaskForProgressUpdate(Long taskId) {
        Task task = taskRepository.findByIdForProgressUpdate(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        verifyTaskOwner(task);
        return task;
    }

    private void verifyTaskOwner(Task task) {
        verifyCropOwner(task.getCrop());
    }

    private void verifyCropOwner(Crop crop) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        String ownerUsername = crop.getField().getOwner().getUsername();
        if (!ownerUsername.equals(currentUsername)) {
            throw new RuntimeException("Δεν έχετε δικαίωμα πρόσβασης σε αυτή την καλλιέργεια!");
        }
    }

    private int normalizeInitialProgress(TaskDTO dto) {
        if (dto.completionPercentage() != null) {
            return validateProgress(dto.completionPercentage());
        }
        return "COMPLETED".equalsIgnoreCase(dto.status()) ? 100 : 0;
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

    private void requireSellingPrice(Crop crop) {
        if (crop.getSellingPricePerKg() == null || crop.getSellingPricePerKg().signum() <= 0) {
            throw new IllegalArgumentException(
                    "Η τιμή πώλησης ανά Kg είναι υποχρεωτική για την ολοκλήρωση συγκομιδής."
            );
        }
    }

    private BigDecimal calculateNetHarvestProfit(Task task) {
        if (!userProfitService.isCompletedHarvest(task)) {
            return null;
        }

        return userProfitService.getHarvestRevenue(task)
                .subtract(zeroIfNull(task.getCost()));
    }

    private void applyLaborCost(Task task, BigDecimal hourlyCost, Double laborHours) {
        if (hourlyCost == null && laborHours == null) {
            task.setHourlyCost(null);
            task.setLaborHours(null);
            task.setCost(null);
            return;
        }
        if (hourlyCost == null || laborHours == null) {
            throw new IllegalArgumentException(
                    "Το κόστος ανά ώρα και οι ώρες εργασίας πρέπει να συμπληρώνονται μαζί."
            );
        }
        if (hourlyCost.signum() < 0) {
            throw new IllegalArgumentException("Το κόστος ανά ώρα δεν μπορεί να είναι αρνητικό.");
        }
        if (!Double.isFinite(laborHours) || laborHours < 0) {
            throw new IllegalArgumentException("Οι ώρες εργασίας πρέπει να είναι μη αρνητικός αριθμός.");
        }

        BigDecimal normalizedHourlyCost = hourlyCost.setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalCost = normalizedHourlyCost
                .multiply(BigDecimal.valueOf(laborHours))
                .setScale(2, RoundingMode.HALF_UP);
        task.setHourlyCost(normalizedHourlyCost);
        task.setLaborHours(laborHours);
        task.setCost(totalCost);
    }

    private BigDecimal getEffectiveHourlyCost(Task task) {
        if (task.getHourlyCost() != null) {
            return task.getHourlyCost();
        }
        if (task.getCost() == null
                || task.getLaborHours() == null
                || task.getLaborHours() == 0) {
            return null;
        }
        return task.getCost()
                .divide(BigDecimal.valueOf(task.getLaborHours()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
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
