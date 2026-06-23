package com.thesis.agrimanager.service;

import com.thesis.agrimanager.model.Task;
import com.thesis.agrimanager.model.User;
import com.thesis.agrimanager.repository.TaskRepository;
import com.thesis.agrimanager.repository.UserRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfitService {
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final Clock clock;

    @Autowired
    public UserProfitService(UserRepository userRepository, TaskRepository taskRepository) {
        this(userRepository, taskRepository, Clock.systemDefaultZone());
    }

    UserProfitService(UserRepository userRepository, TaskRepository taskRepository, Clock clock) {
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.clock = clock;
    }

    @Transactional
    public FinancialSnapshot getSnapshot(String username) {
        User user = findLockedUser(username);
        prepareCurrentPeriods(user);
        userRepository.save(user);
        return snapshot(user);
    }

    @Transactional
    public BigDecimal ensureInitialized(String username) {
        return getSnapshot(username).semesterProfit();
    }

    @Transactional
    public FinancialSnapshot recordTask(
            User owner,
            BigDecimal revenue,
            BigDecimal expense
    ) {
        User user = findLockedUser(owner.getUsername());
        prepareCurrentPeriods(user);

        BigDecimal normalizedRevenue = zeroIfNull(revenue);
        BigDecimal normalizedExpense = zeroIfNull(expense);
        user.setMonthlyRevenue(user.getMonthlyRevenue().add(normalizedRevenue));
        user.setMonthlyExpenses(user.getMonthlyExpenses().add(normalizedExpense));
        user.setTotalProfit(
                user.getTotalProfit().add(normalizedRevenue).subtract(normalizedExpense)
        );

        syncOwner(owner, user);
        userRepository.save(user);
        return snapshot(user);
    }

    @Transactional
    public FinancialSnapshot recordRevenue(User owner, BigDecimal revenue) {
        return recordTask(owner, revenue, BigDecimal.ZERO);
    }

    @Transactional
    public FinancialSnapshot adjustExpense(User owner, BigDecimal expenseDelta) {
        User user = findLockedUser(owner.getUsername());
        prepareCurrentPeriods(user);

        BigDecimal normalizedDelta = zeroIfNull(expenseDelta);
        user.setMonthlyExpenses(user.getMonthlyExpenses().add(normalizedDelta));
        user.setTotalProfit(user.getTotalProfit().subtract(normalizedDelta));

        syncOwner(owner, user);
        userRepository.save(user);
        return snapshot(user);
    }

    @Transactional
    public void preserveFinancialsAfterDeletion(User owner) {
        User user = findLockedUser(owner.getUsername());
        prepareCurrentPeriods(user);
        syncOwner(owner, user);
        userRepository.save(user);
    }

    @Transactional
    public FinancialSnapshot resetFinancialData(String username, FinancialResetTarget target) {
        User user = findLockedUser(username);
        prepareCurrentPeriods(user);

        switch (target) {
            case REVENUE -> user.setMonthlyRevenue(BigDecimal.ZERO);
            case EXPENSES -> user.setMonthlyExpenses(BigDecimal.ZERO);
            case PROFIT -> user.setTotalProfit(BigDecimal.ZERO);
            case ALL -> {
                user.setMonthlyRevenue(BigDecimal.ZERO);
                user.setMonthlyExpenses(BigDecimal.ZERO);
                user.setTotalProfit(BigDecimal.ZERO);
            }
        }

        userRepository.save(user);
        return snapshot(user);
    }

    public BigDecimal bookHarvestRevenue(Task task) {
        BigDecimal revenue = calculateHarvestRevenue(task);
        task.setBookedRevenue(revenue);
        return revenue;
    }

    public BigDecimal getHarvestRevenue(Task task) {
        if (task.getBookedRevenue() != null) {
            return task.getBookedRevenue();
        }
        return calculateHarvestRevenue(task);
    }

    public boolean isCompletedHarvest(Task task) {
        return isHarvestTask(task.getTaskType())
                && ("COMPLETED".equalsIgnoreCase(task.getStatus())
                || Integer.valueOf(100).equals(task.getCompletionPercentage()));
    }

    private User findLockedUser(String username) {
        return userRepository.findByUsernameForFinancialUpdate(username)
                .orElseThrow(() -> new RuntimeException("Ο χρήστης " + username + " δεν βρέθηκε."));
    }

    private void prepareCurrentPeriods(User user) {
        LocalDate today = LocalDate.now(clock);
        LocalDate currentMonthStart = today.withDayOfMonth(1);
        LocalDate currentProfitPeriodStart = semesterStart(today);
        List<Task> existingTasks = null;

        if (user.getMonthlyFinancialPeriodStart() == null) {
            existingTasks = taskRepository.findAllForFarmerProfit(user.getUsername());
            user.setMonthlyFinancialPeriodStart(currentMonthStart);
            if (user.getMonthlyRevenue() == null) {
                user.setMonthlyRevenue(calculateRevenue(existingTasks, currentMonthStart, today));
            }
            if (user.getMonthlyExpenses() == null) {
                user.setMonthlyExpenses(calculateExpenses(existingTasks, currentMonthStart, today));
            }
        } else if (!user.getMonthlyFinancialPeriodStart().equals(currentMonthStart)) {
            user.setMonthlyFinancialPeriodStart(currentMonthStart);
            user.setMonthlyRevenue(BigDecimal.ZERO);
            user.setMonthlyExpenses(BigDecimal.ZERO);
        }

        user.setMonthlyRevenue(zeroIfNull(user.getMonthlyRevenue()));
        user.setMonthlyExpenses(zeroIfNull(user.getMonthlyExpenses()));

        if (user.getProfitPeriodStart() == null) {
            user.setProfitPeriodStart(currentProfitPeriodStart);
            if (user.getTotalProfit() == null) {
                if (existingTasks == null) {
                    existingTasks = taskRepository.findAllForFarmerProfit(user.getUsername());
                }
                user.setTotalProfit(
                        calculateRevenue(existingTasks, currentProfitPeriodStart, today)
                                .subtract(calculateExpenses(existingTasks, currentProfitPeriodStart, today))
                );
            }
        } else if (!user.getProfitPeriodStart().equals(currentProfitPeriodStart)) {
            user.setProfitPeriodStart(currentProfitPeriodStart);
            user.setTotalProfit(BigDecimal.ZERO);
        }

        user.setTotalProfit(zeroIfNull(user.getTotalProfit()));
    }

    private BigDecimal calculateRevenue(List<Task> tasks, LocalDate start, LocalDate end) {
        return tasks.stream()
                .filter(task -> isWithinPeriod(task, start, end))
                .map(task -> {
                    if (isCompletedHarvest(task) && task.getBookedRevenue() == null) {
                        return bookHarvestRevenue(task);
                    }
                    return getHarvestRevenue(task);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateExpenses(List<Task> tasks, LocalDate start, LocalDate end) {
        return tasks.stream()
                .filter(task -> isWithinPeriod(task, start, end))
                .map(Task::getCost)
                .map(this::zeroIfNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private boolean isWithinPeriod(Task task, LocalDate start, LocalDate end) {
        LocalDate taskDate = task.getTaskDate();
        return taskDate != null && !taskDate.isBefore(start) && !taskDate.isAfter(end);
    }

    private LocalDate semesterStart(LocalDate date) {
        return LocalDate.of(date.getYear(), date.getMonthValue() <= 6 ? 1 : 7, 1);
    }

    private FinancialSnapshot snapshot(User user) {
        LocalDate profitStart = user.getProfitPeriodStart();
        return new FinancialSnapshot(
                user.getMonthlyRevenue(),
                user.getMonthlyExpenses(),
                user.getTotalProfit(),
                user.getMonthlyFinancialPeriodStart(),
                profitStart,
                profitStart.plusMonths(6).minusDays(1)
        );
    }

    private void syncOwner(User owner, User storedUser) {
        owner.setMonthlyRevenue(storedUser.getMonthlyRevenue());
        owner.setMonthlyExpenses(storedUser.getMonthlyExpenses());
        owner.setMonthlyFinancialPeriodStart(storedUser.getMonthlyFinancialPeriodStart());
        owner.setTotalProfit(storedUser.getTotalProfit());
        owner.setProfitPeriodStart(storedUser.getProfitPeriodStart());
    }

    private BigDecimal calculateHarvestRevenue(Task task) {
        if (!isCompletedHarvest(task)
                || task.getHarvestedYieldAmount() == null
                || task.getCrop().getSellingPricePerKg() == null) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(task.getHarvestedYieldAmount())
                .multiply(task.getCrop().getSellingPricePerKg());
    }

    private boolean isHarvestTask(String taskType) {
        if (taskType == null) {
            return false;
        }
        String normalizedType = taskType.trim().toUpperCase(Locale.ROOT);
        return "HARVEST".equals(normalizedType)
                || "ΣΥΓΚΟΜΙΔΗ".equals(normalizedType)
                || "ΣΥΓΚΟΜΙΔΉ".equals(normalizedType);
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    public record FinancialSnapshot(
            BigDecimal monthlyRevenue,
            BigDecimal monthlyExpenses,
            BigDecimal semesterProfit,
            LocalDate monthlyPeriodStart,
            LocalDate profitPeriodStart,
            LocalDate profitPeriodEnd
    ) {
    }

    public enum FinancialResetTarget {
        REVENUE,
        EXPENSES,
        PROFIT,
        ALL
    }
}
