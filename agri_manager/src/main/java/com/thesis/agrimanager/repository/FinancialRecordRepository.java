package com.thesis.agrimanager.repository;

import com.thesis.agrimanager.model.FinancialRecord;
import com.thesis.agrimanager.model.FinancialRecordType;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialRecordRepository extends JpaRepository<FinancialRecord, Long> {
    List<FinancialRecord> findByOwnerUsername(String ownerUsername);

    List<FinancialRecord> findByOwnerIdAndRecordDateBetween(Long ownerId, LocalDate startDate, LocalDate endDate);

    List<FinancialRecord> findByRecordDateBetween(LocalDate startDate, LocalDate endDate);

    long deleteByOwnerUsername(String ownerUsername);

    long deleteByOwnerUsernameAndType(String ownerUsername, FinancialRecordType type);
}
