package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.LoginDTO;
import com.thesis.agrimanager.dto.UserProfileDTO;
import com.thesis.agrimanager.dto.UserRegistrationDTO;
import com.thesis.agrimanager.model.User;
import com.thesis.agrimanager.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;

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
        user.setActive(true);
        user.setTotalProfit(BigDecimal.ZERO);
        user.setMonthlyRevenue(BigDecimal.ZERO);
        user.setMonthlyExpenses(BigDecimal.ZERO);
        LocalDate today = LocalDate.now();
        user.setMonthlyFinancialPeriodStart(today.withDayOfMonth(1));
        user.setProfitPeriodStart(
                LocalDate.of(today.getYear(), today.getMonthValue() <= 6 ? 1 : 7, 1)
        );

        return userRepository.save(user);
    }

    public String login(LoginDTO loginDto) {
        User user = userRepository.findByUsername(loginDto.username())
                .orElseThrow(() -> new RuntimeException("Ο χρήστης δεν βρέθηκε"));

        if (!passwordEncoder.matches(loginDto.password(), user.getPassword())) {
            throw new RuntimeException("Λάθος κωδικός πρόσβασης");
        }

        if (!user.isActive()) {
            throw new RuntimeException("Ο λογαριασμός σας είναι απενεργοποιημένος. Επικοινωνήστε με τον διαχειριστή.");
        }

        return jwtService.generateToken(user.getUsername());
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Ο χρήστης " + username + " δεν βρέθηκε!"));
    }

    public UserProfileDTO updateUserProfile(String username, UserProfileDTO dto) {
        User user = getUserByUsername(username);

        System.out.println("Updating user profile for " + username + " with phone: " + dto.getPhone());
        user.setFullName(dto.getFullName());
        user.setPhone(dto.getPhone());
        user.setProfilePhoto(dto.getProfilePhoto());

        User savedUser = userRepository.save(user);
        System.out.println("Saved user phone: " + savedUser.getPhone());
        return toProfileDTO(savedUser);
    }

    public void changePassword(String username, String oldPassword, String newPassword) {
        User user = getUserByUsername(username);

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Ο παλιός κωδικός πρόσβασης είναι λανθασμένος!");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public UserProfileDTO toProfileDTO(User user) {
        return new UserProfileDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getProfilePhoto(),
                user.getRoles()
        );
    }
}
