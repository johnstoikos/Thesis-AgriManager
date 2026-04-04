package com.thesis.agrimanager.repository;

import com.thesis.agrimanager.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByCropId(Long cropId);
}