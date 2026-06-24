package com.thesis.agrimanager.repository;

import com.thesis.agrimanager.model.Task;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {
    // Αναζητά εγγραφές.
    List<Task> findByCropId(Long cropId);

    // Αναζητά εγγραφές.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Task t WHERE t.id = :id")
    Optional<Task> findByIdForProgressUpdate(@Param("id") Long id);

    // Μετρά εγγραφές.
    long countByStatusAndCropFieldOwnerUsername(String status, String username);

    // Μετρά εγγραφές.
    @Query("""
            SELECT COUNT(t)
            FROM Task t
            WHERE t.crop.field.owner.id = :ownerId
              AND 'ROLE_USER' MEMBER OF t.crop.field.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF t.crop.field.owner.roles
            """)
    long countByCropFieldOwnerId(@Param("ownerId") Long ownerId);

    // Μετρά εγγραφές.
    @Query("""
            SELECT COUNT(t)
            FROM Task t
            WHERE t.status = :status
              AND t.crop.field.owner.id = :ownerId
              AND 'ROLE_USER' MEMBER OF t.crop.field.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF t.crop.field.owner.roles
            """)
    long countByStatusAndCropFieldOwnerId(
            @Param("status") String status,
            @Param("ownerId") Long ownerId
    );

    // Μετρά εγγραφές.
    @Query("""
            SELECT COUNT(t)
            FROM Task t
            WHERE t.status = :status
              AND 'ROLE_USER' MEMBER OF t.crop.field.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF t.crop.field.owner.roles
            """)
    long countByStatusForFarmers(@Param("status") String status);

    // Μετρά εγγραφές.
    @Query("""
            SELECT COUNT(t)
            FROM Task t
            WHERE 'ROLE_USER' MEMBER OF t.crop.field.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF t.crop.field.owner.roles
            """)
    long countOwnedByFarmers();

    // Αναζητά εγγραφές.
    @Query("""
            SELECT t
            FROM Task t
            JOIN FETCH t.crop c
            JOIN FETCH c.field f
            WHERE f.owner.username = :username
              AND 'ROLE_USER' MEMBER OF f.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF f.owner.roles
            """)
    List<Task> findAllForFarmerProfit(@Param("username") String username);

    // Αναζητά εγγραφές.
    @Query("""
            SELECT t
            FROM Task t
            JOIN FETCH t.crop c
            JOIN FETCH c.field f
            WHERE t.taskDate BETWEEN :startDate AND :endDate
              AND 'ROLE_USER' MEMBER OF f.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF f.owner.roles
            ORDER BY t.taskDate
            """)
    List<Task> findForAdminAnalytics(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Αναζητά εγγραφές.
    @Query("""
            SELECT t
            FROM Task t
            JOIN FETCH t.crop c
            JOIN FETCH c.field f
            WHERE 'ROLE_USER' MEMBER OF f.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF f.owner.roles
            """)
    List<Task> findAllOwnedByFarmers();

    // Αναζητά εγγραφές.
    @Query("""
            SELECT t
            FROM Task t
            JOIN FETCH t.crop c
            JOIN FETCH c.field f
            WHERE f.owner.id = :ownerId
              AND t.taskDate BETWEEN :startDate AND :endDate
              AND 'ROLE_USER' MEMBER OF f.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF f.owner.roles
            ORDER BY t.taskDate
            """)
    List<Task> findForAdminAnalyticsByOwnerId(
            @Param("ownerId") Long ownerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Αναζητά εγγραφές.
    @Query("""
            SELECT t
            FROM Task t
            WHERE t.status = 'PENDING'
              AND t.taskDate <= :date
              AND t.crop.field.owner.username = :username
            ORDER BY t.taskDate ASC
            """)
    List<Task> findPendingUrgentTasks(@Param("username") String username, @Param("date") LocalDate date);

    // Αθροίζει ποσά.
    @Query("""
            SELECT COALESCE(SUM(t.cost), 0)
            FROM Task t
            WHERE t.status = 'COMPLETED'
              AND t.crop.field.owner.id = :ownerId
              AND 'ROLE_USER' MEMBER OF t.crop.field.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF t.crop.field.owner.roles
            """)
    BigDecimal sumCompletedTaskCostByOwnerId(@Param("ownerId") Long ownerId);

    // Επιστρέφει ζητούμενα δεδομένα.
    @Query(value = """
            SELECT TO_CHAR(tasks.task_date, 'YYYY-MM') AS "month",
                   COUNT(*) AS "completedTasksCount"
            FROM tasks
            JOIN crops c ON tasks.crop_id = c.id
            JOIN fields f ON c.field_id = f.id
            JOIN user_roles farmer_role
              ON farmer_role.user_id = f.user_id
             AND farmer_role.roles = 'ROLE_USER'
            LEFT JOIN user_roles admin_role
              ON admin_role.user_id = f.user_id
             AND admin_role.roles = 'ROLE_ADMIN'
            WHERE tasks.status = 'COMPLETED'
              AND tasks.task_date IS NOT NULL
              AND admin_role.user_id IS NULL
            GROUP BY TO_CHAR(tasks.task_date, 'YYYY-MM')
            ORDER BY "month"
            """, nativeQuery = true)
    List<MonthlyActivityProjection> getCompletedTasksByMonth();

    // Επιστρέφει ζητούμενα δεδομένα.
    @Query(value = """
            SELECT TO_CHAR(t.task_date, 'YYYY-MM') AS "month",
                   COUNT(*) AS "completedTasksCount"
            FROM tasks t
            JOIN crops c ON t.crop_id = c.id
            JOIN fields f ON c.field_id = f.id
            WHERE t.status = 'COMPLETED'
              AND t.task_date IS NOT NULL
              AND f.user_id = :ownerId
              AND EXISTS (
                  SELECT 1
                  FROM user_roles farmer_role
                  WHERE farmer_role.user_id = f.user_id
                    AND farmer_role.roles = 'ROLE_USER'
              )
              AND NOT EXISTS (
                  SELECT 1
                  FROM user_roles admin_role
                  WHERE admin_role.user_id = f.user_id
                    AND admin_role.roles = 'ROLE_ADMIN'
              )
            GROUP BY TO_CHAR(t.task_date, 'YYYY-MM')
            ORDER BY "month"
            """, nativeQuery = true)
    List<MonthlyActivityProjection> getCompletedTasksByMonthAndOwnerId(@Param("ownerId") Long ownerId);

    interface MonthlyActivityProjection {
        // Επιστρέφει ζητούμενα δεδομένα.
        String getMonth();
        // Επιστρέφει ζητούμενα δεδομένα.
        Long getCompletedTasksCount();
    }
}
