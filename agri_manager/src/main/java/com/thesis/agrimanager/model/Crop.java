package com.thesis.agrimanager.model;

import jakarta.persistence.*;
import org.locationtech.jts.geom.Polygon; // Η γεωμετρία της ζώνης
import java.time.LocalDate;

@Entity
@Table(name = "crops")
public class Crop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type;
    private String variety;
    private LocalDate plantingDate;

    // Η συγκεκριμένη περιοχή μέσα στο χωράφι που καταλαμβάνει το crop
    @Column(columnDefinition = "geometry(Polygon, 4326)")
    private Polygon zoneBoundary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_id")
    private Field field;

    // Getters και Setters
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
    public Polygon getZoneBoundary() {return zoneBoundary;}
    public void setZoneBoundary(Polygon zoneBoundary) {this.zoneBoundary = zoneBoundary;}




}