package com.thesis.agrimanager.repository;

import com.thesis.agrimanager.model.FinancialRecord;
import com.thesis.agrimanager.model.FinancialRecordType;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialRecordRepository extends JpaRepository<FinancialRecord, Long> {
    // Αναζητά εγγραφές.
    List<FinancialRecord> findByOwnerUsername(String ownerUsername);

    // Αναζητά εγγραφές.
    List<FinancialRecord> findByOwnerIdAndRecordDateBetween(Long ownerId, LocalDate startDate, LocalDate endDate);

    // Αναζητά εγγραφές.
    List<FinancialRecord> findByRecordDateBetween(LocalDate startDate, LocalDate endDate);

    // Διαγράφει εγγραφές.
    long deleteByOwnerUsername(String ownerUsername);

    // Διαγράφει εγγραφές.
    long deleteByOwnerUsernameAndType(String ownerUsername, FinancialRecordType type);
}
