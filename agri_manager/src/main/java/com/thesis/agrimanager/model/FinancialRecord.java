package com.thesis.agrimanager.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "financial_records")
public class FinancialRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long ownerId;
    private String ownerUsername;
    private Long fieldId;
    private String fieldName;
    private Long cropId;
    private String cropType;
    private Long taskId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FinancialRecordType type;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    private Double quantityKg;

    @Column(precision = 14, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private LocalDate recordDate;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // Συμπληρώνει προεπιλεγμένες τιμές.
    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (recordDate == null) {
            recordDate = LocalDate.now();
        }
    }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Long getId() { return id; }
    // Ενημερώνει τιμή πεδίου.
    public void setId(Long id) { this.id = id; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Long getOwnerId() { return ownerId; }
    // Ενημερώνει τιμή πεδίου.
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public String getOwnerUsername() { return ownerUsername; }
    // Ενημερώνει τιμή πεδίου.
    public void setOwnerUsername(String ownerUsername) { this.ownerUsername = ownerUsername; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Long getFieldId() { return fieldId; }
    // Ενημερώνει τιμή πεδίου.
    public void setFieldId(Long fieldId) { this.fieldId = fieldId; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public String getFieldName() { return fieldName; }
    // Ενημερώνει τιμή πεδίου.
    public void setFieldName(String fieldName) { this.fieldName = fieldName; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Long getCropId() { return cropId; }
    // Ενημερώνει τιμή πεδίου.
    public void setCropId(Long cropId) { this.cropId = cropId; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public String getCropType() { return cropType; }
    // Ενημερώνει τιμή πεδίου.
    public void setCropType(String cropType) { this.cropType = cropType; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Long getTaskId() { return taskId; }
    // Ενημερώνει τιμή πεδίου.
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public FinancialRecordType getType() { return type; }
    // Ενημερώνει τιμή πεδίου.
    public void setType(FinancialRecordType type) { this.type = type; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public BigDecimal getAmount() { return amount; }
    // Ενημερώνει τιμή πεδίου.
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Double getQuantityKg() { return quantityKg; }
    // Ενημερώνει τιμή πεδίου.
    public void setQuantityKg(Double quantityKg) { this.quantityKg = quantityKg; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public BigDecimal getUnitPrice() { return unitPrice; }
    // Ενημερώνει τιμή πεδίου.
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public LocalDate getRecordDate() { return recordDate; }
    // Ενημερώνει τιμή πεδίου.
    public void setRecordDate(LocalDate recordDate) { this.recordDate = recordDate; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public LocalDateTime getCreatedAt() { return createdAt; }
    // Ενημερώνει τιμή πεδίου.
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
