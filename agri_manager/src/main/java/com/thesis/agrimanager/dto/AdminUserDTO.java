package com.thesis.agrimanager.dto;

import java.util.Set;

public record AdminUserDTO(
        Long id,
        String username,
        String email,
        String fullName,
        boolean active,
        Set<String> roles
) {
}
