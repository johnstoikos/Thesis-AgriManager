package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.CropDTO;
import com.thesis.agrimanager.model.Crop;
import com.thesis.agrimanager.model.Field;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.FieldRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CropService {

    private final CropRepository cropRepository;
    private final FieldRepository fieldRepository;

    public CropService(CropRepository cropRepository, FieldRepository fieldRepository) {
        this.cropRepository = cropRepository;
        this.fieldRepository = fieldRepository;
    }

    public CropDTO saveCrop(CropDTO cropDTO) {
        // 1. Ποιος είναι ο συνδεδεμένος χρήστης;
        String currentUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();

        // 2. Βρίσκουμε το χωράφι - ΠΡΕΠΕΙ να ανήκει στον χρήστη
        Field field = fieldRepository.findByIdAndOwnerUsername(cropDTO.getFieldId(), currentUsername)
                .orElseThrow(() -> new RuntimeException("Το χωράφι δεν βρέθηκε ή δεν έχετε δικαίωμα πρόσβασης."));

        // 3. Γεωχωρικός Έλεγχος (Spatial Validation)
        // Ελέγχουμε αν η περιοχή της καλλιέργειας (zone) είναι μέσα στα όρια του χωραφιού
        if (cropDTO.getZoneBoundary() != null && field.getBoundary() != null) {
            if (!field.getBoundary().contains(cropDTO.getZoneBoundary())) {
                throw new RuntimeException("Σφάλμα: Η ζώνη καλλιέργειας βρίσκεται εκτός των ορίων του χωραφιού!");
            }
        }

        // 4. Μετατροπή DTO -> Entity και Αποθήκευση
        Crop crop = new Crop();
        crop.setType(cropDTO.getType());
        crop.setVariety(cropDTO.getVariety());
        crop.setPlantingDate(cropDTO.getPlantingDate());
        crop.setZoneBoundary(cropDTO.getZoneBoundary());
        crop.setField(field); // Σύνδεση με το Field

        Crop savedCrop = cropRepository.save(crop);

        // 5. Επιστροφή σε DTO
        return convertToDTO(savedCrop);
    }

    public CropDTO updateCrop(Long id, CropDTO cropDTO) {
        String currentUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();

        // 1. Βρίσκουμε την υπάρχουσα καλλιέργεια
        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Η καλλιέργεια δεν βρέθηκε."));

        // 2. Έλεγχος αν το χωράφι ανήκει στον χρήστη
        if (!crop.getField().getOwner().getUsername().equals(currentUsername)) {
            throw new RuntimeException("Δεν έχετε δικαίωμα επεξεργασίας αυτής της καλλιέργειας.");
        }

        // 3. Γεωχωρικός έλεγχος για τη ΝΕΑ ζώνη (αν στάλθηκε νέα ζώνη)
        if (cropDTO.getZoneBoundary() != null) {
            if (!crop.getField().getBoundary().contains(cropDTO.getZoneBoundary())) {
                throw new RuntimeException("Σφάλμα: Η νέα ζώνη καλλιέργειας είναι εκτός των ορίων του χωραφιού!");
            }
            crop.setZoneBoundary(cropDTO.getZoneBoundary());
        }

        // 4. Ενημέρωση των υπόλοιπων στοιχείων
        crop.setType(cropDTO.getType());
        crop.setVariety(cropDTO.getVariety());
        crop.setPlantingDate(cropDTO.getPlantingDate());

        Crop updatedCrop = cropRepository.save(crop);
        return convertToDTO(updatedCrop);
    }

    public void deleteCrop(Long id) {
        // Έλεγχος αν υπάρχει και αν ανήκει στον χρήστη μέσω του Field
        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Η καλλιέργεια δεν βρέθηκε."));

        String currentUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        if (!crop.getField().getOwner().getUsername().equals(currentUsername)) {
            throw new RuntimeException("Δεν έχετε δικαίωμα διαγραφής αυτής της καλλιέργειας.");
        }

        cropRepository.delete(crop);
    }

    public List<CropDTO> getCropsByField(Long fieldId) {
        return cropRepository.findByFieldId(fieldId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private CropDTO convertToDTO(Crop crop) {
        CropDTO dto = new CropDTO();
        dto.setId(crop.getId());
        dto.setType(crop.getType());
        dto.setVariety(crop.getVariety());
        dto.setPlantingDate(crop.getPlantingDate());
        dto.setZoneBoundary(crop.getZoneBoundary());
        dto.setFieldId(crop.getField().getId());

        // Υπολογισμός Έκτασης Ζώνης (JTS Area)
        if (crop.getZoneBoundary() != null) {
            double area = crop.getZoneBoundary().getArea();
            // Σημείωση: Η getArea() επιστρέφει τιμές σε μοίρες αν το SRID είναι 4326.
            // Για ακρίβεια σε μέτρα χρειάζεται μετατροπή, αλλά για το % μας κάνει και έτσι:
            dto.setZoneArea(area);

            double fieldArea = crop.getField().getBoundary().getArea();
            dto.setCoveragePercentage((area / fieldArea) * 100);
        }

        return dto;
    }
}