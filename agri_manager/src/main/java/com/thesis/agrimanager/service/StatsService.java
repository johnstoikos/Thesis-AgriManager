package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.DashboardDTO;
import com.thesis.agrimanager.dto.FinancialStatsDTO;
import com.thesis.agrimanager.model.Task;
import com.thesis.agrimanager.repository.FieldRepository;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class StatsService {
    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;
    private final TaskRepository taskRepository;

    public StatsService(FieldRepository fieldRepository, CropRepository cropRepository, TaskRepository taskRepository) {
        this.fieldRepository = fieldRepository;
        this.cropRepository = cropRepository;
        this.taskRepository = taskRepository;
    }

    public DashboardDTO getDashboardStats(String username) {
        long fields = fieldRepository.countByOwnerUsername(username);
        long crops = cropRepository.countByFieldOwnerUsername(username);

        // Φιλτράρουμε τα tasks που έχουν status "PENDING" για τον συνδεδεμένο χρήστη
        long tasks = taskRepository.countByStatusAndCropFieldOwnerUsername("PENDING", username);

        // Υπολογίζουμε το σύνολο των εκταρίων/στρεμμάτων για τον συνδεδεμένο χρήστη
        double totalArea = fieldRepository.findByOwnerUsername(username).stream()
                .filter(f -> f.getArea() != null)
                .mapToDouble(f -> f.getArea())
                .sum();

        return new DashboardDTO(fields, crops, tasks, totalArea);
    }

    @Transactional(readOnly = true)
    public List<FinancialStatsDTO> getFinancialStats(String username) {
        List<Task> completedTasks = taskRepository.findByStatusAndOwnerUsernameWithCropAndField("COMPLETED", username);
        Map<String, BigDecimal> totalsByField = new LinkedHashMap<>();

        completedTasks.forEach(task -> {
            String fieldName = task.getCrop().getField().getName();
            BigDecimal cost = task.getCost() != null ? task.getCost() : BigDecimal.ZERO;
            totalsByField.merge(fieldName, cost, BigDecimal::add);
        });

        return totalsByField.entrySet().stream()
                .map(entry -> new FinancialStatsDTO(entry.getKey(), entry.getValue()))
                .toList();
    }
}
