package com.thesis.agrimanager.service;

import com.thesis.agrimanager.model.Crop;
import com.thesis.agrimanager.model.Field;
import com.thesis.agrimanager.model.FinancialRecord;
import com.thesis.agrimanager.model.FinancialRecordType;
import com.thesis.agrimanager.model.Task;
import com.thesis.agrimanager.model.User;
import com.thesis.agrimanager.repository.FinancialRecordRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancialRecordService {
    private final FinancialRecordRepository financialRecordRepository;

    public FinancialRecordService(FinancialRecordRepository financialRecordRepository) {
        this.financialRecordRepository = financialRecordRepository;
    }

    @Transactional
    public void recordHarvestRevenue(Task task, BigDecimal revenue) {
        if (isZero(revenue)) {
            return;
        }
        FinancialRecord record = fromTask(task, FinancialRecordType.REVENUE, revenue);
        record.setQuantityKg(task.getHarvestedYieldAmount());
        record.setUnitPrice(task.getCrop().getSellingPricePerKg());
        financialRecordRepository.save(record);
    }

    @Transactional
    public void recordTaskExpense(Task task, BigDecimal expense) {
        if (isZero(expense)) {
            return;
        }
        financialRecordRepository.save(fromTask(task, FinancialRecordType.EXPENSE, expense));
    }

    @Transactional(readOnly = true)
    public List<FinancialRecord> getRecords(Long ownerId, LocalDate startDate, LocalDate endDate) {
        return financialRecordRepository.findByOwnerIdAndRecordDateBetween(ownerId, startDate, endDate);
    }

    @Transactional(readOnly = true)
    public List<FinancialRecord> getRecords(LocalDate startDate, LocalDate endDate) {
        return financialRecordRepository.findByRecordDateBetween(startDate, endDate);
    }

    private FinancialRecord fromTask(Task task, FinancialRecordType type, BigDecimal amount) {
        Crop crop = task.getCrop();
        Field field = crop.getField();
        User owner = field.getOwner();

        FinancialRecord record = new FinancialRecord();
        record.setOwnerId(owner.getId());
        record.setOwnerUsername(owner.getUsername());
        record.setFieldId(field.getId());
        record.setFieldName(field.getName());
        record.setCropId(crop.getId());
        record.setCropType(crop.getType());
        record.setTaskId(task.getId());
        record.setType(type);
        record.setAmount(amount);
        record.setRecordDate(task.getTaskDate() == null ? LocalDate.now() : task.getTaskDate());
        return record;
    }

    private boolean isZero(BigDecimal value) {
        return value == null || value.signum() == 0;
    }
}
