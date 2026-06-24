package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.CropDTO;
import com.thesis.agrimanager.model.Crop;
import com.thesis.agrimanager.model.Field;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.FieldRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CropService {

    private final CropRepository cropRepository;
    private final FieldRepository fieldRepository;
    private final UserProfitService userProfitService;

    // Αρχικοποιεί τις εξαρτήσεις.
    public CropService(
            CropRepository cropRepository,
            FieldRepository fieldRepository,
            UserProfitService userProfitService
    ) {
        this.cropRepository = cropRepository;
        this.fieldRepository = fieldRepository;
        this.userProfitService = userProfitService;
    }

    // Αποθηκεύει εγγραφή.
    public CropDTO saveCrop(CropDTO cropDTO) {
        validateSellingPrice(cropDTO.sellingPricePerKg());
        String currentUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();

        Field field = fieldRepository.findByIdAndOwnerUsername(cropDTO.fieldId(), currentUsername)
                .orElseThrow(() -> new RuntimeException("Το χωράφι δεν βρέθηκε ή δεν έχετε δικαίωμα πρόσβασης."));

        if (cropDTO.zoneBoundary() != null && field.getBoundary() != null) {
            if (!field.getBoundary().contains(cropDTO.zoneBoundary())) {
                throw new RuntimeException("Σφάλμα: Η ζώνη καλλιέργειας βρίσκεται εκτός των ορίων του χωραφιού!");
            }
        }

        Crop crop = new Crop();
        crop.setType(cropDTO.type());
        crop.setVariety(cropDTO.variety());
        crop.setPlantingDate(cropDTO.plantingDate());
        crop.setSellingPricePerKg(cropDTO.sellingPricePerKg());
        crop.setZoneBoundary(cropDTO.zoneBoundary());
        crop.setField(field);

        Crop savedCrop = cropRepository.save(crop);

        return convertToDTO(savedCrop);
    }

    // Ενημερώνει δεδομένα.
    public CropDTO updateCrop(Long id, CropDTO cropDTO) {
        validateSellingPrice(cropDTO.sellingPricePerKg());
        String currentUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();

        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Η καλλιέργεια δεν βρέθηκε."));

        if (!crop.getField().getOwner().getUsername().equals(currentUsername)) {
            throw new RuntimeException("Δεν έχετε δικαίωμα επεξεργασίας αυτής της καλλιέργειας.");
        }

        if (cropDTO.zoneBoundary() != null) {
            if (!crop.getField().getBoundary().contains(cropDTO.zoneBoundary())) {
                throw new RuntimeException("Σφάλμα: Η νέα ζώνη καλλιέργειας είναι εκτός των ορίων του χωραφιού!");
            }
            crop.setZoneBoundary(cropDTO.zoneBoundary());
        }

        crop.setType(cropDTO.type());
        crop.setVariety(cropDTO.variety());
        crop.setPlantingDate(cropDTO.plantingDate());
        crop.setSellingPricePerKg(cropDTO.sellingPricePerKg());

        Crop updatedCrop = cropRepository.save(crop);
        return convertToDTO(updatedCrop);
    }

    // Διαγράφει εγγραφές.
    @Transactional
    public void deleteCrop(Long id) {
        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Η καλλιέργεια δεν βρέθηκε."));

        String currentUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        if (!crop.getField().getOwner().getUsername().equals(currentUsername)) {
            throw new RuntimeException("Δεν έχετε δικαίωμα διαγραφής αυτής της καλλιέργειας.");
        }

        userProfitService.preserveFinancialsAfterDeletion(crop.getField().getOwner());
        cropRepository.delete(crop);
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public List<CropDTO> getCropsByField(Long fieldId) {
        return cropRepository.findByFieldId(fieldId).stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Μετατρέπει δεδομένα.
    private CropDTO convertToDTO(Crop crop) {
        Double zoneArea = null;
        Double coveragePercentage = null;

        if (crop.getZoneBoundary() != null) {
            zoneArea = crop.getZoneBoundary().getArea();
            double fieldArea = crop.getField().getBoundary().getArea();
            coveragePercentage = (zoneArea / fieldArea) * 100;
        }

        return new CropDTO(
                crop.getId(),
                crop.getType(),
                crop.getVariety(),
                crop.getPlantingDate(),
                crop.getSellingPricePerKg(),
                crop.getZoneBoundary(),
                crop.getField().getId(),
                zoneArea,
                coveragePercentage
        );
    }

    // Ελέγχει εγκυρότητα.
    private void validateSellingPrice(BigDecimal sellingPricePerKg) {
        if (sellingPricePerKg == null || sellingPricePerKg.signum() <= 0) {
            throw new IllegalArgumentException(
                    "Η τιμή πώλησης ανά Kg είναι υποχρεωτική και πρέπει να είναι μεγαλύτερη από μηδέν."
            );
        }
    }
}
