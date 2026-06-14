package com.thesis.agrimanager.repository;

import com.thesis.agrimanager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    @Query("""
            SELECT DISTINCT u
            FROM User u
            WHERE 'ROLE_USER' MEMBER OF u.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF u.roles
            ORDER BY u.username
            """)
    List<User> findAllFarmers();

    @Query("""
            SELECT u
            FROM User u
            WHERE u.id = :id
              AND 'ROLE_USER' MEMBER OF u.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF u.roles
            """)
    Optional<User> findFarmerById(@Param("id") Long id);

    @Query("""
            SELECT COUNT(u)
            FROM User u
            WHERE 'ROLE_USER' MEMBER OF u.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF u.roles
            """)
    long countFarmers();
}
