package com.expensetracker.api.dto;

import com.expensetracker.database.DatabaseManager.BudgetRecord;
import java.math.BigDecimal;
import java.math.RoundingMode;

public class BudgetDTO {
    private int budgetId;
    private int categoryId;
    private String categoryName;
    private int month;
    private int year;
    private double budgetAmount;
    private double amountSpent;
    private double remainingAmount;
    private double percentageUsed;
    private String status;

    public BudgetDTO() {}

    public static BudgetDTO fromRecord(BudgetRecord record) {
        if (record == null) return null;

        BigDecimal budget = BigDecimal.valueOf(record.budgetAmount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal spent = BigDecimal.valueOf(record.amountSpent).setScale(2, RoundingMode.HALF_UP);
        BigDecimal remaining = budget.subtract(spent).setScale(2, RoundingMode.HALF_UP);

        BigDecimal percentage;
        if (budget.compareTo(BigDecimal.ZERO) > 0) {
            percentage = spent.multiply(BigDecimal.valueOf(100)).divide(budget, 1, RoundingMode.HALF_UP);
        } else {
            percentage = BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP);
        }

        double pct = percentage.doubleValue();
        String status;
        if (pct >= 100.0) {
            status = "EXCEEDED";
        } else if (pct >= 90.0) {
            status = "WARNING";
        } else if (pct >= 75.0) {
            status = "APPROACHING";
        } else {
            status = "NORMAL";
        }

        BudgetDTO dto = new BudgetDTO();
        dto.budgetId = record.budgetId;
        dto.categoryId = record.categoryId;
        dto.categoryName = record.categoryName;
        dto.month = record.month;
        dto.year = record.year;
        dto.budgetAmount = budget.doubleValue();
        dto.amountSpent = spent.doubleValue();
        dto.remainingAmount = remaining.doubleValue();
        dto.percentageUsed = pct;
        dto.status = status;
        return dto;
    }

    public int getBudgetId() { return budgetId; }
    public void setBudgetId(int budgetId) { this.budgetId = budgetId; }

    public int getCategoryId() { return categoryId; }
    public void setCategoryId(int categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public int getMonth() { return month; }
    public void setMonth(int month) { this.month = month; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public double getBudgetAmount() { return budgetAmount; }
    public void setBudgetAmount(double budgetAmount) { this.budgetAmount = budgetAmount; }

    public double getAmountSpent() { return amountSpent; }
    public void setAmountSpent(double amountSpent) { this.amountSpent = amountSpent; }

    public double getRemainingAmount() { return remainingAmount; }
    public void setRemainingAmount(double remainingAmount) { this.remainingAmount = remainingAmount; }

    public double getPercentageUsed() { return percentageUsed; }
    public void setPercentageUsed(double percentageUsed) { this.percentageUsed = percentageUsed; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
