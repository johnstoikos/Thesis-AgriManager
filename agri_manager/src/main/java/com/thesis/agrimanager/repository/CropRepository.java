package com.thesis.agrimanager.repository;

import com.thesis.agrimanager.model.Crop;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CropRepository extends JpaRepository<Crop, Long> {
    // Βρίσκει όλες τις καλλιέργειες ενός συγκεκριμένου χωραφιού
    List<Crop> findByFieldId(Long fieldId);
}