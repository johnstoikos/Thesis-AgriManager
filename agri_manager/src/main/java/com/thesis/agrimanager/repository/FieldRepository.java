package com.thesis.agrimanager.repository;

import com.thesis.agrimanager.model.Field;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FieldRepository extends JpaRepository<Field, Long> {

    // Για το getAllFields()
    List<Field> findByOwnerUsername(String username);

    // Για το getFieldsByUsername()
    List<Field> findByOwnerId(Long ownerId);

    // Για το Security check (findByIdAndOwnerUsername)
    Optional<Field> findByIdAndOwnerUsername(Long id, String username);
}