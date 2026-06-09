package com.thesis.agrimanager.repository;

import com.thesis.agrimanager.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByCropId(Long cropId);

    long countByStatusAndCropFieldOwnerUsername(String status, String username);

    long countByCropFieldOwnerId(Long ownerId);

    long countByStatusAndCropFieldOwnerId(String status, Long ownerId);

    @Query("""
            SELECT t
            FROM Task t
            JOIN FETCH t.crop c
            JOIN FETCH c.field f
            WHERE t.status = :status
              AND f.owner.username = :username
            """)
    List<Task> findByStatusAndOwnerUsernameWithCropAndField(
            @Param("status") String status,
            @Param("username") String username
    );

    @Query("""
            SELECT t
            FROM Task t
            WHERE t.status = 'PENDING'
              AND t.taskDate <= :date
              AND t.crop.field.owner.username = :username
            ORDER BY t.taskDate ASC
            """)
    List<Task> findPendingUrgentTasks(@Param("username") String username, @Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(t.cost), 0) FROM Task t WHERE t.status = 'COMPLETED'")
    BigDecimal sumCompletedTaskCost();

    @Query("""
            SELECT COALESCE(SUM(t.cost), 0)
            FROM Task t
            WHERE t.status = 'COMPLETED'
              AND t.crop.field.owner.id = :ownerId
            """)
    BigDecimal sumCompletedTaskCostByOwnerId(@Param("ownerId") Long ownerId);

    @Query(value = """
            SELECT TO_CHAR(task_date, 'YYYY-MM') AS "month",
                   COUNT(*) AS "completedTasksCount"
            FROM tasks
            WHERE status = 'COMPLETED'
              AND task_date IS NOT NULL
            GROUP BY TO_CHAR(task_date, 'YYYY-MM')
            ORDER BY "month"
            """, nativeQuery = true)
    List<MonthlyActivityProjection> getCompletedTasksByMonth();

    @Query(value = """
            SELECT TO_CHAR(t.task_date, 'YYYY-MM') AS "month",
                   COUNT(*) AS "completedTasksCount"
            FROM tasks t
            JOIN crops c ON t.crop_id = c.id
            JOIN fields f ON c.field_id = f.id
            WHERE t.status = 'COMPLETED'
              AND t.task_date IS NOT NULL
              AND f.user_id = :ownerId
            GROUP BY TO_CHAR(t.task_date, 'YYYY-MM')
            ORDER BY "month"
            """, nativeQuery = true)
    List<MonthlyActivityProjection> getCompletedTasksByMonthAndOwnerId(@Param("ownerId") Long ownerId);

    interface MonthlyActivityProjection {
        String getMonth();
        Long getCompletedTasksCount();
    }
}
