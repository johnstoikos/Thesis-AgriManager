package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.AdminUserDTO;
import com.thesis.agrimanager.dto.AdminUserStatsDTO;
import com.thesis.agrimanager.dto.CropDistributionDTO;
import com.thesis.agrimanager.dto.FieldDTO;
import com.thesis.agrimanager.dto.MonthlyActivityDTO;
import com.thesis.agrimanager.model.Field;
import com.thesis.agrimanager.model.User;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.FieldRepository;
import com.thesis.agrimanager.repository.TaskRepository;
import com.thesis.agrimanager.repository.UserRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminUserService {
    private final UserRepository userRepository;
    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;
    private final TaskRepository taskRepository;
    private final UserProfitService userProfitService;

    public AdminUserService(
            UserRepository userRepository,
            FieldRepository fieldRepository,
            CropRepository cropRepository,
            TaskRepository taskRepository,
            UserProfitService userProfitService
    ) {
        this.userRepository = userRepository;
        this.fieldRepository = fieldRepository;
        this.cropRepository = cropRepository;
        this.taskRepository = taskRepository;
        this.userProfitService = userProfitService;
    }

    @Transactional(readOnly = true)
    public List<AdminUserDTO> getAllUsers() {
        return userRepository.findAllFarmers().stream()
                .map(this::toAdminUserDTO)
                .toList();
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findFarmerById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Ο αγρότης με ID " + id + " δεν βρέθηκε ή δεν επιτρέπεται η διαγραφή του."
                ));

        /*
         * Ο User δεν έχει cascade προς τα fields. Διαγράφουμε πρώτα τα fields του,
         * ώστε τα υπάρχοντα Field -> Crop -> Task cascades να καθαρίσουν τα FK rows.
         */
        List<Field> ownedFields = fieldRepository.findByOwnerId(id);
        fieldRepository.deleteAll(ownedFields);
        fieldRepository.flush();

        /*
         * Το roles είναι @ElementCollection. Με τη διαγραφή του User, η Hibernate
         * καθαρίζει και τις αντίστοιχες εγγραφές στον πίνακα user_roles.
         */
        userRepository.delete(user);
    }

    @Transactional
    public AdminUserDTO setUserActive(Long id, boolean active) {
        User user = userRepository.findFarmerById(id)
                .orElseThrow(() -> new RuntimeException("Ο αγρότης με ID " + id + " δεν βρέθηκε."));

        user.setActive(active);
        return toAdminUserDTO(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<FieldDTO> getUserFields(Long userId) {
        userRepository.findFarmerById(userId)
                .orElseThrow(() -> new RuntimeException("Ο αγρότης με ID " + userId + " δεν βρέθηκε."));

        return fieldRepository.findOwnedByFarmerId(userId).stream()
                .map(this::toFieldDTO)
                .toList();
    }

    @Transactional
    public void deleteUserField(Long userId, Long fieldId) {
        User user = userRepository.findFarmerById(userId)
                .orElseThrow(() -> new RuntimeException("Ο αγρότης με ID " + userId + " δεν βρέθηκε."));

        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new RuntimeException("Το χωράφι με ID " + fieldId + " δεν βρέθηκε."));

        if (field.getOwner() == null || !userId.equals(field.getOwner().getId())) {
            throw new RuntimeException("Το χωράφι δεν ανήκει στον συγκεκριμένο χρήστη.");
        }

        userProfitService.preserveFinancialsAfterDeletion(user);
        fieldRepository.delete(field);
    }

    @Transactional(readOnly = true)
    public AdminUserStatsDTO getUserStats(Long id) {
        User user = userRepository.findFarmerById(id)
                .orElseThrow(() -> new RuntimeException("Ο αγρότης με ID " + id + " δεν βρέθηκε."));

        List<CropDistributionDTO> cropDistribution = cropRepository.getCropDistributionByOwnerId(id).stream()
                .map(row -> new CropDistributionDTO(row.getCropType(), row.getTotalAcres()))
                .toList();

        List<MonthlyActivityDTO> monthlyActivity = taskRepository.getCompletedTasksByMonthAndOwnerId(id).stream()
                .map(row -> new MonthlyActivityDTO(
                        row.getMonth(),
                        row.getCompletedTasksCount() == null ? 0L : row.getCompletedTasksCount()
                ))
                .toList();

        return new AdminUserStatsDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                toSortedRoles(user.getRoles()),
                fieldRepository.countByOwnerId(id),
                cropRepository.countByFieldOwnerId(id),
                taskRepository.countByCropFieldOwnerId(id),
                taskRepository.countByStatusAndCropFieldOwnerId("PENDING", id),
                taskRepository.countByStatusAndCropFieldOwnerId("COMPLETED", id),
                fieldRepository.sumTotalAreaByOwnerId(id),
                taskRepository.sumCompletedTaskCostByOwnerId(id),
                cropDistribution,
                monthlyActivity
        );
    }

    private AdminUserDTO toAdminUserDTO(User user) {
        return new AdminUserDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.isActive(),
                user.getRoles() == null ? Set.of() : Set.copyOf(user.getRoles())
        );
    }

    private FieldDTO toFieldDTO(Field field) {
        return new FieldDTO(
                field.getId(),
                field.getName(),
                field.getArea(),
                field.getBoundary(),
                field.getSoilType(),
                field.getSoilPh(),
                field.getIrrigationType()
        );
    }

    private List<String> toSortedRoles(Set<String> roles) {
        if (roles == null || roles.isEmpty()) return List.of();
        List<String> sortedRoles = new ArrayList<>(roles);
        Collections.sort(sortedRoles);
        return sortedRoles;
    }
}
