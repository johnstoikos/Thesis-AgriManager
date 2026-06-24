package com.thesis.agrimanager.dto;

import jakarta.validation.constraints.NotBlank;

// Αρχικοποιεί τις εξαρτήσεις.
public record AiChatRequestDTO(
        @NotBlank(message = "Το μήνυμα δεν μπορεί να είναι κενό.")
        String message,
        String language
) {
    public AiChatRequestDTO(String message) {
        this(message, null);
    }
}
