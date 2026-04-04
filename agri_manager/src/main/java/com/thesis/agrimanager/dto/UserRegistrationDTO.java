package com.thesis.agrimanager.dto;

import lombok.Data;

@Data
public class UserRegistrationDTO {
    private String username;
    private String email;
    private String password;
    private String fullName;

    // ΠΡΕΠΕΙ ΝΑ ΕΧΕΙΣ ΑΥΤΟΥΣ ΤΟΥΣ GETTERS:
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getFullName() { return fullName; }

    // Και τους Setters (θα χρειαστούν για το JSON mapping):
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setFullName(String fullName) { this.fullName = fullName; }
}