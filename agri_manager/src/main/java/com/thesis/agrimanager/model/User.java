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


    public Set<String> getRoles() {
        return roles;
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

    public String getPassword() {
        return password;
    }

    public String getPhone() {
        return phone;
    }

    public String getProfilePhoto() {
        return profilePhoto;
    }

    public Boolean getActive() {
        return active;
    }

    public boolean isActive() {
        return active == null || active;
    }

    public BigDecimal getTotalProfit() {
        return totalProfit;
    }

    public BigDecimal getMonthlyRevenue() {
        return monthlyRevenue;
    }

    public BigDecimal getMonthlyExpenses() {
        return monthlyExpenses;
    }

    public LocalDate getMonthlyFinancialPeriodStart() {
        return monthlyFinancialPeriodStart;
    }

    public LocalDate getProfitPeriodStart() {
        return profitPeriodStart;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setProfilePhoto(String profilePhoto) {
        this.profilePhoto = profilePhoto;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public void setTotalProfit(BigDecimal totalProfit) {
        this.totalProfit = totalProfit;
    }

    public void setMonthlyRevenue(BigDecimal monthlyRevenue) {
        this.monthlyRevenue = monthlyRevenue;
    }

    public void setMonthlyExpenses(BigDecimal monthlyExpenses) {
        this.monthlyExpenses = monthlyExpenses;
    }

    public void setMonthlyFinancialPeriodStart(LocalDate monthlyFinancialPeriodStart) {
        this.monthlyFinancialPeriodStart = monthlyFinancialPeriodStart;
    }

    public void setProfitPeriodStart(LocalDate profitPeriodStart) {
        this.profitPeriodStart = profitPeriodStart;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }

}
