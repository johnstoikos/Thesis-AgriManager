package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.UserProfileDTO;
import com.thesis.agrimanager.model.User;
import com.thesis.agrimanager.service.UserService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public UserProfileDTO getProfile(Principal principal) {
        User user = userService.getUserByUsername(principal.getName());
        return userService.toProfileDTO(user);
    }

    @PutMapping("/profile")
    public UserProfileDTO updateProfile(@Valid @RequestBody UserProfileDTO dto, Principal principal) {
        System.out.println("Received DTO: " + dto.getPhone());
        return userService.updateUserProfile(principal.getName(), dto);
    }

    @PutMapping("/profile/change-password")
    public ResponseEntity<?> changePassword(Principal principal, @RequestBody Map<String, String> payload) {
        String username = principal.getName();
        String oldPassword = payload.get("oldPassword");
        String newPassword = payload.get("newPassword");

        try {
            userService.changePassword(username, oldPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "Ο κωδικός πρόσβασης άλλαξε επιτυχώς!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}