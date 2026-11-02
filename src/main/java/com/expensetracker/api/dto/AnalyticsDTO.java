package com.expensetracker.api.dto;

import java.util.List;

public class AnalyticsDTO {
    private int month;
    private int year;
    private double totalExpenses;
    private double totalBudget;
    private double remainingBudget;
    private int transactionCount;
    private String highestSpendingCategory;
    private double highestSpendingAmount;
    private List<CategoryBreakdownItem> categoryBreakdown;
    private List<MonthlyTrendItem> monthlySpending;
    private List<ExpenseDTO> recentTransactions;

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

    public static class MonthlyTrendItem {
        private String month;
        private String monthYear;
        private double amount;

        public MonthlyTrendItem() {}

        public MonthlyTrendItem(String month, String monthYear, double amount) {
            this.month = month;
            this.monthYear = monthYear;
            this.amount = amount;
        }

        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }
        public String getMonthYear() { return monthYear; }
        public void setMonthYear(String monthYear) { this.monthYear = monthYear; }
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

    public String getHighestSpendingCategory() { return highestSpendingCategory; }
    public void setHighestSpendingCategory(String highestSpendingCategory) { this.highestSpendingCategory = highestSpendingCategory; }

    public double getHighestSpendingAmount() { return highestSpendingAmount; }
    public void setHighestSpendingAmount(double highestSpendingAmount) { this.highestSpendingAmount = highestSpendingAmount; }

    public List<CategoryBreakdownItem> getCategoryBreakdown() { return categoryBreakdown; }
    public void setCategoryBreakdown(List<CategoryBreakdownItem> categoryBreakdown) { this.categoryBreakdown = categoryBreakdown; }

    public List<MonthlyTrendItem> getMonthlySpending() { return monthlySpending; }
    public void setMonthlySpending(List<MonthlyTrendItem> monthlySpending) { this.monthlySpending = monthlySpending; }

    public List<ExpenseDTO> getRecentTransactions() { return recentTransactions; }
    public void setRecentTransactions(List<ExpenseDTO> recentTransactions) { this.recentTransactions = recentTransactions; }
}
