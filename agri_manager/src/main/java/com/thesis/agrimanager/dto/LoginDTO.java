package com.thesis.agrimanager.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginDTO(
        @NotBlank(message = "Το username είναι υποχρεωτικό.")
        String username,
        @NotBlank(message = "Ο κωδικός πρόσβασης είναι υποχρεωτικός.")
        String password
) {
}
