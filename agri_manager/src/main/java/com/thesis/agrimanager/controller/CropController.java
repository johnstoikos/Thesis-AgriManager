package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.CropDTO;
import com.thesis.agrimanager.service.CropService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/crops")
public class CropController {

    private final CropService cropService;

    // Αρχικοποιεί τις εξαρτήσεις.
    public CropController(CropService cropService) {
        this.cropService = cropService;
    }

    // Δημιουργεί νέα εγγραφή.
    @PostMapping
    public CropDTO createCrop(@RequestBody CropDTO cropDTO) {
        return cropService.saveCrop(cropDTO);
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    @GetMapping("/field/{fieldId}")
    public List<CropDTO> getCropsByField(@PathVariable Long fieldId) {
        return cropService.getCropsByField(fieldId);
    }

    // Ενημερώνει δεδομένα.
    @PutMapping("/{id}")
    public ResponseEntity<CropDTO> updateCrop(@PathVariable Long id, @RequestBody CropDTO cropDTO) {
        return ResponseEntity.ok(cropService.updateCrop(id, cropDTO));
    }

    // Διαγράφει εγγραφές.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCrop(@PathVariable Long id) {
        cropService.deleteCrop(id);
        return ResponseEntity.noContent().build();
    }
}
