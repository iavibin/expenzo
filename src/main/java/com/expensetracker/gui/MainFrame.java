package com.expensetracker.gui;
import com.expensetracker.model.User;
import javax.swing.*;
import java.awt.*;
public class MainFrame extends JFrame {
    // CardLayout lets us switch panels without opening new windows
    private final CardLayout  cardLayout = new CardLayout();
    private final JPanel      container  = new JPanel(cardLayout);
    private LoginPanel    loginPanel;
    private RegisterPanel registerPanel;
    // The logged-in user (null when not logged in)
    private User currentUser;
    public MainFrame() {
        setTitle("Personal Expense Tracker");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(900, 600);
        setLocationRelativeTo(null);   // Center on screen
        setMinimumSize(new Dimension(700, 500));
        buildUI();
    }
    private void buildUI() {
        // Create login and register panels
        loginPanel    = new LoginPanel(this);
        registerPanel = new RegisterPanel(this);
        // Add panels to the card container
        container.add(loginPanel,    "login");
        container.add(registerPanel, "register");
        add(container);
        // Show login screen first
        showLogin();
    }
    public void showLogin() {
        setTitle("Personal Expense Tracker - Login");
        cardLayout.show(container, "login");
    }
    public void showRegister() {
        setTitle("Personal Expense Tracker - Register");
        cardLayout.show(container, "register");
    }
        public void showDashboard(User user) {
        this.currentUser = user;
        setTitle("Personal Expense Tracker - " + user.getName());
        // Create dashboard fresh on each login (so data loads for correct user)
        DashboardPanel dashboardPanel = new DashboardPanel(this, user);
        container.add(dashboardPanel, "dashboard");
        cardLayout.show(container, "dashboard");
    }
        public void logout() {
        this.currentUser = null;
        // Remove old dashboard to free resources
        for (Component c : container.getComponents()) {
            if (c instanceof DashboardPanel) {
                container.remove(c);
                break;
            }
        }
        showLogin();
    }
    public User getCurrentUser() {
        return currentUser;
    }
}
