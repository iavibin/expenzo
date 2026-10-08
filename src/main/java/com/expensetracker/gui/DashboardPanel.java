package com.expensetracker.gui;
import com.expensetracker.database.DatabaseManager;
import com.expensetracker.model.Budget;
import com.expensetracker.model.Category;
import com.expensetracker.model.User;
import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.sql.SQLException;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

public class DashboardPanel extends JPanel {
    private final User currentUser;
    private JTabbedPane tabbedPane;
    private JPanel overviewPanel, categoriesPanel, budgetsPanel;
    // Overview UI
    private JLabel totalExpLabel, totalBudgLabel, remLabel;
    private JPanel categorySummaryPanel;
    private JTextField monthField;
    // Categories UI
    private DefaultTableModel catTableModel;
    private JTable catTable;
    // Budgets UI
    private DefaultTableModel budgTableModel;
    private JTable budgTable;
    private JTextField budgMonthField;
    public DashboardPanel(MainFrame mainFrame, User currentUser) {
        this.currentUser = currentUser;
        setLayout(new BorderLayout());
        JPanel topBar = new JPanel(new BorderLayout());
        topBar.setBorder(BorderFactory.createEmptyBorder(8, 12, 8, 12));
        JLabel welcomeLabel = new JLabel("Welcome, " + currentUser.getName() + "!");
        welcomeLabel.setFont(new Font("SansSerif", Font.BOLD, 16));
        JButton logoutBtn = new JButton("Logout");
        logoutBtn.addActionListener(e -> mainFrame.logout());
        topBar.add(welcomeLabel, BorderLayout.WEST);
        topBar.add(logoutBtn, BorderLayout.EAST);
        tabbedPane = new JTabbedPane();
        tabbedPane.setFont(new Font("SansSerif", Font.PLAIN, 14));
        buildOverviewTab();
        buildCategoriesTab();
        buildBudgetsTab();
        tabbedPane.addTab("Overview", overviewPanel);
        tabbedPane.addTab("Expenses", new ExpensesPanel(currentUser));
        tabbedPane.addTab("Categories", categoriesPanel);
        tabbedPane.addTab("Budgets", budgetsPanel);
        tabbedPane.addChangeListener(e -> refreshActiveTab());
        add(topBar, BorderLayout.NORTH);
        add(tabbedPane, BorderLayout.CENTER);
        loadOverviewData();
    }
    private void refreshActiveTab() {
        int idx = tabbedPane.getSelectedIndex();
        if (idx == 0) loadOverviewData();
        else if (idx == 2) loadCategoriesData();
        else if (idx == 3) loadBudgetsData();
    }
    // --- OVERVIEW TAB ---
    private void buildOverviewTab() {
        overviewPanel = new JPanel(new BorderLayout(10, 10));
        overviewPanel.setBorder(BorderFactory.createEmptyBorder(15, 15, 15, 15));
        JPanel topPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        topPanel.add(new JLabel("Month (YYYY-MM): "));
        monthField = new JTextField(YearMonth.now().toString(), 7);
        JButton loadBtn = new JButton("Refresh");
        loadBtn.addActionListener(e -> loadOverviewData());
        topPanel.add(monthField);
        topPanel.add(loadBtn);
        JPanel summaryPanel = new JPanel(new GridLayout(1, 3, 10, 10));
        totalExpLabel = createCard(summaryPanel, "Total Expenses");
        totalBudgLabel = createCard(summaryPanel, "Total Budget");
        remLabel = createCard(summaryPanel, "Remaining");
        JPanel breakdownPanel = new JPanel(new BorderLayout());
        breakdownPanel.setBorder(BorderFactory.createTitledBorder("Category Breakdown"));
        categorySummaryPanel = new JPanel();
        categorySummaryPanel.setLayout(new BoxLayout(categorySummaryPanel, BoxLayout.Y_AXIS));
        breakdownPanel.add(new JScrollPane(categorySummaryPanel), BorderLayout.CENTER);
        JPanel centerPanel = new JPanel(new BorderLayout(0, 15));
        centerPanel.add(summaryPanel, BorderLayout.NORTH);
        centerPanel.add(breakdownPanel, BorderLayout.CENTER);
        overviewPanel.add(topPanel, BorderLayout.NORTH);
        overviewPanel.add(centerPanel, BorderLayout.CENTER);
    }
    private JLabel createCard(JPanel parent, String title) {
        JPanel card = new JPanel(new BorderLayout());
        card.setBorder(BorderFactory.createCompoundBorder(BorderFactory.createLineBorder(Color.LIGHT_GRAY), BorderFactory.createEmptyBorder(10, 10, 10, 10)));
        JLabel titleLabel = new JLabel(title, SwingConstants.CENTER);
        JLabel valueLabel = new JLabel("$0.00", SwingConstants.CENTER);
        valueLabel.setFont(new Font("SansSerif", Font.BOLD, 18));
        card.add(titleLabel, BorderLayout.NORTH);
        card.add(valueLabel, BorderLayout.CENTER);
        parent.add(card);
        return valueLabel;
    }
    private void loadOverviewData() {
        String month = monthField.getText().trim();
        if (!month.matches("\\d{4}-\\d{2}")) return;
        try {
            double expenses = DatabaseManager.getTotalExpensesForMonth(currentUser.getUserId(), month);
            double budget = DatabaseManager.getTotalBudgetForMonth(currentUser.getUserId(), month);
            double remaining = budget - expenses;
            totalExpLabel.setText(String.format("$%.2f", expenses));
            totalBudgLabel.setText(String.format("$%.2f", budget));
            remLabel.setText(String.format("$%.2f", remaining));
            remLabel.setForeground(budget > 0 && remaining < 0 ? Color.RED : new Color(0, 150, 0));
            Map<String, Double> breakdown = DatabaseManager.getCategoryWiseSpending(currentUser.getUserId(), month);
            categorySummaryPanel.removeAll();
            if (breakdown.isEmpty()) {
                categorySummaryPanel.add(new JLabel("No expenses this month."));
            } else {
                for (Map.Entry<String, Double> entry : breakdown.entrySet()) {
                    JPanel row = new JPanel(new BorderLayout());
                    row.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));
                    row.add(new JLabel(entry.getKey()), BorderLayout.WEST);
                    row.add(new JLabel(String.format("$%.2f", entry.getValue())), BorderLayout.EAST);
                    categorySummaryPanel.add(row);
                }
            }
            categorySummaryPanel.revalidate();
            categorySummaryPanel.repaint();
        } catch (SQLException e) {
            JOptionPane.showMessageDialog(this, "Error: " + e.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }
    // --- CATEGORIES TAB ---
    private void buildCategoriesTab() {
        categoriesPanel = new JPanel(new BorderLayout(10, 10));
        categoriesPanel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        catTableModel = new DefaultTableModel(new String[]{"ID", "Category Name"}, 0) {
            public boolean isCellEditable(int row, int column) { return false; }
        };
        catTable = new JTable(catTableModel);
        catTable.removeColumn(catTable.getColumnModel().getColumn(0)); // Hide ID
        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        JButton addBtn = new JButton("Add Category");
        JButton delBtn = new JButton("Delete Selected");
        btnPanel.add(addBtn);
        btnPanel.add(delBtn);
        categoriesPanel.add(new JScrollPane(catTable), BorderLayout.CENTER);
        categoriesPanel.add(btnPanel, BorderLayout.SOUTH);
        addBtn.addActionListener(e -> {
            String name = JOptionPane.showInputDialog(this, "Enter category name:");
            if (name != null && !name.trim().isEmpty()) {
                try {
                    DatabaseManager.addCategory(currentUser.getUserId(), name);
                    loadCategoriesData();
                } catch (SQLException ex) {
                    JOptionPane.showMessageDialog(this, "Error adding category.");
                }
            }
        });
        delBtn.addActionListener(e -> {
            int row = catTable.getSelectedRow();
            if (row >= 0) {
                int id = (int) catTableModel.getValueAt(row, 0);
                try {
                    DatabaseManager.deleteCategory(id, currentUser.getUserId());
                    loadCategoriesData();
                } catch (SQLException ex) {
                    JOptionPane.showMessageDialog(this, "Cannot delete category (may be in use).");
                }
            }
        });
    }
    private void loadCategoriesData() {
        try {
            catTableModel.setRowCount(0);
            for (Category c : DatabaseManager.getAllCategories(currentUser.getUserId())) {
                catTableModel.addRow(new Object[]{c.getCategoryId(), c.getCategoryName()});
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
    // --- BUDGETS TAB ---
    private void buildBudgetsTab() {
        budgetsPanel = new JPanel(new BorderLayout(10, 10));
        budgetsPanel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        JPanel topPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        topPanel.add(new JLabel("Month (YYYY-MM): "));
        budgMonthField = new JTextField(YearMonth.now().toString(), 7);
        JButton loadBtn = new JButton("Load");
        loadBtn.addActionListener(e -> loadBudgetsData());
        topPanel.add(budgMonthField);
        topPanel.add(loadBtn);
        budgTableModel = new DefaultTableModel(new String[]{"ID", "Category", "Amount", "Month"}, 0) {
            public boolean isCellEditable(int row, int column) { return false; }
        };
        budgTable = new JTable(budgTableModel);
        budgTable.removeColumn(budgTable.getColumnModel().getColumn(0));
        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        JButton setBtn = new JButton("Set Budget");
        JButton delBtn = new JButton("Delete Budget");
        btnPanel.add(setBtn);
        btnPanel.add(delBtn);
        budgetsPanel.add(topPanel, BorderLayout.NORTH);
        budgetsPanel.add(new JScrollPane(budgTable), BorderLayout.CENTER);
        budgetsPanel.add(btnPanel, BorderLayout.SOUTH);
        setBtn.addActionListener(e -> {
            String month = budgMonthField.getText().trim();
            if (!month.matches("\\d{4}-\\d{2}")) return;
            try {
                List<Category> cats = DatabaseManager.getAllCategories(currentUser.getUserId());
                if (cats.isEmpty()) return;
                JComboBox<Category> box = new JComboBox<>(cats.toArray(new Category[0]));
                JTextField amtField = new JTextField(10);
                if (JOptionPane.showConfirmDialog(this, new Object[]{"Category:", box, "Amount:", amtField}, "Set Budget", JOptionPane.OK_CANCEL_OPTION) == JOptionPane.OK_OPTION) {
                    double amt = Double.parseDouble(amtField.getText());
                    String[] p = month.split("-");
                    Budget b = new Budget();
                    b.setUserId(currentUser.getUserId());
                    b.setCategoryId(((Category) box.getSelectedItem()).getCategoryId());
                    b.setBudgetAmount(amt);
                    b.setYear(Integer.parseInt(p[0]));
                    b.setMonth(Integer.parseInt(p[1]));
                    DatabaseManager.setBudget(b);
                    loadBudgetsData();
                }
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(this, "Error setting budget.");
            }
        });
        delBtn.addActionListener(e -> {
            int row = budgTable.getSelectedRow();
            if (row >= 0) {
                int id = (int) budgTableModel.getValueAt(row, 0);
                try {
                    DatabaseManager.deleteBudget(id, currentUser.getUserId());
                    loadBudgetsData();
                } catch (SQLException ex) {
                    JOptionPane.showMessageDialog(this, "Error deleting budget.");
                }
            }
        });
    }
    private void loadBudgetsData() {
        String month = budgMonthField.getText().trim();
        if (!month.matches("\\d{4}-\\d{2}")) return;
        try {
            budgTableModel.setRowCount(0);
            for (Budget b : DatabaseManager.getBudgetsForMonth(currentUser.getUserId(), month)) {
                budgTableModel.addRow(new Object[]{b.getBudgetId(), b.getCategoryName(), String.format("$%.2f", b.getBudgetAmount()), String.format("%04d-%02d", b.getYear(), b.getMonth())});
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
