package com.expensetracker.api.dto;

import com.expensetracker.database.DatabaseManager.BudgetRecord;
import java.math.BigDecimal;
import java.math.RoundingMode;

public class BudgetAlertDTO {
    private int budgetId;
    private String categoryName;
    private double percentageUsed;
    private String status;
    private String message;

    public BudgetAlertDTO() {}

    public static BudgetAlertDTO fromRecord(BudgetRecord record) {
        if (record == null) return null;

        BigDecimal budget = BigDecimal.valueOf(record.budgetAmount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal spent = BigDecimal.valueOf(record.amountSpent).setScale(2, RoundingMode.HALF_UP);

        BigDecimal percentage;
        if (budget.compareTo(BigDecimal.ZERO) > 0) {
            percentage = spent.multiply(BigDecimal.valueOf(100)).divide(budget, 1, RoundingMode.HALF_UP);
        } else {
            percentage = BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP);
        }

        double pct = percentage.doubleValue();
        String status;
        String message;

        if (pct >= 100.0) {
            status = "EXCEEDED";
            message = "You have exceeded your " + record.categoryName + " budget (" + pct + "% used).";
        } else if (pct >= 90.0) {
            status = "WARNING";
            message = "You have used " + pct + "% of your " + record.categoryName + " budget.";
        } else if (pct >= 75.0) {
            status = "APPROACHING";
            message = "You have used " + pct + "% of your " + record.categoryName + " budget.";
        } else {
            status = "NORMAL";
            message = "Your " + record.categoryName + " budget is on track (" + pct + "% used).";
        }

        BudgetAlertDTO dto = new BudgetAlertDTO();
        dto.budgetId = record.budgetId;
        dto.categoryName = record.categoryName;
        dto.percentageUsed = pct;
        dto.status = status;
        dto.message = message;
        return dto;
    }

    public int getBudgetId() { return budgetId; }
    public void setBudgetId(int budgetId) { this.budgetId = budgetId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public double getPercentageUsed() { return percentageUsed; }
    public void setPercentageUsed(double percentageUsed) { this.percentageUsed = percentageUsed; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
