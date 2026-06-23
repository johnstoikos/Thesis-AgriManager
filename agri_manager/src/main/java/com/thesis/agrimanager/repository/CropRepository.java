package com.thesis.agrimanager.repository;

import com.thesis.agrimanager.model.Crop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface CropRepository extends JpaRepository<Crop, Long> {
    List<Crop> findByFieldId(Long fieldId);

    @Query("SELECT c FROM Crop c JOIN FETCH c.field f WHERE f.owner.username = :username")
    List<Crop> findByFieldOwnerUsername(@Param("username") String username);

    @Query("""
            SELECT c
            FROM Crop c
            JOIN FETCH c.field f
            WHERE c.plantingDate BETWEEN :startDate AND :endDate
              AND 'ROLE_USER' MEMBER OF f.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF f.owner.roles
            ORDER BY c.plantingDate
            """)
    List<Crop> findForAdminAnalytics(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
            SELECT c
            FROM Crop c
            JOIN FETCH c.field f
            JOIN FETCH f.owner o
            WHERE 'ROLE_USER' MEMBER OF f.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF f.owner.roles
            """)
    List<Crop> findAllOwnedByFarmers();

    @Query("""
            SELECT c
            FROM Crop c
            JOIN FETCH c.field f
            JOIN FETCH f.owner o
            WHERE f.owner.id = :ownerId
              AND 'ROLE_USER' MEMBER OF f.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF f.owner.roles
            """)
    List<Crop> findAllOwnedByFarmerId(@Param("ownerId") Long ownerId);

    @Query("""
            SELECT c
            FROM Crop c
            JOIN FETCH c.field f
            WHERE f.owner.id = :ownerId
              AND c.plantingDate BETWEEN :startDate AND :endDate
              AND 'ROLE_USER' MEMBER OF f.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF f.owner.roles
            ORDER BY c.plantingDate
            """)
    List<Crop> findForAdminAnalyticsByOwnerId(
            @Param("ownerId") Long ownerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    long countByFieldOwnerUsername(String username);

    @Query("""
            SELECT COUNT(c)
            FROM Crop c
            WHERE c.field.owner.id = :ownerId
              AND 'ROLE_USER' MEMBER OF c.field.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF c.field.owner.roles
            """)
    long countByFieldOwnerId(@Param("ownerId") Long ownerId);

    @Query("""
            SELECT COUNT(c)
            FROM Crop c
            WHERE 'ROLE_USER' MEMBER OF c.field.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF c.field.owner.roles
            """)
    long countOwnedByFarmers();

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
        String getCropType();
        Double getTotalAcres();
    }
}
