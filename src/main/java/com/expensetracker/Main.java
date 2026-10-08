package com.expensetracker;
import com.expensetracker.database.DatabaseManager;
import com.expensetracker.gui.MainFrame;
import javax.swing.JOptionPane;
import javax.swing.SwingUtilities;
public class Main {
    public static void main(String[] args) {
        // Verify DB connection before opening the GUI
        if (!DatabaseManager.testConnection()) {
            JOptionPane.showMessageDialog(
                null,
                "Cannot connect to the database.\n\n" +
                "Please check:\n" +
                "  1. MySQL Server is running\n" +
                "  2. Credentials in DatabaseManager.java are correct\n" +
                "  3. The 'expense_tracker' database exists",
                "Database Connection Failed",
                JOptionPane.ERROR_MESSAGE
            );
            System.exit(1);
        }
        System.out.println("Database connection: OK");
        // Launch the GUI on the Event Dispatch Thread
        SwingUtilities.invokeLater(() -> {
            MainFrame frame = new MainFrame();
            frame.setVisible(true);
        });
    }
}
