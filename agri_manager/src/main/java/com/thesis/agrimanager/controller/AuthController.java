package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.UserRegistrationDTO;
import com.thesis.agrimanager.dto.LoginDTO;
import com.thesis.agrimanager.model.User;
import com.thesis.agrimanager.service.UserService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    // Αρχικοποιεί τις εξαρτήσεις.
    public AuthController(UserService userService) {
        this.userService = userService;
    }

    // Δημιουργεί νέα εγγραφή.
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserRegistrationDTO registrationDto) {
        try {
            User user = userService.registerNewUser(registrationDto);
            return ResponseEntity.ok("Επιτυχής εγγραφή! ID: " + user.getId());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Συνδέει τον χρήστη.
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO loginDto) {
        try {
            String token = userService.login(loginDto);
            return ResponseEntity.ok(Map.of("token", token));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }
}
