package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.LoginDTO;
import com.thesis.agrimanager.dto.UserRegistrationDTO;
import com.thesis.agrimanager.model.User;
import com.thesis.agrimanager.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Collections;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    // 1. Προσθέτουμε τη δήλωση του JwtService
    private final JwtService jwtService;

    // 2. Ενημερώνουμε τον Constructor για να δέχεται και το JwtService
    public UserService(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public User registerNewUser(UserRegistrationDTO registrationDto) {
        if (userRepository.findByUsername(registrationDto.getUsername()).isPresent()) {
            throw new RuntimeException("Το username χρησιμοποιείται ήδη");
        }

        User user = new User();
        user.setUsername(registrationDto.getUsername());
        user.setEmail(registrationDto.getEmail());
        user.setFullName(registrationDto.getFullName());

        user.setPassword(passwordEncoder.encode(registrationDto.getPassword()));
        user.setRoles(Collections.singleton("ROLE_USER"));

        return userRepository.save(user);
    }

    public String login(LoginDTO loginDto) {
        User user = userRepository.findByUsername(loginDto.getUsername())
                .orElseThrow(() -> new RuntimeException("Ο χρήστης δεν βρέθηκε"));

        if (!passwordEncoder.matches(loginDto.getPassword(), user.getPassword())) {
            throw new RuntimeException("Λάθος κωδικός πρόσβασης");
        }

        // Τώρα το jwtService αναγνωρίζεται κανονικά!
        return jwtService.generateToken(user.getUsername());
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Ο χρήστης " + username + " δεν βρέθηκε!"));
    }
}