package com.thesis.agrimanager.model;

import org.locationtech.jts.geom.Polygon;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
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
import org.n52.jackson.datatype.jts.GeometryDeserializer;
import org.n52.jackson.datatype.jts.GeometrySerializer;

import java.util.List;

@Entity
@Table(name = "fields")
public class Field {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User owner;

    @Column(columnDefinition = "geometry(Polygon, 4326)")
    @JsonSerialize(using = GeometrySerializer.class)
    @JsonDeserialize(using = GeometryDeserializer.class)
    private Polygon boundary;

    private Double area;

    private String soilType;
    private Double soilPh;
    private String irrigationType;

    // Αρχικοποιεί τις εξαρτήσεις.
    public Field() {}

    // Επιστρέφει ζητούμενα δεδομένα.
    public Long getId() { return id; }
    // Ενημερώνει τιμή πεδίου.
    public void setId(Long id) { this.id = id; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public String getName() { return name; }
    // Ενημερώνει τιμή πεδίου.
    public void setName(String name) { this.name = name; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public User getOwner() { return owner; }
    // Ενημερώνει τιμή πεδίου.
    public void setOwner(User owner) { this.owner = owner; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Polygon getBoundary() { return boundary; }
    // Ενημερώνει τιμή πεδίου.
    public void setBoundary(Polygon boundary) { this.boundary = boundary; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Double getArea() { return area; }
    // Ενημερώνει τιμή πεδίου.
    public void setArea(Double area) { this.area = area; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public String getSoilType() { return soilType; }
    // Ενημερώνει τιμή πεδίου.
    public void setSoilType(String soilType) { this.soilType = soilType; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public Double getSoilPh() { return soilPh; }
    // Ενημερώνει τιμή πεδίου.
    public void setSoilPh(Double soilPh) { this.soilPh = soilPh; }

    // Επιστρέφει ζητούμενα δεδομένα.
    public String getIrrigationType() { return irrigationType; }
    // Ενημερώνει τιμή πεδίου.
    public void setIrrigationType(String irrigationType) { this.irrigationType = irrigationType; }

    @OneToMany(mappedBy = "field", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Crop> crops;

    // Επιστρέφει ζητούμενα δεδομένα.
    public List<Crop> getCrops() { return crops; }
    // Ενημερώνει τιμή πεδίου.
    public void setCrops(List<Crop> crops) { this.crops = crops; }
}
