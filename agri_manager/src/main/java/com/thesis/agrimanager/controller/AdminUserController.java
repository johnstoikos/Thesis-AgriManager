package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.AdminUserDTO;
import com.thesis.agrimanager.dto.AdminUserStatsDTO;
import com.thesis.agrimanager.dto.FieldDTO;
import com.thesis.agrimanager.service.AdminUserService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    private final AdminUserService adminUserService;

    // Αρχικοποιεί τις εξαρτήσεις.
    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    @GetMapping
    public List<AdminUserDTO> getAllUsers() {
        return adminUserService.getAllUsers();
    }

    // Διαγράφει εγγραφές.
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        adminUserService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "Ο χρήστης διαγράφηκε επιτυχώς."));
    }

    // Ενεργοποιεί χρήστη.
    @PatchMapping("/{id}/activate")
    public AdminUserDTO activateUser(@PathVariable Long id) {
        return adminUserService.setUserActive(id, true);
    }

    // Απενεργοποιεί χρήστη.
    @PatchMapping("/{id}/deactivate")
    public AdminUserDTO deactivateUser(@PathVariable Long id) {
        return adminUserService.setUserActive(id, false);
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    @GetMapping("/{id}/stats")
    public AdminUserStatsDTO getUserStats(@PathVariable Long id) {
        return adminUserService.getUserStats(id);
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    @GetMapping("/{id}/fields")
    public List<FieldDTO> getUserFields(@PathVariable Long id) {
        return adminUserService.getUserFields(id);
    }

    // Διαγράφει εγγραφές.
    @DeleteMapping("/{userId}/fields/{fieldId}")
    public ResponseEntity<Map<String, String>> deleteUserField(@PathVariable Long userId, @PathVariable Long fieldId) {
        adminUserService.deleteUserField(userId, fieldId);
        return ResponseEntity.ok(Map.of("message", "Το χωράφι διαγράφηκε επιτυχώς."));
    }
}
