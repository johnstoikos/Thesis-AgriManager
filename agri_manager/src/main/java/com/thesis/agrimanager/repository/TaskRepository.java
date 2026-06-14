package com.thesis.agrimanager.repository;

import com.thesis.agrimanager.model.Task;
import com.thesis.agrimanager.dto.FinancialStatsDTO;
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
    List<Task> findByCropId(Long cropId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Task t WHERE t.id = :id")
    Optional<Task> findByIdForProgressUpdate(@Param("id") Long id);

    long countByStatusAndCropFieldOwnerUsername(String status, String username);

    @Query("""
            SELECT COUNT(t)
            FROM Task t
            WHERE t.crop.field.owner.id = :ownerId
              AND 'ROLE_USER' MEMBER OF t.crop.field.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF t.crop.field.owner.roles
            """)
    long countByCropFieldOwnerId(@Param("ownerId") Long ownerId);

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

    @Query("""
            SELECT COUNT(t)
            FROM Task t
            WHERE t.status = :status
              AND 'ROLE_USER' MEMBER OF t.crop.field.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF t.crop.field.owner.roles
            """)
    long countByStatusForFarmers(@Param("status") String status);

    @Query("""
            SELECT COUNT(t)
            FROM Task t
            WHERE 'ROLE_USER' MEMBER OF t.crop.field.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF t.crop.field.owner.roles
            """)
    long countOwnedByFarmers();

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
            JOIN FETCH t.crop c
            JOIN FETCH c.field f
            WHERE f.owner.username = :username
              AND t.taskDate IS NOT NULL
              AND 'ROLE_USER' MEMBER OF f.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF f.owner.roles
            ORDER BY t.taskDate
            """)
    List<Task> findForFarmerFinancials(@Param("username") String username);

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

    @Query("""
            SELECT t
            FROM Task t
            JOIN FETCH t.crop c
            JOIN FETCH c.field f
            WHERE 'ROLE_USER' MEMBER OF f.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF f.owner.roles
            """)
    List<Task> findAllOwnedByFarmers();

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

    @Query("""
            SELECT t
            FROM Task t
            WHERE t.status = 'PENDING'
              AND t.taskDate <= :date
              AND t.crop.field.owner.username = :username
            ORDER BY t.taskDate ASC
            """)
    List<Task> findPendingUrgentTasks(@Param("username") String username, @Param("date") LocalDate date);

    @Query("""
            SELECT COALESCE(SUM(t.cost), 0)
            FROM Task t
            WHERE t.status = 'COMPLETED'
              AND 'ROLE_USER' MEMBER OF t.crop.field.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF t.crop.field.owner.roles
            """)
    BigDecimal sumCompletedTaskCost();

    @Query("""
            SELECT COALESCE(SUM(t.cost), 0)
            FROM Task t
            WHERE t.status = 'COMPLETED'
              AND t.crop.field.owner.id = :ownerId
              AND 'ROLE_USER' MEMBER OF t.crop.field.owner.roles
              AND 'ROLE_ADMIN' NOT MEMBER OF t.crop.field.owner.roles
            """)
    BigDecimal sumCompletedTaskCostByOwnerId(@Param("ownerId") Long ownerId);

    @Query("""
            SELECT new com.thesis.agrimanager.dto.FinancialStatsDTO(
                f.name,
                COALESCE(SUM(t.cost), 0)
            )
            FROM Task t
            JOIN t.crop c
            JOIN c.field f
            WHERE t.status = 'COMPLETED'
              AND f.owner.username = :username
            GROUP BY f.id, f.name
            ORDER BY f.name
            """)
    List<FinancialStatsDTO> sumCompletedTaskCostByFieldAndOwnerUsername(@Param("username") String username);

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
        String getMonth();
        Long getCompletedTasksCount();
    }
}
