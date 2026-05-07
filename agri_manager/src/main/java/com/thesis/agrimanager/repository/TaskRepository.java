package com.thesis.agrimanager.repository;

import com.thesis.agrimanager.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByCropId(Long cropId);

    long countByStatusAndCropFieldOwnerUsername(String status, String username);

    @Query("""
            SELECT t
            FROM Task t
            WHERE t.status = 'PENDING'
              AND t.taskDate <= :date
              AND t.crop.field.owner.username = :username
            ORDER BY t.taskDate ASC
            """)
    List<Task> findPendingUrgentTasks(@Param("username") String username, @Param("date") LocalDate date);
}
