package com.thesis.agrimanager.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

@Entity
@Table(name = "users")

public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String fullName;

    private String phone;

    @Column(columnDefinition = "text")
    private String profilePhoto;

    private Boolean active = true;

    @Column(precision = 14, scale = 2)
    private BigDecimal totalProfit;

    @Column(precision = 14, scale = 2)
    private BigDecimal monthlyRevenue;

    @Column(precision = 14, scale = 2)
    private BigDecimal monthlyExpenses;

    private LocalDate monthlyFinancialPeriodStart;

    private LocalDate profitPeriodStart;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    private Set<String> roles;


    // Επιστρέφει ζητούμενα δεδομένα.
    public Set<String> getRoles() {
        return roles;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Long getId() {
        return id;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public String getUsername() {
        return username;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public String getEmail() {
        return email;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public String getFullName() {
        return fullName;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public String getPassword() {
        return password;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public String getPhone() {
        return phone;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public String getProfilePhoto() {
        return profilePhoto;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Boolean getActive() {
        return active;
    }

    // Ελέγχει συνθήκη.
    public boolean isActive() {
        return active == null || active;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public BigDecimal getTotalProfit() {
        return totalProfit;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public BigDecimal getMonthlyRevenue() {
        return monthlyRevenue;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public BigDecimal getMonthlyExpenses() {
        return monthlyExpenses;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public LocalDate getMonthlyFinancialPeriodStart() {
        return monthlyFinancialPeriodStart;
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public LocalDate getProfitPeriodStart() {
        return profitPeriodStart;
    }

    // Ενημερώνει τιμή πεδίου.
    public void setId(Long id) {
        this.id = id;
    }

    // Ενημερώνει τιμή πεδίου.
    public void setUsername(String username) {
        this.username = username;
    }

    // Ενημερώνει τιμή πεδίου.
    public void setEmail(String email) {
        this.email = email;
    }

    // Ενημερώνει τιμή πεδίου.
    public void setPassword(String password) {
        this.password = password;
    }

    // Ενημερώνει τιμή πεδίου.
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    // Ενημερώνει τιμή πεδίου.
    public void setPhone(String phone) {
        this.phone = phone;
    }

    // Ενημερώνει τιμή πεδίου.
    public void setProfilePhoto(String profilePhoto) {
        this.profilePhoto = profilePhoto;
    }

    // Ενημερώνει τιμή πεδίου.
    public void setActive(Boolean active) {
        this.active = active;
    }

    // Ενημερώνει τιμή πεδίου.
    public void setTotalProfit(BigDecimal totalProfit) {
        this.totalProfit = totalProfit;
    }

    // Ενημερώνει τιμή πεδίου.
    public void setMonthlyRevenue(BigDecimal monthlyRevenue) {
        this.monthlyRevenue = monthlyRevenue;
    }

    // Ενημερώνει τιμή πεδίου.
    public void setMonthlyExpenses(BigDecimal monthlyExpenses) {
        this.monthlyExpenses = monthlyExpenses;
    }

    // Ενημερώνει τιμή πεδίου.
    public void setMonthlyFinancialPeriodStart(LocalDate monthlyFinancialPeriodStart) {
        this.monthlyFinancialPeriodStart = monthlyFinancialPeriodStart;
    }

    // Ενημερώνει τιμή πεδίου.
    public void setProfitPeriodStart(LocalDate profitPeriodStart) {
        this.profitPeriodStart = profitPeriodStart;
    }

    // Ενημερώνει τιμή πεδίου.
    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }

}
