package com.expensetracker.gui;
import com.expensetracker.database.DatabaseManager;
import com.expensetracker.model.Category;
import com.expensetracker.model.Expense;
import com.expensetracker.model.User;
import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Vector;
public class ExpensesPanel extends JPanel {
    private final User currentUser;
    private JTable expenseTable;
    private DefaultTableModel tableModel;
    private List<Expense> currentExpenses;
    private List<Category> currentCategories;
    public ExpensesPanel(User currentUser) {
        this.currentUser = currentUser;
        buildUI();
        loadData();
    }
    private void buildUI() {
        setLayout(new BorderLayout(10, 10));
        setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        String[] columns = {"ID", "Date", "Category", "Amount", "Payment Method", "Description"};
        tableModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false; // read-only table
            }
        };
        expenseTable = new JTable(tableModel);
        expenseTable.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        expenseTable.getTableHeader().setReorderingAllowed(false);
        // Hide the ID column but keep it in the model for easy access
        expenseTable.removeColumn(expenseTable.getColumnModel().getColumn(0));
        JScrollPane scrollPane = new JScrollPane(expenseTable);
        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        JButton addBtn    = new JButton("Add Expense");
        JButton editBtn   = new JButton("Edit Selected");
        JButton deleteBtn = new JButton("Delete Selected");
        JButton refreshBtn= new JButton("Refresh");
        buttonPanel.add(addBtn);
        buttonPanel.add(editBtn);
        buttonPanel.add(deleteBtn);
        buttonPanel.add(refreshBtn);
        add(scrollPane, BorderLayout.CENTER);
        add(buttonPanel, BorderLayout.SOUTH);
        addBtn.addActionListener(e -> showExpenseDialog(null));
        editBtn.addActionListener(e -> {
            int selectedRow = expenseTable.getSelectedRow();
            if (selectedRow >= 0) {
                // Get the real index from the model to match our list
                int modelRow = expenseTable.convertRowIndexToModel(selectedRow);
                showExpenseDialog(currentExpenses.get(modelRow));
            } else {
                JOptionPane.showMessageDialog(this, "Please select an expense to edit.");
            }
        });
        deleteBtn.addActionListener(e -> deleteSelectedExpense());
        refreshBtn.addActionListener(e -> loadData());
    }
        private void loadData() {
        try {
            currentCategories = DatabaseManager.getAllCategories(currentUser.getUserId());
            currentExpenses   = DatabaseManager.getAllExpenses(currentUser.getUserId());
            tableModel.setRowCount(0); // clear existing data
            for (Expense exp : currentExpenses) {
                Vector<Object> row = new Vector<>();
                row.add(exp.getExpenseId());
                row.add(exp.getExpenseDate());
                row.add(exp.getCategoryName());
                row.add(String.format("$%.2f", exp.getAmount()));
                row.add(exp.getPaymentMethod());
                row.add(exp.getDescription());
                tableModel.addRow(row);
            }
        } catch (SQLException e) {
            JOptionPane.showMessageDialog(this, "Error loading data: " + e.getMessage(), 
                                          "Database Error", JOptionPane.ERROR_MESSAGE);
        }
    }
        private void showExpenseDialog(Expense expenseToEdit) {
        if (currentCategories == null || currentCategories.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please create a category first (or wait for data to load).");
            return;
        }
        JTextField amountField = new JTextField(10);
        JComboBox<Category> categoryBox = new JComboBox<>(currentCategories.toArray(new Category[0]));
        JTextField dateField = new JTextField(LocalDate.now().toString());
        JComboBox<String> paymentBox = new JComboBox<>(new String[]{"Cash", "Credit Card", "Debit Card", "UPI", "Bank Transfer"});
        JTextField descField = new JTextField(20);
        // Pre-fill if editing
        if (expenseToEdit != null) {
            amountField.setText(String.valueOf(expenseToEdit.getAmount()));
            dateField.setText(expenseToEdit.getExpenseDate().toString());
            paymentBox.setSelectedItem(expenseToEdit.getPaymentMethod());
            descField.setText(expenseToEdit.getDescription());
            // Select correct category
            for (int i = 0; i < categoryBox.getItemCount(); i++) {
                if (categoryBox.getItemAt(i).getCategoryId() == expenseToEdit.getCategoryId()) {
                    categoryBox.setSelectedIndex(i);
                    break;
                }
            }
        }
        Object[] message = {
            "Amount:", amountField,
            "Category:", categoryBox,
            "Date (YYYY-MM-DD):", dateField,
            "Payment Method:", paymentBox,
            "Description:", descField
        };
        String title = (expenseToEdit == null) ? "Add New Expense" : "Edit Expense";
        int option = JOptionPane.showConfirmDialog(this, message, title, JOptionPane.OK_CANCEL_OPTION);
        if (option == JOptionPane.OK_OPTION) {
            // Validate and save
            double amount = parsePositiveAmount(amountField.getText());
            if (amount < 0) {
                JOptionPane.showMessageDialog(this, "Please enter a valid positive amount.");
                return;
            }
            LocalDate date;
            try {
                date = LocalDate.parse(dateField.getText().trim());
            } catch (DateTimeParseException ex) {
                JOptionPane.showMessageDialog(this, "Please enter a valid date in YYYY-MM-DD format.");
                return;
            }
            Category selectedCategory = (Category) categoryBox.getSelectedItem();
            if (selectedCategory == null) return;
            Expense exp = new Expense();
            exp.setUserId(currentUser.getUserId());
            exp.setCategoryId(selectedCategory.getCategoryId());
            exp.setAmount(amount);
            exp.setExpenseDate(date);
            exp.setPaymentMethod((String) paymentBox.getSelectedItem());
            exp.setDescription(descField.getText().trim());
            try {
                if (expenseToEdit == null) {
                    DatabaseManager.addExpense(exp);
                } else {
                    exp.setExpenseId(expenseToEdit.getExpenseId());
                    DatabaseManager.updateExpense(exp);
                }
                loadData(); // Refresh table
            } catch (SQLException e) {
                JOptionPane.showMessageDialog(this, "Error saving expense: " + e.getMessage(), 
                                              "Database Error", JOptionPane.ERROR_MESSAGE);
            }
        }
    }
    private void deleteSelectedExpense() {
        int selectedRow = expenseTable.getSelectedRow();
        if (selectedRow < 0) {
            JOptionPane.showMessageDialog(this, "Please select an expense to delete.");
            return;
        }
        int modelRow = expenseTable.convertRowIndexToModel(selectedRow);
        Expense exp = currentExpenses.get(modelRow);
        int confirm = JOptionPane.showConfirmDialog(this, 
            "Are you sure you want to delete this expense?\nAmount: $" + exp.getAmount() + " for " + exp.getCategoryName(),
            "Confirm Delete", JOptionPane.YES_NO_OPTION);
        if (confirm == JOptionPane.YES_OPTION) {
            try {
                DatabaseManager.deleteExpense(exp.getExpenseId(), currentUser.getUserId());
                loadData(); // Refresh table
            } catch (SQLException e) {
                JOptionPane.showMessageDialog(this, "Error deleting expense: " + e.getMessage(), 
                                              "Database Error", JOptionPane.ERROR_MESSAGE);
            }
        }
    }
    private double parsePositiveAmount(String value) {
        try {
            double amount = Double.parseDouble(value.trim());
            return amount > 0 ? amount : -1;
        } catch (NumberFormatException e) {
            return -1;
        }
    }
}