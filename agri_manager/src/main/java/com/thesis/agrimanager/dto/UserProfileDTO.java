package com.thesis.agrimanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record UserProfileDTO(
        Long id,
        String username,
        String email,
        String fullName,
        @NotBlank(message = "Phone is required")
        @Size(min = 10, max = 10, message = "Invalid phone length")
        @Pattern(regexp = "\\d{10}", message = "Invalid phone format")
        String phone,
        String profilePhoto,
        Set<String> roles
) {
    public UserProfileDTO(Long id, String username, String email, String fullName, String phone, String profilePhoto) {
        this(id, username, email, fullName, phone, profilePhoto, Set.of());
    }
}
