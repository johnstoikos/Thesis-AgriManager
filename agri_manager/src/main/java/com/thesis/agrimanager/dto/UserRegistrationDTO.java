package com.thesis.agrimanager.dto;

public record UserRegistrationDTO(
        String username,
        String email,
        String password,
        String fullName
) {
}
