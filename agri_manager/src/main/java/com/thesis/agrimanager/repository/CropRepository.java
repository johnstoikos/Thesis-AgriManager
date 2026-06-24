package com.thesis.agrimanager.repository;

import com.thesis.agrimanager.model.Crop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CropRepository extends JpaRepository<Crop, Long> {
    // Αναζητά εγγραφές.
    List<Crop> findByFieldId(Long fieldId);

    // Αναζητά εγγραφές.
    @Query("SELECT c FROM Crop c JOIN FETCH c.field f WHERE f.owner.username = :username")
    List<Crop> findByFieldOwnerUsername(@Param("username") String username);

    // Αναζητά εγγραφές.
    @Query("""
            SELECT c
            FROM Crop c
            JOIN FETCH c.field f
            JOIN FETCH f.owner o
            WHERE 'ROLE_USER' MEMBER OF f.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF f.owner.roles
            """)
    List<Crop> findAllOwnedByFarmers();

    // Μετρά εγγραφές.
    long countByFieldOwnerUsername(String username);

    // Μετρά εγγραφές.
    @Query("""
            SELECT COUNT(c)
            FROM Crop c
            WHERE c.field.owner.id = :ownerId
              AND 'ROLE_USER' MEMBER OF c.field.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF c.field.owner.roles
            """)
    long countByFieldOwnerId(@Param("ownerId") Long ownerId);

    // Μετρά εγγραφές.
    @Query("""
            SELECT COUNT(c)
            FROM Crop c
            WHERE 'ROLE_USER' MEMBER OF c.field.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF c.field.owner.roles
            """)
    long countOwnedByFarmers();

    // Επιστρέφει ζητούμενα δεδομένα.
    @Query("""
            SELECT c.type AS cropType, COALESCE(SUM(f.area), 0) AS totalAcres
            FROM Crop c
            JOIN c.field f
            WHERE c.type IS NOT NULL AND c.type <> ''
              AND 'ROLE_USER' MEMBER OF f.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF f.owner.roles
            GROUP BY c.type
            ORDER BY totalAcres DESC
            """)
    List<CropDistributionProjection> getGlobalCropDistribution();

    // Επιστρέφει ζητούμενα δεδομένα.
    @Query("""
            SELECT c.type AS cropType, COALESCE(SUM(f.area), 0) AS totalAcres
            FROM Crop c
            JOIN c.field f
            WHERE f.owner.id = :ownerId
              AND c.type IS NOT NULL
              AND c.type <> ''
              AND 'ROLE_USER' MEMBER OF f.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF f.owner.roles
            GROUP BY c.type
            ORDER BY totalAcres DESC
            """)
    List<CropDistributionProjection> getCropDistributionByOwnerId(@Param("ownerId") Long ownerId);

    interface CropDistributionProjection {
        // Επιστρέφει ζητούμενα δεδομένα.
        String getCropType();
        // Επιστρέφει ζητούμενα δεδομένα.
        Double getTotalAcres();
    }
}
