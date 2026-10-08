package com.expensetracker.gui;
import com.expensetracker.database.DatabaseManager;
import com.expensetracker.model.User;
import javax.swing.*;
import java.awt.*;
import java.sql.SQLException;
public class LoginPanel extends JPanel {
    private final MainFrame mainFrame;
    private JTextField     emailField;
    private JPasswordField passwordField;
    public LoginPanel(MainFrame mainFrame) {
        this.mainFrame = mainFrame;
        buildUI();
    }
    private void buildUI() {
        setLayout(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(8, 8, 8, 8);
        JLabel titleLabel = new JLabel("Personal Expense Tracker");
        titleLabel.setFont(new Font("SansSerif", Font.BOLD, 22));
        JLabel subLabel = new JLabel("Login to your account");
        subLabel.setFont(new Font("SansSerif", Font.PLAIN, 14));
        subLabel.setForeground(Color.GRAY);
        emailField    = new JTextField(22);
        passwordField = new JPasswordField(22);
        JButton loginBtn    = new JButton("Login");
        JButton registerBtn = new JButton("New user? Register");
        loginBtn.setPreferredSize(new Dimension(180, 32));
        gbc.gridx = 0; gbc.gridy = 0; gbc.gridwidth = 2; gbc.anchor = GridBagConstraints.CENTER;
        add(titleLabel, gbc);
        gbc.gridy = 1;
        add(subLabel, gbc);
        gbc.gridwidth = 1; gbc.insets = new Insets(6, 8, 6, 8);
        gbc.gridy = 2; gbc.gridx = 0; gbc.anchor = GridBagConstraints.EAST;
        add(new JLabel("Email:"), gbc);
        gbc.gridx = 1; gbc.anchor = GridBagConstraints.WEST;
        add(emailField, gbc);
        gbc.gridy = 3; gbc.gridx = 0; gbc.anchor = GridBagConstraints.EAST;
        add(new JLabel("Password:"), gbc);
        gbc.gridx = 1; gbc.anchor = GridBagConstraints.WEST;
        add(passwordField, gbc);
        gbc.gridy = 4; gbc.gridx = 0; gbc.gridwidth = 2;
        gbc.anchor = GridBagConstraints.CENTER; gbc.insets = new Insets(14, 8, 4, 8);
        add(loginBtn, gbc);
        gbc.gridy = 5; gbc.insets = new Insets(2, 8, 8, 8);
        add(registerBtn, gbc);
        loginBtn.addActionListener(e -> handleLogin());
        registerBtn.addActionListener(e -> mainFrame.showRegister());
        // Enter key in password field submits login
        passwordField.addActionListener(e -> handleLogin());
    }
    private void handleLogin() {
        String email    = emailField.getText();
        String password = new String(passwordField.getPassword());
        if ((email == null || email.trim().isEmpty())) {
            showError("Please enter your email address.");
            emailField.requestFocus();
            return;
        }
        if (!(email != null && email.matches("^[\\w._%+\\-]+@[\\w.\\-]+\\.[a-zA-Z]{2,}$"))) {
            showError("Please enter a valid email address.");
            emailField.requestFocus();
            return;
        }
        if ((password == null || password.trim().isEmpty())) {
            showError("Please enter your password.");
            passwordField.requestFocus();
            return;
        }
        try {
            User user = DatabaseManager.loginUser(email, password);
            if (user == null) {
                showError("Incorrect email or password. Please try again.");
                passwordField.setText("");
                passwordField.requestFocus();
            } else {
                // Clear fields for next login
                emailField.setText("");
                passwordField.setText("");
                // Switch to dashboard
                mainFrame.showDashboard(user);
            }
        } catch (SQLException e) {
            showError("Database error: " + e.getMessage());
        }
    }
    private void showError(String message) {
        JOptionPane.showMessageDialog(this, message, "Login Error", JOptionPane.ERROR_MESSAGE);
    }
}
