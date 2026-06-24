package com.thesis.agrimanager.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import org.locationtech.jts.geom.Polygon;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "crops")
public class Crop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type;
    private String variety;
    private LocalDate plantingDate;
    private Double harvestYield;
    private BigDecimal sellingPricePerKg;

    @Column(columnDefinition = "geometry(Polygon, 4326)")
    private Polygon zoneBoundary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_id")
    private Field field;

    @OneToMany(mappedBy = "crop", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Task> tasks = new ArrayList<>();

    // Επιστρέφει ζητούμενα δεδομένα.
    public Long getId() { return id; }
    // Ενημερώνει τιμή πεδίου.
    public void setId(Long id) { this.id = id; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public String getType() { return type; }
    // Ενημερώνει τιμή πεδίου.
    public void setType(String type) { this.type = type; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public String getVariety() { return variety; }
    // Ενημερώνει τιμή πεδίου.
    public void setVariety(String variety) { this.variety = variety; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public LocalDate getPlantingDate() { return plantingDate; }
    // Ενημερώνει τιμή πεδίου.
    public void setPlantingDate(LocalDate plantingDate) { this.plantingDate = plantingDate; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Double getHarvestYield() { return harvestYield; }
    // Ενημερώνει τιμή πεδίου.
    public void setHarvestYield(Double harvestYield) { this.harvestYield = harvestYield; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public BigDecimal getSellingPricePerKg() { return sellingPricePerKg; }
    // Ενημερώνει τιμή πεδίου.
    public void setSellingPricePerKg(BigDecimal sellingPricePerKg) { this.sellingPricePerKg = sellingPricePerKg; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Field getField() { return field; }
    // Ενημερώνει τιμή πεδίου.
    public void setField(Field field) { this.field = field; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Polygon getZoneBoundary() { return zoneBoundary; }
    // Ενημερώνει τιμή πεδίου.
    public void setZoneBoundary(Polygon zoneBoundary) { this.zoneBoundary = zoneBoundary; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public List<Task> getTasks() { return tasks; }
    // Ενημερώνει τιμή πεδίου.
    public void setTasks(List<Task> tasks) { this.tasks = tasks; }
}
