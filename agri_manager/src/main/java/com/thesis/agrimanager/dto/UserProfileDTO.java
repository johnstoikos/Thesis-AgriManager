package com.thesis.agrimanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Set;

public class UserProfileDTO {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    @NotBlank(message = "Phone is required")
    @Size(min = 10, max = 10, message = "Invalid phone length")
    @Pattern(regexp = "\\d{10}", message = "Invalid phone format")
    private String phone;
    private String profilePhoto;
    private Set<String> roles;

    public UserProfileDTO() {}

    public UserProfileDTO(Long id, String username, String email, String fullName, String phone, String profilePhoto) {
        this(id, username, email, fullName, phone, profilePhoto, Set.of());
    }

    public UserProfileDTO(Long id, String username, String email, String fullName, String phone, String profilePhoto, Set<String> roles) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.phone = phone;
        this.profilePhoto = profilePhoto;
        this.roles = roles;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getPhone() { return phone; }
    public String getProfilePhoto() { return profilePhoto; }
    public Set<String> getRoles() { return roles; }

    public void setId(Long id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setProfilePhoto(String profilePhoto) { this.profilePhoto = profilePhoto; }
    public void setRoles(Set<String> roles) { this.roles = roles; }
}
