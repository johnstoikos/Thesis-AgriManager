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
}
