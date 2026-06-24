package com.thesis.agrimanager.repository;

import com.thesis.agrimanager.model.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    // Αναζητά εγγραφές.
    Optional<User> findByUsername(String username);

    // Αναζητά εγγραφές.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.username = :username")
    Optional<User> findByUsernameForFinancialUpdate(@Param("username") String username);

    // Αναζητά εγγραφές.
    @Query("""
            SELECT DISTINCT u
            FROM User u
            WHERE 'ROLE_USER' MEMBER OF u.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF u.roles
            ORDER BY u.username
            """)
    List<User> findAllFarmers();

    // Αναζητά εγγραφές.
    @Query("""
            SELECT u
            FROM User u
            WHERE u.id = :id
              AND 'ROLE_USER' MEMBER OF u.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF u.roles
            """)
    Optional<User> findFarmerById(@Param("id") Long id);

    // Μετρά εγγραφές.
    @Query("""
            SELECT COUNT(u)
            FROM User u
            WHERE 'ROLE_USER' MEMBER OF u.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF u.roles
            """)
    long countFarmers();
}
