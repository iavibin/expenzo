package com.expensetracker.gui;
import com.expensetracker.database.DatabaseManager;
import com.expensetracker.model.User;
import javax.swing.*;
import java.awt.*;
import java.sql.SQLException;
public class RegisterPanel extends JPanel {
    private final MainFrame mainFrame;
    private JTextField     nameField;
    private JTextField     emailField;
    private JPasswordField passwordField;
    private JPasswordField confirmPasswordField;
    public RegisterPanel(MainFrame mainFrame) {
        this.mainFrame = mainFrame;
        buildUI();
    }
    private void buildUI() {
        setLayout(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(6, 8, 6, 8);
        JLabel titleLabel = new JLabel("Create Account");
        titleLabel.setFont(new Font("SansSerif", Font.BOLD, 22));
        JLabel subLabel = new JLabel("Fill in the details below to get started");
        subLabel.setFont(new Font("SansSerif", Font.PLAIN, 13));
        subLabel.setForeground(Color.GRAY);
        nameField            = new JTextField(22);
        emailField           = new JTextField(22);
        passwordField        = new JPasswordField(22);
        confirmPasswordField = new JPasswordField(22);
        JButton registerBtn = new JButton("Create Account");
        JButton backBtn     = new JButton("← Back to Login");
        registerBtn.setPreferredSize(new Dimension(180, 32));
        gbc.gridx = 0; gbc.gridy = 0; gbc.gridwidth = 2; gbc.anchor = GridBagConstraints.CENTER;
        add(titleLabel, gbc);
        gbc.gridy = 1;
        add(subLabel, gbc);
        gbc.gridwidth = 1;
        int row = 2;
        gbc.gridy = row++; gbc.gridx = 0; gbc.anchor = GridBagConstraints.EAST;
        add(new JLabel("Full Name:"), gbc);
        gbc.gridx = 1; gbc.anchor = GridBagConstraints.WEST;
        add(nameField, gbc);
        gbc.gridy = row++; gbc.gridx = 0; gbc.anchor = GridBagConstraints.EAST;
        add(new JLabel("Email:"), gbc);
        gbc.gridx = 1; gbc.anchor = GridBagConstraints.WEST;
        add(emailField, gbc);
        gbc.gridy = row++; gbc.gridx = 0; gbc.anchor = GridBagConstraints.EAST;
        add(new JLabel("Password:"), gbc);
        gbc.gridx = 1; gbc.anchor = GridBagConstraints.WEST;
        add(passwordField, gbc);
        gbc.gridy = row++; gbc.gridx = 0; gbc.anchor = GridBagConstraints.EAST;
        add(new JLabel("Confirm Password:"), gbc);
        gbc.gridx = 1; gbc.anchor = GridBagConstraints.WEST;
        add(confirmPasswordField, gbc);
        gbc.gridy = row++; gbc.gridx = 0; gbc.gridwidth = 2;
        gbc.anchor = GridBagConstraints.CENTER; gbc.insets = new Insets(14, 8, 4, 8);
        add(registerBtn, gbc);
        gbc.gridy = row; gbc.insets = new Insets(2, 8, 8, 8);
        add(backBtn, gbc);
        registerBtn.addActionListener(e -> handleRegister());
        backBtn.addActionListener(e -> {
            clearFields();
            mainFrame.showLogin();
        });
        confirmPasswordField.addActionListener(e -> handleRegister());
    }
    private void handleRegister() {
        String name            = nameField.getText();
        String email           = emailField.getText();
        String password        = new String(passwordField.getPassword());
        String confirmPassword = new String(confirmPasswordField.getPassword());
        if ((name == null || name.trim().isEmpty())) {
            showError("Please enter your full name.");
            nameField.requestFocus();
            return;
        }
        if (name.trim().length() < 2) {
            showError("Name must be at least 2 characters.");
            nameField.requestFocus();
            return;
        }
        if (!(email != null && email.matches("^[\\w._%+\\-]+@[\\w.\\-]+\\.[a-zA-Z]{2,}$"))) {
            showError("Please enter a valid email address.");
            emailField.requestFocus();
            return;
        }
        if ((password == null || password.trim().isEmpty())) {
            showError("Please enter a password.");
            passwordField.requestFocus();
            return;
        }
        if (password.length() < 4) {
            showError("Password must be at least 4 characters.");
            passwordField.requestFocus();
            return;
        }
        if (!password.equals(confirmPassword)) {
            showError("Passwords do not match. Please try again.");
            confirmPasswordField.setText("");
            confirmPasswordField.requestFocus();
            return;
        }
        try {
            User newUser = DatabaseManager.registerUser(name, email, password);
            JOptionPane.showMessageDialog(this,
                "Account created successfully!\nWelcome, " + newUser.getName() + ".",
                "Registration Successful",
                JOptionPane.INFORMATION_MESSAGE);
            clearFields();
            // Auto-login: take user straight to the Dashboard
            mainFrame.showDashboard(newUser);
        } catch (IllegalArgumentException e) {
            // Duplicate email — friendly message
            showError(e.getMessage());
            emailField.requestFocus();
        } catch (SQLException e) {
            showError("Database error: " + e.getMessage());
        }
    }
    private void clearFields() {
        nameField.setText("");
        emailField.setText("");
        passwordField.setText("");
        confirmPasswordField.setText("");
    }
    private void showError(String message) {
        JOptionPane.showMessageDialog(this, message, "Registration Error", JOptionPane.ERROR_MESSAGE);
    }
}
