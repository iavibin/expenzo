package com.expensetracker.api;

import com.expensetracker.database.DatabaseManager;
import com.sun.net.httpserver.HttpServer;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.Executors;

public class ApiServer {
    private static final int DEFAULT_PORT = 8080;
    private final int port;
    private HttpServer server;

    public ApiServer(int port) {
        this.port = port;
    }

    public static int resolvePort() {
        String envPort = System.getenv("PORT");
        if (envPort != null && !envPort.trim().isEmpty()) {
            try {
                return Integer.parseInt(envPort.trim());
            } catch (NumberFormatException ignored) {}
        }

        try (FileInputStream fis = new FileInputStream(".env")) {
            Properties props = new Properties();
            props.load(fis);
            String p = props.getProperty("SERVER_PORT");
            if (p != null && !p.trim().isEmpty()) {
                return Integer.parseInt(p.trim());
            }
        } catch (Exception ignored) {}

        return DEFAULT_PORT;
    }

    public void start() throws IOException {
        server = HttpServer.create(new InetSocketAddress(port), 0);

        // Health check endpoint
        server.createContext("/api/health", exchange -> {
            if (HttpUtil.handlePreflight(exchange)) return;
            Map<String, Object> status = new HashMap<>();
            status.put("status", "UP");
            status.put("timestamp", System.currentTimeMillis());
            status.put("databaseConnected", DatabaseManager.testConnection());
            HttpUtil.sendJsonResponse(exchange, 200, ApiResponse.ok("Expenzo API Server is running", status));
        });

        // Auth endpoint
        server.createContext("/api/auth", new AuthController());

        // Category endpoint
        server.createContext("/api/categories", new CategoryController());

        // Expense endpoint
        server.createContext("/api/expenses", new ExpenseController());

        // Budget endpoint
        server.createContext("/api/budgets", new BudgetController());

        // Analytics endpoint
        server.createContext("/api/analytics", new AnalyticsController());

        // Reports endpoint
        server.createContext("/api/reports", new ReportController());

        // Thread pool executor
        server.setExecutor(Executors.newFixedThreadPool(10));
        server.start();

        System.out.println("=================================================");
        System.out.println(" Expenzo API Server started on port " + port);
        System.out.println(" Health check: http://localhost:" + port + "/api/health");
        System.out.println(" Base URL:     http://localhost:" + port + "/api");
        System.out.println("=================================================");
    }

    public void stop() {
        if (server != null) {
            server.stop(0);
            System.out.println("Expenzo API Server stopped.");
        }
    }

    public static void main(String[] args) {
        if (!DatabaseManager.testConnection()) {
            System.err.println("Database connection failed. Please check your MySQL server and .env settings.");
            System.exit(1);
        }
        System.out.println("Database connection: OK");

        int port = resolvePort();
        ApiServer apiServer = new ApiServer(port);
        try {
            apiServer.start();
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                System.out.println("Shutting down API server...");
                apiServer.stop();
            }));
        } catch (IOException e) {
            System.err.println("Failed to start API Server on port " + port + ": " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}

