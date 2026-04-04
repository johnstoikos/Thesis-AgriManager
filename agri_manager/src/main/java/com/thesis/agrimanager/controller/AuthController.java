package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.UserRegistrationDTO;
import com.thesis.agrimanager.dto.LoginDTO;
import com.thesis.agrimanager.model.User;
import com.thesis.agrimanager.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Collections;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserRegistrationDTO registrationDto) {
        try {
            User user = userService.registerNewUser(registrationDto);
            return ResponseEntity.ok("Επιτυχής εγγραφή! ID: " + user.getId());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO loginDto) {
        try {
            String token = userService.login(loginDto);
            // Επιστρέφουμε το token σε ένα απλό JSON format
            return ResponseEntity.ok(Collections.singletonMap("token", token));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }
}