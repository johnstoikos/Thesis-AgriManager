package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.AdminOverviewDTO;
import com.thesis.agrimanager.dto.CropDistributionDTO;
import com.thesis.agrimanager.dto.MonthlyActivityDTO;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.FieldRepository;
import com.thesis.agrimanager.repository.TaskRepository;
import com.thesis.agrimanager.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminStatsService {
    private final UserRepository userRepository;
    private final FieldRepository fieldRepository;
    private final TaskRepository taskRepository;
    private final CropRepository cropRepository;

    // Αρχικοποιεί τις εξαρτήσεις.
    public AdminStatsService(
            UserRepository userRepository,
            FieldRepository fieldRepository,
            TaskRepository taskRepository,
            CropRepository cropRepository
    ) {
        this.userRepository = userRepository;
        this.fieldRepository = fieldRepository;
        this.taskRepository = taskRepository;
        this.cropRepository = cropRepository;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    @Transactional(readOnly = true)
    public AdminOverviewDTO getOverview() {
        List<MonthlyActivityDTO> monthlyActivity = taskRepository.getCompletedTasksByMonth().stream()
                .map(row -> new MonthlyActivityDTO(
                        row.getMonth(),
                        row.getCompletedTasksCount() == null ? 0L : row.getCompletedTasksCount()
                ))
                .toList();

        return new AdminOverviewDTO(
                userRepository.countFarmers(),
                fieldRepository.countOwnedByFarmers(),
                taskRepository.countOwnedByFarmers(),
                monthlyActivity
        );
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    @Transactional(readOnly = true)
    public List<CropDistributionDTO> getCropDistribution() {
        return cropRepository.getGlobalCropDistribution().stream()
                .map(row -> new CropDistributionDTO(row.getCropType(), row.getTotalAcres()))
                .toList();
    }
}
