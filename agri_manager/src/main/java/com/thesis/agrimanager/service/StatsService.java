package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.DashboardDTO;
import com.thesis.agrimanager.repository.FieldRepository;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.TaskRepository;
import org.springframework.stereotype.Service;

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

    public DashboardDTO getDashboardStats() {
        long fields = fieldRepository.count();
        long crops = cropRepository.count();

        // Φιλτράρουμε τα tasks που έχουν status "PENDING"
        long tasks = taskRepository.findAll().stream()
                .filter(t -> "PENDING".equals(t.getStatus()))
                .count();

        // Υπολογίζουμε το σύνολο των εκταρίων/στρεμμάτων
        double totalArea = fieldRepository.findAll().stream()
                .mapToDouble(f -> f.getArea())
                .sum();

        return new DashboardDTO(fields, crops, tasks, totalArea);
    }
}