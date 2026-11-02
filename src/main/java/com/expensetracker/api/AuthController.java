package com.expensetracker.api;

import com.expensetracker.database.DatabaseManager;
import com.expensetracker.model.User;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

public class AuthController implements HttpHandler {

    public static class RegisterRequest {
        public String name;
        public String email;
        public String password;
    }

    public static class LoginRequest {
        public String email;
        public String password;
    }

    public static class ChangePasswordRequest {
        public String currentPassword;
        public String newPassword;
    }

    public static class UpdateProfileRequest {
        public String name;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HttpUtil.handlePreflight(exchange)) {
            return;
        }

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();

        try {
            if ("/api/auth/register".equals(path) && "POST".equals(method)) {
                handleRegister(exchange);
            } else if ("/api/auth/login".equals(path) && "POST".equals(method)) {
                handleLogin(exchange);
            } else if ("/api/auth/logout".equals(path) && "POST".equals(method)) {
                handleLogout(exchange);
            } else if ("/api/auth/me".equals(path) && "GET".equals(method)) {
                handleMe(exchange);
            } else if ("/api/auth/change-password".equals(path) && "POST".equals(method)) {
                handleChangePassword(exchange);
            } else if ("/api/auth/profile".equals(path) && ("PUT".equals(method) || "POST".equals(method))) {
                handleUpdateProfile(exchange);
            } else {
                HttpUtil.sendError(exchange, 404, "Endpoint not found: " + method + " " + path);
            }
        } catch (Exception e) {
            HttpUtil.sendError(exchange, 500, "Internal server error: " + e.getMessage());
        }
    }

    private void handleRegister(HttpExchange exchange) throws IOException {
        String body = HttpUtil.readRequestBody(exchange);
        RegisterRequest req;
        try {
            req = JsonUtil.fromJson(body, RegisterRequest.class);
        } catch (Exception e) {
            HttpUtil.sendError(exchange, 400, "Invalid JSON request body");
            return;
        }

        if (req == null || req.name == null || req.name.trim().isEmpty() ||
            req.email == null || req.email.trim().isEmpty() ||
            req.password == null || req.password.isEmpty()) {
            HttpUtil.sendError(exchange, 400, "Name, email, and password are required.");
            return;
        }

        String email = req.email.trim().toLowerCase();
        if (!email.matches("^[\\w._%+\\-]+@[\\w.\\-]+\\.[a-zA-Z]{2,}$")) {
            HttpUtil.sendError(exchange, 400, "Please enter a valid email address.");
            return;
        }

        if (req.password.length() < 4) {
            HttpUtil.sendError(exchange, 400, "Password must be at least 4 characters long.");
            return;
        }

        try {
            if (DatabaseManager.isEmailTaken(email)) {
                HttpUtil.sendError(exchange, 409, "An account with this email already exists.");
                return;
            }

            User user = DatabaseManager.registerUser(req.name.trim(), email, req.password);
            SessionManager.UserSession session = SessionManager.createSession(user);

            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getUserId());
            data.put("name", user.getName());
            data.put("email", user.getEmail());
            data.put("token", session.getToken());

            HttpUtil.sendJsonResponse(exchange, 201, ApiResponse.ok("User registered successfully", data));
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error during registration: " + e.getMessage());
        }
    }

    private void handleLogin(HttpExchange exchange) throws IOException {
        String body = HttpUtil.readRequestBody(exchange);
        LoginRequest req;
        try {
            req = JsonUtil.fromJson(body, LoginRequest.class);
        } catch (Exception e) {
            HttpUtil.sendError(exchange, 400, "Invalid JSON request body");
            return;
        }

        if (req == null || req.email == null || req.email.trim().isEmpty() ||
            req.password == null || req.password.isEmpty()) {
            HttpUtil.sendError(exchange, 400, "Email and password are required.");
            return;
        }

        try {
            User user = DatabaseManager.loginUser(req.email.trim().toLowerCase(), req.password);
            if (user == null) {
                HttpUtil.sendError(exchange, 401, "Invalid email or password.");
                return;
            }

            SessionManager.UserSession session = SessionManager.createSession(user);

            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getUserId());
            data.put("name", user.getName());
            data.put("email", user.getEmail());
            data.put("token", session.getToken());

            HttpUtil.sendJsonResponse(exchange, 200, ApiResponse.ok("Login successful", data));
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error during login: " + e.getMessage());
        }
    }

    private void handleLogout(HttpExchange exchange) throws IOException {
        String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            SessionManager.invalidateSession(token);
        }
        HttpUtil.sendJsonResponse(exchange, 200, ApiResponse.ok("Logged out successfully", null));
    }

    private void handleMe(HttpExchange exchange) throws IOException {
        SessionManager.UserSession session = SessionManager.authenticate(exchange);
        if (session == null) {
            HttpUtil.sendError(exchange, 401, "Unauthorized: Please log in.");
            return;
        }

        Map<String, Object> data = new HashMap<>();
        data.put("userId", session.getUserId());
        data.put("name", session.getName());
        data.put("email", session.getEmail());

        HttpUtil.sendJsonResponse(exchange, 200, ApiResponse.ok("User profile retrieved", data));
    }

    private void handleChangePassword(HttpExchange exchange) throws IOException {
        SessionManager.UserSession session = SessionManager.authenticate(exchange);
        if (session == null) {
            HttpUtil.sendError(exchange, 401, "Unauthorized: Please log in.");
            return;
        }

        String body = HttpUtil.readRequestBody(exchange);
        ChangePasswordRequest req;
        try {
            req = JsonUtil.fromJson(body, ChangePasswordRequest.class);
        } catch (Exception e) {
            HttpUtil.sendError(exchange, 400, "Invalid JSON request body");
            return;
        }

        if (req == null || req.currentPassword == null || req.currentPassword.isEmpty() ||
            req.newPassword == null || req.newPassword.isEmpty()) {
            HttpUtil.sendError(exchange, 400, "Current password and new password are required.");
            return;
        }

        if (req.newPassword.length() < 4) {
            HttpUtil.sendError(exchange, 400, "New password must be at least 4 characters long.");
            return;
        }

        try {
            boolean success = DatabaseManager.changePassword(session.getUserId(), req.currentPassword, req.newPassword);
            if (!success) {
                HttpUtil.sendError(exchange, 400, "Current password does not match.");
                return;
            }
            HttpUtil.sendJsonResponse(exchange, 200, ApiResponse.ok("Password changed successfully", null));
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error changing password: " + e.getMessage());
        }
    }

    private void handleUpdateProfile(HttpExchange exchange) throws IOException {
        SessionManager.UserSession session = SessionManager.authenticate(exchange);
        if (session == null) {
            HttpUtil.sendError(exchange, 401, "Unauthorized: Please log in.");
            return;
        }

        String body = HttpUtil.readRequestBody(exchange);
        UpdateProfileRequest req;
        try {
            req = JsonUtil.fromJson(body, UpdateProfileRequest.class);
        } catch (Exception e) {
            HttpUtil.sendError(exchange, 400, "Invalid JSON request body");
            return;
        }

        if (req == null || req.name == null || req.name.trim().isEmpty()) {
            HttpUtil.sendError(exchange, 400, "Name is required.");
            return;
        }

        String newName = req.name.trim();
        if (newName.length() < 2) {
            HttpUtil.sendError(exchange, 400, "Name must be at least 2 characters long.");
            return;
        }

        try {
            boolean success = DatabaseManager.updateUserName(session.getUserId(), newName);
            if (!success) {
                HttpUtil.sendError(exchange, 400, "Failed to update profile.");
                return;
            }
            SessionManager.updateSessionName(session.getToken(), newName);

            Map<String, Object> data = new HashMap<>();
            data.put("userId", session.getUserId());
            data.put("name", newName);
            data.put("email", session.getEmail());

            HttpUtil.sendJsonResponse(exchange, 200, ApiResponse.ok("Profile updated successfully", data));
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error updating profile: " + e.getMessage());
        }
    }
}

