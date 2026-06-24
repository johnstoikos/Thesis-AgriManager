package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.FieldDTO;
import com.thesis.agrimanager.dto.FieldRequest;
import com.thesis.agrimanager.model.Field;
import com.thesis.agrimanager.model.User;
import com.thesis.agrimanager.service.FieldService;
import com.thesis.agrimanager.service.UserService;
import java.security.Principal;
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
@RequestMapping("/api/fields")
public class FieldController {

    private final FieldService fieldService;
    private final UserService userService;

    // Αρχικοποιεί τις εξαρτήσεις.
    public FieldController(FieldService fieldService, UserService userService) {
        this.fieldService = fieldService;
        this.userService = userService;
    }

    // Δημιουργεί νέα εγγραφή.
    @PostMapping
    public ResponseEntity<?> createField(@RequestBody FieldRequest request, Principal principal) {
        User currentUser = userService.getUserByUsername(principal.getName());

        Field fieldToSave = new Field();
        fieldToSave.setName(request.name());
        fieldToSave.setArea(request.area());
        fieldToSave.setBoundary(request.boundary());
        fieldToSave.setSoilType(request.soilType());
        fieldToSave.setSoilPh(request.soilPh());
        fieldToSave.setIrrigationType(request.irrigationType());
        fieldToSave.setOwner(currentUser);

        Field savedField = fieldService.saveField(fieldToSave);
        return ResponseEntity.ok(savedField);
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    @GetMapping
    public ResponseEntity<List<FieldDTO>> getAllMyFields(Principal principal) {
        String username = principal.getName();

        return ResponseEntity.ok(fieldService.getFieldsByUsername(username));
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    @GetMapping("/{id}")
    public ResponseEntity<FieldDTO> getFieldById(@PathVariable Long id) {
        return ResponseEntity.ok(fieldService.getFieldById(id));
    }

    // Ενημερώνει δεδομένα.
    @PutMapping("/{id}")
    public ResponseEntity<FieldDTO> updateField(@PathVariable Long id, @RequestBody FieldRequest request) {
        return ResponseEntity.ok(fieldService.updateField(id, request));
    }

    // Διαγράφει εγγραφές.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteField(@PathVariable Long id) {
        fieldService.deleteField(id);
        return ResponseEntity.noContent().build();
    }
}
