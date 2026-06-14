package com.thesis.agrimanager.dto;

import jakarta.validation.constraints.NotBlank;

public record AiChatRequestDTO(
        @NotBlank(message = "Το μήνυμα δεν μπορεί να είναι κενό.")
        String message
) {
}
