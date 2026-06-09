package com.thesis.agrimanager.repository;

import com.thesis.agrimanager.model.Crop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CropRepository extends JpaRepository<Crop, Long> {
    // Βρίσκει όλες τις καλλιέργειες ενός συγκεκριμένου χωραφιού
    List<Crop> findByFieldId(Long fieldId);

    long countByFieldOwnerUsername(String username);

    long countByFieldOwnerId(Long ownerId);

    @Query("""
            SELECT c.type AS cropType, COALESCE(SUM(f.area), 0) AS totalAcres
            FROM Crop c
            JOIN c.field f
            WHERE c.type IS NOT NULL AND c.type <> ''
            GROUP BY c.type
            ORDER BY totalAcres DESC
            """)
    List<CropDistributionProjection> getGlobalCropDistribution();

    @Query("""
            SELECT c.type AS cropType, COALESCE(SUM(f.area), 0) AS totalAcres
            FROM Crop c
            JOIN c.field f
            WHERE f.owner.id = :ownerId
              AND c.type IS NOT NULL
              AND c.type <> ''
            GROUP BY c.type
            ORDER BY totalAcres DESC
            """)
    List<CropDistributionProjection> getCropDistributionByOwnerId(@Param("ownerId") Long ownerId);

    interface CropDistributionProjection {
        String getCropType();
        Double getTotalAcres();
    }
}
