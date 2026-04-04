package com.thesis.agrimanager.dto;

import java.time.LocalDateTime;

public class ApiError {
    private String message;
    private LocalDateTime timestamp;
    private int status;

    public ApiError(String message, int status) {
        this.message = message;
        this.status = status;
        this.timestamp = LocalDateTime.now();
    }

    // Getters
    public String getMessage() { return message; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public int getStatus() { return status; }
}