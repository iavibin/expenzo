package com.expensetracker.model;
import java.time.LocalDate;
public class Expense {
    private int        expenseId, userId, categoryId;
    private String     categoryName, paymentMethod, description;
    private double     amount;
    private LocalDate  expenseDate;
    public Expense() {}
    public Expense(int expenseId, int userId, int categoryId, String categoryName, double amount, LocalDate expenseDate,
                   String paymentMethod, String description) {
        this.expenseId     = expenseId;
        this.userId        = userId;
        this.categoryId    = categoryId;
        this.categoryName  = categoryName;
        this.amount        = amount;
        this.expenseDate   = expenseDate;
        this.paymentMethod = paymentMethod;
        this.description   = description;
    }
    public int       getExpenseId()     { return expenseId;     }
    public int       getUserId()        { return userId;        }
    public int       getCategoryId()    { return categoryId;    }
    public String    getCategoryName()  { return categoryName;  }
    public double    getAmount()        { return amount;        }
    public LocalDate getExpenseDate()   { return expenseDate;   }
    public String    getPaymentMethod() { return paymentMethod; }
    public String    getDescription()   { return description;   }
    public void setExpenseId(int id)             { this.expenseId     = id;     }
    public void setUserId(int id)                { this.userId        = id;     }
    public void setCategoryId(int id)            { this.categoryId    = id;     }
    public void setCategoryName(String name)     { this.categoryName  = name;   }
    public void setAmount(double amount)         { this.amount        = amount; }
    public void setExpenseDate(LocalDate date)   { this.expenseDate   = date;   }
    public void setPaymentMethod(String method)  { this.paymentMethod = method; }
    public void setDescription(String desc)      { this.description   = desc;   }
}
