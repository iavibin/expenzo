package com.expensetracker.model;
public class Budget {
    private int    budgetId, userId, categoryId, month, year;
    private String categoryName;
    private double budgetAmount;
    public Budget() {}
    public Budget(int budgetId, int userId, int categoryId, String categoryName, int month, int year, double budgetAmount) {
        this.budgetId     = budgetId;
        this.userId       = userId;
        this.categoryId   = categoryId;
        this.categoryName = categoryName;
        this.month        = month;
        this.year         = year;
        this.budgetAmount = budgetAmount;
    }
    public int    getBudgetId()     { return budgetId;     }
    public int    getUserId()       { return userId;       }
    public int    getCategoryId()   { return categoryId;   }
    public String getCategoryName() { return categoryName; }
    public int    getMonth()        { return month;        }
    public int    getYear()         { return year;         }
    public double getBudgetAmount() { return budgetAmount; }
    public void setBudgetId(int id)            { this.budgetId     = id;     }
    public void setUserId(int id)              { this.userId       = id;     }
    public void setCategoryId(int id)          { this.categoryId   = id;     }
    public void setCategoryName(String name)   { this.categoryName = name;   }
    public void setMonth(int month)            { this.month        = month;  }
    public void setYear(int year)              { this.year         = year;   }
    public void setBudgetAmount(double amount) { this.budgetAmount = amount; }
}
