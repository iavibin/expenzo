package com.expensetracker.api;

import com.expensetracker.database.DatabaseManager;
import com.expensetracker.model.Category;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CategoryController implements HttpHandler {

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HttpUtil.handlePreflight(exchange)) {
            return;
        }

        SessionManager.UserSession session = SessionManager.authenticate(exchange);
        if (session == null) {
            HttpUtil.sendError(exchange, 401, "Unauthorized: Please log in.");
            return;
        }

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();

        if ("/api/categories".equals(path) || "/api/categories/".equals(path)) {
            if ("GET".equals(method)) {
                handleGetCategories(exchange, session);
            } else {
                HttpUtil.sendError(exchange, 405, "Method not allowed: " + method);
            }
        } else {
            HttpUtil.sendError(exchange, 404, "Endpoint not found: " + method + " " + path);
        }
    }

    private void handleGetCategories(HttpExchange exchange, SessionManager.UserSession session) throws IOException {
        try {
            List<Category> categories = DatabaseManager.getAllCategories(session.getUserId());
            List<Map<String, Object>> responseList = new ArrayList<>();
            for (Category c : categories) {
                Map<String, Object> map = new HashMap<>();
                map.put("categoryId", c.getCategoryId());
                map.put("categoryName", c.getCategoryName());
                responseList.add(map);
            }
            HttpUtil.sendJsonResponse(exchange, 200, ApiResponse.ok(responseList));
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error retrieving categories: " + e.getMessage());
        }
    }
}
