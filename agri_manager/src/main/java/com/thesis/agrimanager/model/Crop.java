package com.thesis.agrimanager.model;

import jakarta.persistence.*;
import org.locationtech.jts.geom.Polygon;
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

    @Column(columnDefinition = "geometry(Polygon, 4326)")
    private Polygon zoneBoundary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_id")
    private Field field;

    // Προσθήκη CascadeType.ALL και orphanRemoval=true για τη διαδοχική διαγραφή
    @OneToMany(mappedBy = "crop", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Task> tasks = new ArrayList<>(); // Αρχικοποίηση λίστας

    // --- Getters και Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getVariety() { return variety; }
    public void setVariety(String variety) { this.variety = variety; }

    public LocalDate getPlantingDate() { return plantingDate; }
    public void setPlantingDate(LocalDate plantingDate) { this.plantingDate = plantingDate; }

    public Field getField() { return field; }
    public void setField(Field field) { this.field = field; }

    public Polygon getZoneBoundary() { return zoneBoundary; }
    public void setZoneBoundary(Polygon zoneBoundary) { this.zoneBoundary = zoneBoundary; }

    // Προσθήκη Getters/Setters για τα Tasks
    public List<Task> getTasks() { return tasks; }
    public void setTasks(List<Task> tasks) { this.tasks = tasks; }
}