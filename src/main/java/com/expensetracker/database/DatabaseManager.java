package com.expensetracker.database;
import com.expensetracker.model.User;
import java.sql.*;
public class DatabaseManager {
    private static String HOST = "localhost";
    private static String PORT = "3306";
    private static String DB_NAME = "expense_tracker";
    private static String USER = "root";
    private static String PASSWORD = "";
    private static String URL;

    static {
        try (java.io.FileInputStream fis = new java.io.FileInputStream(".env")) {
            java.util.Properties props = new java.util.Properties();
            props.load(fis);
            HOST = props.getProperty("DB_HOST", HOST);
            PORT = props.getProperty("DB_PORT", PORT);
            DB_NAME = props.getProperty("DB_NAME", DB_NAME);
            USER = props.getProperty("DB_USER", USER);
            PASSWORD = props.getProperty("DB_PASSWORD", PASSWORD);
        } catch (Exception e) {
            System.err.println("Warning: Could not load .env file. Using default credentials.");
        }
        URL = "jdbc:mysql://" + HOST + ":" + PORT + "/" + DB_NAME + "?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";
    }
    //  Connection
        public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }
        public static boolean testConnection() {
        try (Connection conn = getConnection()) {
            return conn != null && !conn.isClosed();
        } catch (SQLException e) {
            System.err.println("Database connection failed: " + e.getMessage());
            return false;
        }
    }
    //  Authentication
        public static boolean isEmailTaken(String email) throws SQLException {
        String sql = "SELECT COUNT(*) FROM users WHERE email = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email.trim().toLowerCase());
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        }
    }
        public static User registerUser(String name, String email, String password)
            throws SQLException {
        if (isEmailTaken(email)) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }
        // Single connection for the whole transaction
        try (Connection conn = getConnection()) {
            conn.setAutoCommit(false);   // Start transaction
            try {
                // 1. Insert the new user
                int userId = insertUser(conn, name, email, password);
                // 2. Insert default categories for this user
                insertDefaultCategories(conn, userId);
                conn.commit();
                return new User(userId, name, email.trim().toLowerCase(), password);
            } catch (SQLException e) {
                conn.rollback(); // Something failed â€” undo everything
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }
        private static int insertUser(Connection conn, String name,
                                  String email, String password)
            throws SQLException {
        String sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, name.trim());
            ps.setString(2, email.trim().toLowerCase());
            ps.setString(3, password);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) return keys.getInt(1);
                throw new SQLException("Failed to retrieve new user ID.");
            }
        }
    }
        private static void insertDefaultCategories(Connection conn, int userId)
            throws SQLException {
        String[] defaults = {"Food", "Transport", "Entertainment", "Shopping", "Health", "Other"};
        String sql = "INSERT INTO categories (user_id, category_name) VALUES (?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (String category : defaults) {
                ps.setInt(1, userId);
                ps.setString(2, category);
                ps.executeUpdate();
            }
        }
    }
        public static User loginUser(String email, String password) throws SQLException {
        String sql = "SELECT user_id, name, email, password " +
                     "FROM users WHERE email = ? AND password = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email.trim().toLowerCase());
            ps.setString(2, password);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new User(
                        rs.getInt("user_id"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("password")
                    );
                }
            }
        }
        return null;   // No match â€” wrong email or password
    }
    //  Categories
    public static java.util.List<com.expensetracker.model.Category> getAllCategories(int userId) throws SQLException {
        java.util.List<com.expensetracker.model.Category> categories = new java.util.ArrayList<>();
        String sql = "SELECT category_id, user_id, category_name FROM categories WHERE user_id = ? ORDER BY category_name";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    categories.add(new com.expensetracker.model.Category(
                        rs.getInt("category_id"),
                        rs.getInt("user_id"),
                        rs.getString("category_name")
                    ));
                }
            }
        }
        return categories;
    }
    public static void addCategory(int userId, String categoryName) throws SQLException {
        String sql = "INSERT INTO categories (user_id, category_name) VALUES (?, ?)";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setString(2, categoryName.trim());
            ps.executeUpdate();
        }
    }
    public static void deleteCategory(int categoryId, int userId) throws SQLException {
        String sql = "DELETE FROM categories WHERE category_id = ? AND user_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, categoryId);
            ps.setInt(2, userId);
            ps.executeUpdate();
        }
    }
    //  Expenses
    public static void addExpense(com.expensetracker.model.Expense expense) throws SQLException {
        String sql = "INSERT INTO expenses (user_id, category_id, amount, expense_date, payment_method, description) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, expense.getUserId());
            ps.setInt(2, expense.getCategoryId());
            ps.setDouble(3, expense.getAmount());
            ps.setDate(4, java.sql.Date.valueOf(expense.getExpenseDate()));
            ps.setString(5, expense.getPaymentMethod());
            ps.setString(6, expense.getDescription());
            ps.executeUpdate();
        }
    }
    public static void updateExpense(com.expensetracker.model.Expense expense) throws SQLException {
        String sql = "UPDATE expenses SET category_id = ?, amount = ?, expense_date = ?, " +
                     "payment_method = ?, description = ? WHERE expense_id = ? AND user_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, expense.getCategoryId());
            ps.setDouble(2, expense.getAmount());
            ps.setDate(3, java.sql.Date.valueOf(expense.getExpenseDate()));
            ps.setString(4, expense.getPaymentMethod());
            ps.setString(5, expense.getDescription());
            ps.setInt(6, expense.getExpenseId());
            ps.setInt(7, expense.getUserId());
            ps.executeUpdate();
        }
    }
    public static void deleteExpense(int expenseId, int userId) throws SQLException {
        String sql = "DELETE FROM expenses WHERE expense_id = ? AND user_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, expenseId);
            ps.setInt(2, userId);
            ps.executeUpdate();
        }
    }
    public static java.util.List<com.expensetracker.model.Expense> getAllExpenses(int userId) throws SQLException {
        java.util.List<com.expensetracker.model.Expense> expenses = new java.util.ArrayList<>();
        String sql = "SELECT e.expense_id, e.user_id, e.category_id, c.category_name, e.amount, " +
                     "e.expense_date, e.payment_method, e.description " +
                     "FROM expenses e " +
                     "JOIN categories c ON e.category_id = c.category_id " +
                     "WHERE e.user_id = ? " +
                     "ORDER BY e.expense_date DESC, e.expense_id DESC";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    expenses.add(new com.expensetracker.model.Expense(
                        rs.getInt("expense_id"),
                        rs.getInt("user_id"),
                        rs.getInt("category_id"),
                        rs.getString("category_name"),
                        rs.getDouble("amount"),
                        rs.getDate("expense_date").toLocalDate(),
                        rs.getString("payment_method"),
                        rs.getString("description")
                    ));
                }
            }
        }
        return expenses;
    }
    //  Budgets & Overview
    public static java.util.List<com.expensetracker.model.Budget> getBudgetsForMonth(int userId, String monthYear) throws SQLException {
        java.util.List<com.expensetracker.model.Budget> budgets = new java.util.ArrayList<>();
        String[] parts = monthYear.split("-");
        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);
        String sql = "SELECT b.budget_id, b.user_id, b.category_id, c.category_name, b.budget_amount " +
                     "FROM budgets b JOIN categories c ON b.category_id = c.category_id " +
                     "WHERE b.user_id = ? AND b.year = ? AND b.month = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, year);
            ps.setInt(3, month);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    budgets.add(new com.expensetracker.model.Budget(
                        rs.getInt("budget_id"),
                        rs.getInt("user_id"),
                        rs.getInt("category_id"),
                        rs.getString("category_name"),
                        month,
                        year,
                        rs.getDouble("budget_amount")
                    ));
                }
            }
        }
        return budgets;
    }
    public static void setBudget(com.expensetracker.model.Budget budget) throws SQLException {
        String checkSql = "SELECT budget_id FROM budgets WHERE user_id = ? AND category_id = ? AND year = ? AND month = ?";
        Integer existingId = null;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(checkSql)) {
            ps.setInt(1, budget.getUserId());
            ps.setInt(2, budget.getCategoryId());
            ps.setInt(3, budget.getYear());
            ps.setInt(4, budget.getMonth());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) existingId = rs.getInt(1);
            }
        }
        if (existingId != null) {
            String updateSql = "UPDATE budgets SET budget_amount = ? WHERE budget_id = ?";
            try (Connection conn = getConnection();
                 PreparedStatement ps = conn.prepareStatement(updateSql)) {
                ps.setDouble(1, budget.getBudgetAmount());
                ps.setInt(2, existingId);
                ps.executeUpdate();
            }
        } else {
            String insertSql = "INSERT INTO budgets (user_id, category_id, budget_amount, year, month) VALUES (?, ?, ?, ?, ?)";
            try (Connection conn = getConnection();
                 PreparedStatement ps = conn.prepareStatement(insertSql)) {
                ps.setInt(1, budget.getUserId());
                ps.setInt(2, budget.getCategoryId());
                ps.setDouble(3, budget.getBudgetAmount());
                ps.setInt(4, budget.getYear());
                ps.setInt(5, budget.getMonth());
                ps.executeUpdate();
            }
        }
    }
    public static void deleteBudget(int budgetId, int userId) throws SQLException {
        String sql = "DELETE FROM budgets WHERE budget_id = ? AND user_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, budgetId);
            ps.setInt(2, userId);
            ps.executeUpdate();
        }
    }
    public static double getTotalExpensesForMonth(int userId, String monthYear) throws SQLException {
        String sql = "SELECT SUM(amount) FROM expenses WHERE user_id = ? AND DATE_FORMAT(expense_date, '%Y-%m') = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setString(2, monthYear);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getDouble(1);
            }
        }
        return 0.0;
    }
    public static double getTotalBudgetForMonth(int userId, String monthYear) throws SQLException {
        String[] parts = monthYear.split("-");
        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);
        String sql = "SELECT SUM(budget_amount) FROM budgets WHERE user_id = ? AND year = ? AND month = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, year);
            ps.setInt(3, month);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getDouble(1);
            }
        }
        return 0.0;
    }
    public static java.util.Map<String, Double> getCategoryWiseSpending(int userId, String monthYear) throws SQLException {
        java.util.Map<String, Double> spending = new java.util.HashMap<>();
        String sql = "SELECT c.category_name, SUM(e.amount) as total FROM expenses e " +
                     "JOIN categories c ON e.category_id = c.category_id " +
                     "WHERE e.user_id = ? AND DATE_FORMAT(e.expense_date, '%Y-%m') = ? " +
                     "GROUP BY c.category_name ORDER BY total DESC";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setString(2, monthYear);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    spending.put(rs.getString("category_name"), rs.getDouble("total"));
                }
            }
        }
        return spending;
    }
}

