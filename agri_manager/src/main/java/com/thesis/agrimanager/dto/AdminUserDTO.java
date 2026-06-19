package com.thesis.agrimanager.dto;

import java.util.Set;

public class AdminUserDTO {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private boolean active;
    private Set<String> roles;

    public AdminUserDTO(Long id, String username, String email, String fullName, boolean active, Set<String> roles) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.active = active;
        this.roles = roles;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getFullName() {
        return fullName;
    }

    public boolean isActive() {
        return active;
    }

    public Set<String> getRoles() {
        return roles;
    }
}
