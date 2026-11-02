package com.expensetracker.api.dto;

import java.util.List;

public class MonthlyReportDTO {
    private int month;
    private int year;
    private double totalExpenses;
    private double totalBudget;
    private double remainingBudget;
    private int transactionCount;
    private List<CategoryBreakdownItem> categoryBreakdown;
    private List<BudgetDTO> budgetComparison;

    public static class CategoryBreakdownItem {
        private String categoryName;
        private double amount;

        public CategoryBreakdownItem() {}

        public CategoryBreakdownItem(String categoryName, double amount) {
            this.categoryName = categoryName;
            this.amount = amount;
        }

        public String getCategoryName() { return categoryName; }
        public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }
    }

    public int getMonth() { return month; }
    public void setMonth(int month) { this.month = month; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public double getTotalExpenses() { return totalExpenses; }
    public void setTotalExpenses(double totalExpenses) { this.totalExpenses = totalExpenses; }

    public double getTotalBudget() { return totalBudget; }
    public void setTotalBudget(double totalBudget) { this.totalBudget = totalBudget; }

    public double getRemainingBudget() { return remainingBudget; }
    public void setRemainingBudget(double remainingBudget) { this.remainingBudget = remainingBudget; }

    public int getTransactionCount() { return transactionCount; }
    public void setTransactionCount(int transactionCount) { this.transactionCount = transactionCount; }

    public List<CategoryBreakdownItem> getCategoryBreakdown() { return categoryBreakdown; }
    public void setCategoryBreakdown(List<CategoryBreakdownItem> categoryBreakdown) { this.categoryBreakdown = categoryBreakdown; }

    public List<BudgetDTO> getBudgetComparison() { return budgetComparison; }
    public void setBudgetComparison(List<BudgetDTO> budgetComparison) { this.budgetComparison = budgetComparison; }
}
