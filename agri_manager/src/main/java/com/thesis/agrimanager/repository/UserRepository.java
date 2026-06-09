package com.thesis.agrimanager.repository;

import com.thesis.agrimanager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    @Query("SELECT COUNT(DISTINCT u) FROM User u JOIN u.roles role WHERE role = 'ROLE_USER'")
    long countFarmers();
}
