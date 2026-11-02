package com.expensetracker.database;
import com.expensetracker.model.Budget;
import com.expensetracker.model.Category;
import com.expensetracker.model.Expense;
import com.expensetracker.model.User;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
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
            ps.setString(3, org.mindrot.jbcrypt.BCrypt.hashpw(password, org.mindrot.jbcrypt.BCrypt.gensalt(12)));
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
        String sql = "SELECT user_id, name, email, password FROM users WHERE email = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email.trim().toLowerCase());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    int userId = rs.getInt("user_id");
                    String name = rs.getString("name");
                    String userEmail = rs.getString("email");
                    String storedPassword = rs.getString("password");

                    boolean matches = false;
                    boolean needsUpgrade = false;

                    if (storedPassword != null && (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$"))) {
                        matches = org.mindrot.jbcrypt.BCrypt.checkpw(password, storedPassword);
                    } else if (storedPassword != null && storedPassword.equals(password)) {
                        matches = true;
                        needsUpgrade = true;
                    }

                    if (matches) {
                        if (needsUpgrade) {
                            upgradeUserPassword(userId, password);
                        }
                        return new User(userId, name, userEmail, "");
                    }
                }
            }
        }
        return null;
    }

    private static void upgradeUserPassword(int userId, String rawPassword) {
        try {
            String newHash = org.mindrot.jbcrypt.BCrypt.hashpw(rawPassword, org.mindrot.jbcrypt.BCrypt.gensalt(12));
            String updateSql = "UPDATE users SET password = ? WHERE user_id = ?";
            try (Connection conn = getConnection();
                 PreparedStatement ps = conn.prepareStatement(updateSql)) {
                ps.setString(1, newHash);
                ps.setInt(2, userId);
                ps.executeUpdate();
                System.out.println("Notice: Upgraded legacy plaintext password for user_id=" + userId + " to BCrypt hash.");
            }
        } catch (SQLException e) {
            System.err.println("Warning: Failed to upgrade user password to BCrypt hash: " + e.getMessage());
        }
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

    // --- Phase 2: Category, Expense & Budget Extensions ---

    public static boolean isCategoryOwnedByUser(int categoryId, int userId) throws SQLException {
        String sql = "SELECT 1 FROM categories WHERE category_id = ? AND user_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, categoryId);
            ps.setInt(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    public static Expense getExpenseById(int expenseId, int userId) throws SQLException {
        String sql = "SELECT e.expense_id, e.user_id, e.category_id, c.category_name, e.amount, " +
                     "e.expense_date, e.payment_method, e.description " +
                     "FROM expenses e " +
                     "JOIN categories c ON e.category_id = c.category_id " +
                     "WHERE e.expense_id = ? AND e.user_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, expenseId);
            ps.setInt(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Expense(
                        rs.getInt("expense_id"),
                        rs.getInt("user_id"),
                        rs.getInt("category_id"),
                        rs.getString("category_name"),
                        rs.getDouble("amount"),
                        rs.getDate("expense_date").toLocalDate(),
                        rs.getString("payment_method"),
                        rs.getString("description")
                    );
                }
            }
        }
        return null;
    }

    public static int addExpenseWithGeneratedId(Expense expense) throws SQLException {
        String sql = "INSERT INTO expenses (user_id, category_id, amount, expense_date, payment_method, description) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, expense.getUserId());
            ps.setInt(2, expense.getCategoryId());
            ps.setDouble(3, expense.getAmount());
            ps.setDate(4, Date.valueOf(expense.getExpenseDate()));
            ps.setString(5, expense.getPaymentMethod());
            ps.setString(6, expense.getDescription());
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    int id = rs.getInt(1);
                    expense.setExpenseId(id);
                    return id;
                }
                throw new SQLException("Failed to retrieve generated expense ID.");
            }
        }
    }

    public static List<Expense> getFilteredExpenses(
            int userId, Integer categoryId, LocalDate startDate, LocalDate endDate,
            String search, String sortBy, String sortOrder) throws SQLException {

        StringBuilder sql = new StringBuilder(
            "SELECT e.expense_id, e.user_id, e.category_id, c.category_name, e.amount, " +
            "e.expense_date, e.payment_method, e.description " +
            "FROM expenses e " +
            "JOIN categories c ON e.category_id = c.category_id " +
            "WHERE e.user_id = ? "
        );

        List<Object> params = new ArrayList<>();
        params.add(userId);

        if (categoryId != null && categoryId > 0) {
            sql.append("AND e.category_id = ? ");
            params.add(categoryId);
        }
        if (startDate != null) {
            sql.append("AND e.expense_date >= ? ");
            params.add(Date.valueOf(startDate));
        }
        if (endDate != null) {
            sql.append("AND e.expense_date <= ? ");
            params.add(Date.valueOf(endDate));
        }
        if (search != null && !search.trim().isEmpty()) {
            sql.append("AND (LOWER(e.description) LIKE ? OR LOWER(c.category_name) LIKE ? OR LOWER(e.payment_method) LIKE ?) ");
            String searchPattern = "%" + search.trim().toLowerCase() + "%";
            params.add(searchPattern);
            params.add(searchPattern);
            params.add(searchPattern);
        }

        String orderCol = "e.expense_date";
        if (sortBy != null) {
            String sb = sortBy.trim().toLowerCase();
            if ("amount".equals(sb)) {
                orderCol = "e.amount";
            } else if ("date".equals(sb) || "expensedate".equals(sb)) {
                orderCol = "e.expense_date";
            } else if ("description".equals(sb)) {
                orderCol = "e.description";
            } else if ("category".equals(sb) || "categoryname".equals(sb)) {
                orderCol = "c.category_name";
            }
        }

        String direction = "DESC";
        if (sortOrder != null && "asc".equalsIgnoreCase(sortOrder.trim())) {
            direction = "ASC";
        }

        sql.append("ORDER BY ").append(orderCol).append(" ").append(direction).append(", e.expense_id DESC");

        List<Expense> list = new ArrayList<>();
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new Expense(
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
        return list;
    }

    public static class BudgetRecord {
        public int budgetId;
        public int userId;
        public int categoryId;
        public String categoryName;
        public int month;
        public int year;
        public double budgetAmount;
        public double amountSpent;

        public BudgetRecord(int budgetId, int userId, int categoryId, String categoryName, int month, int year, double budgetAmount, double amountSpent) {
            this.budgetId = budgetId;
            this.userId = userId;
            this.categoryId = categoryId;
            this.categoryName = categoryName;
            this.month = month;
            this.year = year;
            this.budgetAmount = budgetAmount;
            this.amountSpent = amountSpent;
        }
    }

    public static List<BudgetRecord> getBudgetsWithSpent(int userId, Integer month, Integer year) throws SQLException {
        StringBuilder sql = new StringBuilder(
            "SELECT b.budget_id, b.user_id, b.category_id, c.category_name, b.month, b.year, b.budget_amount, " +
            "COALESCE(SUM(e.amount), 0) AS amount_spent " +
            "FROM budgets b " +
            "JOIN categories c ON b.category_id = c.category_id " +
            "LEFT JOIN expenses e ON e.user_id = b.user_id " +
            "                    AND e.category_id = b.category_id " +
            "                    AND YEAR(e.expense_date) = b.year " +
            "                    AND MONTH(e.expense_date) = b.month " +
            "WHERE b.user_id = ? "
        );
        List<Object> params = new ArrayList<>();
        params.add(userId);

        if (year != null && year > 0) {
            sql.append("AND b.year = ? ");
            params.add(year);
        }
        if (month != null && month > 0) {
            sql.append("AND b.month = ? ");
            params.add(month);
        }

        sql.append("GROUP BY b.budget_id, b.user_id, b.category_id, c.category_name, b.month, b.year, b.budget_amount ");
        sql.append("ORDER BY b.year DESC, b.month DESC, c.category_name ASC");

        List<BudgetRecord> list = new ArrayList<>();
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new BudgetRecord(
                        rs.getInt("budget_id"),
                        rs.getInt("user_id"),
                        rs.getInt("category_id"),
                        rs.getString("category_name"),
                        rs.getInt("month"),
                        rs.getInt("year"),
                        rs.getDouble("budget_amount"),
                        rs.getDouble("amount_spent")
                    ));
                }
            }
        }
        return list;
    }

    public static BudgetRecord getBudgetWithSpentById(int budgetId, int userId) throws SQLException {
        String sql = "SELECT b.budget_id, b.user_id, b.category_id, c.category_name, b.month, b.year, b.budget_amount, " +
                     "COALESCE(SUM(e.amount), 0) AS amount_spent " +
                     "FROM budgets b " +
                     "JOIN categories c ON b.category_id = c.category_id " +
                     "LEFT JOIN expenses e ON e.user_id = b.user_id " +
                     "                    AND e.category_id = b.category_id " +
                     "                    AND YEAR(e.expense_date) = b.year " +
                     "                    AND MONTH(e.expense_date) = b.month " +
                     "WHERE b.budget_id = ? AND b.user_id = ? " +
                     "GROUP BY b.budget_id, b.user_id, b.category_id, c.category_name, b.month, b.year, b.budget_amount";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, budgetId);
            ps.setInt(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new BudgetRecord(
                        rs.getInt("budget_id"),
                        rs.getInt("user_id"),
                        rs.getInt("category_id"),
                        rs.getString("category_name"),
                        rs.getInt("month"),
                        rs.getInt("year"),
                        rs.getDouble("budget_amount"),
                        rs.getDouble("amount_spent")
                    );
                }
            }
        }
        return null;
    }

    public static boolean isBudgetDuplicate(int userId, int categoryId, int month, int year, Integer excludeBudgetId) throws SQLException {
        String sql = "SELECT 1 FROM budgets WHERE user_id = ? AND category_id = ? AND month = ? AND year = ? " +
                     (excludeBudgetId != null ? "AND budget_id != ?" : "");
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, categoryId);
            ps.setInt(3, month);
            ps.setInt(4, year);
            if (excludeBudgetId != null) {
                ps.setInt(5, excludeBudgetId);
            }
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    public static int addBudgetWithGeneratedId(int userId, int categoryId, int month, int year, double amount) throws SQLException {
        String sql = "INSERT INTO budgets (user_id, category_id, month, year, budget_amount) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, userId);
            ps.setInt(2, categoryId);
            ps.setInt(3, month);
            ps.setInt(4, year);
            ps.setDouble(5, amount);
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) return rs.getInt(1);
                throw new SQLException("Failed to retrieve generated budget ID.");
            }
        }
    }

    public static void updateBudgetDirect(int budgetId, int userId, int categoryId, int month, int year, double amount) throws SQLException {
        String sql = "UPDATE budgets SET category_id = ?, month = ?, year = ?, budget_amount = ? WHERE budget_id = ? AND user_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, categoryId);
            ps.setInt(2, month);
            ps.setInt(3, year);
            ps.setDouble(4, amount);
            ps.setInt(5, budgetId);
            ps.setInt(6, userId);
            ps.executeUpdate();
        }
    }


    // --- Phase 3: Analytics & Reporting Extensions ---

    public static class CategorySpendingItem {
        public String categoryName;
        public double amount;

        public CategorySpendingItem(String categoryName, double amount) {
            this.categoryName = categoryName;
            this.amount = amount;
        }
    }

    public static class MonthlySpendingTrend {
        public String month;
        public String monthYear;
        public double amount;

        public MonthlySpendingTrend(String month, String monthYear, double amount) {
            this.month = month;
            this.monthYear = monthYear;
            this.amount = amount;
        }
    }

    public static int getTransactionCount(int userId, int year, int month) throws SQLException {
        String sql = "SELECT COUNT(*) FROM expenses WHERE user_id = ? AND YEAR(expense_date) = ? AND MONTH(expense_date) = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, year);
            ps.setInt(3, month);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        return 0;
    }

    public static double getTotalExpensesForMonth(int userId, int year, int month) throws SQLException {
        String sql = "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = ? AND YEAR(expense_date) = ? AND MONTH(expense_date) = ?";
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

    public static double getTotalBudgetForMonth(int userId, int year, int month) throws SQLException {
        String sql = "SELECT COALESCE(SUM(budget_amount), 0) FROM budgets WHERE user_id = ? AND year = ? AND month = ?";
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

    public static List<CategorySpendingItem> getCategoryBreakdownList(int userId, int year, int month) throws SQLException {
        String sql = "SELECT c.category_name, COALESCE(SUM(e.amount), 0) AS total " +
                     "FROM expenses e " +
                     "JOIN categories c ON e.category_id = c.category_id " +
                     "WHERE e.user_id = ? AND YEAR(e.expense_date) = ? AND MONTH(e.expense_date) = ? " +
                     "GROUP BY c.category_name " +
                     "ORDER BY total DESC";
        List<CategorySpendingItem> list = new ArrayList<>();
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, year);
            ps.setInt(3, month);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new CategorySpendingItem(rs.getString("category_name"), rs.getDouble("total")));
                }
            }
        }
        return list;
    }

    public static List<MonthlySpendingTrend> getMonthlySpendingTrends(int userId, int endYear, int endMonth, int count) throws SQLException {
        java.time.YearMonth currentYm = java.time.YearMonth.of(endYear, endMonth);
        java.time.YearMonth startYm = currentYm.minusMonths(count - 1);

        String sql = "SELECT DATE_FORMAT(expense_date, '%Y-%m') AS ym, COALESCE(SUM(amount), 0) AS total " +
                     "FROM expenses " +
                     "WHERE user_id = ? AND expense_date >= ? AND expense_date <= ? " +
                     "GROUP BY ym";

        java.util.Map<String, Double> map = new java.util.HashMap<>();
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setDate(2, Date.valueOf(startYm.atDay(1)));
            ps.setDate(3, Date.valueOf(currentYm.atEndOfMonth()));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    map.put(rs.getString("ym"), rs.getDouble("total"));
                }
            }
        }

        List<MonthlySpendingTrend> trends = new ArrayList<>();
        java.time.format.DateTimeFormatter monthFmt = java.time.format.DateTimeFormatter.ofPattern("MMMM", java.util.Locale.ENGLISH);

        for (int i = 0; i < count; i++) {
            java.time.YearMonth targetYm = startYm.plusMonths(i);
            String key = targetYm.toString();
            String monthName = targetYm.format(monthFmt);
            double total = map.getOrDefault(key, 0.0);
            trends.add(new MonthlySpendingTrend(monthName, key, total));
        }

        return trends;
    }

    public static List<Expense> getRecentExpenses(int userId, int limit) throws SQLException {
        String sql = "SELECT e.expense_id, e.user_id, e.category_id, c.category_name, e.amount, " +
                     "e.expense_date, e.payment_method, e.description " +
                     "FROM expenses e " +
                     "JOIN categories c ON e.category_id = c.category_id " +
                     "WHERE e.user_id = ? " +
                     "ORDER BY e.expense_date DESC, e.expense_id DESC LIMIT ?";
        List<Expense> list = new ArrayList<>();
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new Expense(
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
        return list;
    }

    public static List<Expense> getExpensesForMonth(int userId, int year, int month) throws SQLException {
        String sql = "SELECT e.expense_id, e.user_id, e.category_id, c.category_name, e.amount, " +
                     "e.expense_date, e.payment_method, e.description " +
                     "FROM expenses e " +
                     "JOIN categories c ON e.category_id = c.category_id " +
                     "WHERE e.user_id = ? AND YEAR(e.expense_date) = ? AND MONTH(e.expense_date) = ? " +
                     "ORDER BY e.expense_date ASC, e.expense_id ASC";
        List<Expense> list = new ArrayList<>();
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, year);
            ps.setInt(3, month);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new Expense(
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
        return list;
    }
}
