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

    long countByOwnerId(Long ownerId);

    // Για το getFieldsByUsername()
    List<Field> findByOwnerId(Long ownerId);

    // Για το Security check (findByIdAndOwnerUsername)
    Optional<Field> findByIdAndOwnerUsername(Long id, String username);

    @Query("SELECT COALESCE(SUM(f.area), 0) FROM Field f")
    Double sumTotalArea();

    @Query("SELECT COALESCE(SUM(f.area), 0) FROM Field f WHERE f.owner.id = :ownerId")
    Double sumTotalAreaByOwnerId(@Param("ownerId") Long ownerId);
}
