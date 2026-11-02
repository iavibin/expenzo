package com.expensetracker.api.dto;

import com.expensetracker.model.Expense;
import java.time.LocalDate;

public class ExpenseDTO {
    private int expenseId;
    private String description;
    private double amount;
    private int categoryId;
    private String categoryName;
    private LocalDate expenseDate;
    private String paymentMode;

    public ExpenseDTO() {}

    public ExpenseDTO(int expenseId, String description, double amount, int categoryId,
                      String categoryName, LocalDate expenseDate, String paymentMode) {
        this.expenseId = expenseId;
        this.description = description;
        this.amount = amount;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.expenseDate = expenseDate;
        this.paymentMode = paymentMode;
    }

    public static ExpenseDTO fromModel(Expense expense) {
        if (expense == null) return null;
        return new ExpenseDTO(
            expense.getExpenseId(),
            expense.getDescription(),
            expense.getAmount(),
            expense.getCategoryId(),
            expense.getCategoryName(),
            expense.getExpenseDate(),
            expense.getPaymentMethod()
        );
    }

    public int getExpenseId() { return expenseId; }
    public void setExpenseId(int expenseId) { this.expenseId = expenseId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public int getCategoryId() { return categoryId; }
    public void setCategoryId(int categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }

    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }
}
