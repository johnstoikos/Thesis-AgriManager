package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.CropDTO;
import com.thesis.agrimanager.service.CropService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/crops")
public class CropController {

    private final CropService cropService;

    public CropController(CropService cropService) {
        this.cropService = cropService;
    }

    @PostMapping
    public CropDTO createCrop(@RequestBody CropDTO cropDTO) {
        return cropService.saveCrop(cropDTO);
    }

    @GetMapping("/field/{fieldId}")
    public List<CropDTO> getCropsByField(@PathVariable Long fieldId) {
        return cropService.getCropsByField(fieldId);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CropDTO> updateCrop(@PathVariable Long id, @RequestBody CropDTO cropDTO) {
        return ResponseEntity.ok(cropService.updateCrop(id, cropDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCrop(@PathVariable Long id) {
        cropService.deleteCrop(id);
        return ResponseEntity.noContent().build();
    }
}