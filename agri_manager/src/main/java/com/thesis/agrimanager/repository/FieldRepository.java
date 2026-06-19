package com.thesis.agrimanager.repository;

import com.thesis.agrimanager.model.Field;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FieldRepository extends JpaRepository<Field, Long> {

    // Για το getAllFields()
    List<Field> findByOwnerUsername(String username);

    long countByOwnerUsername(String username);

    @Query("""
            SELECT COUNT(f)
            FROM Field f
            WHERE f.owner.id = :ownerId
              AND 'ROLE_USER' MEMBER OF f.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF f.owner.roles
            """)
    long countByOwnerId(@Param("ownerId") Long ownerId);

    // Για το getFieldsByUsername()
    List<Field> findByOwnerId(Long ownerId);

    @Query("""
            SELECT f
            FROM Field f
            JOIN FETCH f.owner o
            WHERE 'ROLE_USER' MEMBER OF f.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF f.owner.roles
            ORDER BY f.name
            """)
    List<Field> findAllOwnedByFarmers();

    @Query("""
            SELECT f
            FROM Field f
            JOIN FETCH f.owner o
            WHERE f.owner.id = :ownerId
              AND 'ROLE_USER' MEMBER OF f.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF f.owner.roles
            ORDER BY f.name
            """)
    List<Field> findOwnedByFarmerId(@Param("ownerId") Long ownerId);

    @Query("""
            SELECT COUNT(f)
            FROM Field f
            WHERE 'ROLE_USER' MEMBER OF f.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF f.owner.roles
            """)
    long countOwnedByFarmers();

    // Για το Security check (findByIdAndOwnerUsername)
    Optional<Field> findByIdAndOwnerUsername(Long id, String username);

    @Query("SELECT COALESCE(SUM(f.area), 0) FROM Field f")
    Double sumTotalArea();

    @Query("""
            SELECT COALESCE(SUM(f.area), 0)
            FROM Field f
            WHERE f.owner.id = :ownerId
              AND 'ROLE_USER' MEMBER OF f.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF f.owner.roles
            """)
    Double sumTotalAreaByOwnerId(@Param("ownerId") Long ownerId);
}
