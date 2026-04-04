package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.FieldDTO;

import com.thesis.agrimanager.dto.FieldRequest;

import com.thesis.agrimanager.model.Field;
import com.thesis.agrimanager.model.User;
import com.thesis.agrimanager.service.FieldService;
import com.thesis.agrimanager.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/fields")
public class FieldController {

    private final FieldService fieldService;
    // Θα χρειαστούμε και το UserService ή UserRepository για να βρίσκουμε τον User από το username
    private final UserService userService;

    public FieldController(FieldService fieldService, UserService userService) {
        this.fieldService = fieldService;
        this.userService = userService;
    }
    // Δημιουργία νέου χωραφιού
    @PostMapping
    public ResponseEntity<?> createField(@RequestBody FieldRequest request, Principal principal) {
        // Βρίσκουμε τον συνδεδεμένο χρήστη από το Token
        User currentUser = userService.getUserByUsername(principal.getName());

        Field fieldToSave = new Field();
        fieldToSave.setName(request.getName());
        fieldToSave.setArea(request.getArea());
        fieldToSave.setBoundary(request.getBoundary());
        fieldToSave.setOwner(currentUser); // <--- ΕΔΩ ΣΥΝΔΕΟΥΜΕ ΤΟ ΧΩΡΑΦΙ ΜΕ ΤΟΝ ΧΡΗΣΤΗ

        Field savedField = fieldService.saveField(fieldToSave);
        return ResponseEntity.ok(savedField);
    }

    // Λήψη όλων των χωραφιών ΤΟΥ ΧΡΗΣΤΗ
    @GetMapping
    public ResponseEntity<List<FieldDTO>> getAllMyFields(Principal principal) {
        // Παίρνουμε το username από το Principal
        String username = principal.getName();

        // Καλούμε μια νέα μέθοδο στο Service που φιλτράρει βάσει username
        return ResponseEntity.ok(fieldService.getFieldsByUsername(username));
    }
    // Λήψη ΕΝΟΣ συγκεκριμένου χωραφιού
    @GetMapping("/{id}")
    public ResponseEntity<FieldDTO> getFieldById(@PathVariable Long id) {
        return ResponseEntity.ok(fieldService.getFieldById(id));
    }

    // Ενημέρωση (Επεξεργασία) χωραφιού
    @PutMapping("/{id}")
    public ResponseEntity<FieldDTO> updateField(@PathVariable Long id, @RequestBody FieldRequest request) {
        return ResponseEntity.ok(fieldService.updateField(id, request));
    }

    // Διαγραφή χωραφιού
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteField(@PathVariable Long id) {
        fieldService.deleteField(id);
        return ResponseEntity.noContent().build(); // Επιστρέφει 204 No Content (επιτυχία χωρίς σώμα)
    }
}