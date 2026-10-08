package com.expensetracker.model;
public class Category {
    private int    categoryId, userId;
    private String categoryName;
    public Category() {}
    public Category(int categoryId, int userId, String categoryName) {
        this.categoryId   = categoryId;
        this.userId       = userId;
        this.categoryName = categoryName;
    }
    public int    getCategoryId()   { return categoryId;   }
    public int    getUserId()       { return userId;       }
    public String getCategoryName() { return categoryName; }
    public void setCategoryId(int id)        { this.categoryId   = id;   }
    public void setUserId(int id)            { this.userId       = id;   }
    public void setCategoryName(String name) { this.categoryName = name; }
        @Override
    public String toString() { return categoryName; }
}
