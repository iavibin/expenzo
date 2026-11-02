package com.expensetracker.api;

import com.expensetracker.api.dto.BudgetAlertDTO;
import com.expensetracker.api.dto.BudgetDTO;
import com.expensetracker.database.DatabaseManager;
import com.expensetracker.database.DatabaseManager.BudgetRecord;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class BudgetController implements HttpHandler {

    private static final Pattern BUDGET_ID_PATTERN = Pattern.compile("^/api/budgets/(\\d+)$");

    public static class BudgetRequest {
        public Integer categoryId;
        public Integer month;
        public Integer year;
        public Double budgetAmount;
    }

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

        try {
            if ("/api/budgets/alerts".equals(path) || "/api/budgets/alerts/".equals(path)) {
                if ("GET".equals(method)) {
                    handleGetAlerts(exchange, session);
                } else {
                    HttpUtil.sendError(exchange, 405, "Method not allowed: " + method);
                }
            } else if ("/api/budgets".equals(path) || "/api/budgets/".equals(path)) {
                if ("GET".equals(method)) {
                    handleGetBudgets(exchange, session);
                } else if ("POST".equals(method)) {
                    handleCreateBudget(exchange, session);
                } else {
                    HttpUtil.sendError(exchange, 405, "Method not allowed: " + method);
                }
            } else {
                Matcher matcher = BUDGET_ID_PATTERN.matcher(path);
                if (matcher.matches()) {
                    int budgetId = Integer.parseInt(matcher.group(1));
                    if ("PUT".equals(method)) {
                        handleUpdateBudget(exchange, session, budgetId);
                    } else if ("DELETE".equals(method)) {
                        handleDeleteBudget(exchange, session, budgetId);
                    } else if ("GET".equals(method)) {
                        handleGetBudgetById(exchange, session, budgetId);
                    } else {
                        HttpUtil.sendError(exchange, 405, "Method not allowed: " + method);
                    }
                } else {
                    HttpUtil.sendError(exchange, 404, "Endpoint not found: " + method + " " + path);
                }
            }
        } catch (Exception e) {
            HttpUtil.sendError(exchange, 500, "Internal server error: " + e.getMessage());
        }
    }

    private void handleGetAlerts(HttpExchange exchange, SessionManager.UserSession session) throws IOException {
        Map<String, String> query = HttpUtil.parseQueryParams(exchange.getRequestURI());

        LocalDate now = LocalDate.now();
        int month = now.getMonthValue();
        int year = now.getYear();

        if (query.containsKey("month") && !query.get("month").trim().isEmpty()) {
            try {
                month = Integer.parseInt(query.get("month").trim());
                if (month < 1 || month > 12) {
                    HttpUtil.sendError(exchange, 400, "Month must be between 1 and 12.");
                    return;
                }
            } catch (NumberFormatException e) {
                HttpUtil.sendError(exchange, 400, "Invalid month parameter.");
                return;
            }
        }

        if (query.containsKey("year") && !query.get("year").trim().isEmpty()) {
            try {
                year = Integer.parseInt(query.get("year").trim());
                if (year < 2000 || year > 2100) {
                    HttpUtil.sendError(exchange, 400, "Year must be between 2000 and 2100.");
                    return;
                }
            } catch (NumberFormatException e) {
                HttpUtil.sendError(exchange, 400, "Invalid year parameter.");
                return;
            }
        }

        try {
            List<BudgetRecord> records = DatabaseManager.getBudgetsWithSpent(session.getUserId(), month, year);
            List<BudgetAlertDTO> alerts = new ArrayList<>();
            for (BudgetRecord r : records) {
                alerts.add(BudgetAlertDTO.fromRecord(r));
            }
            HttpUtil.sendJsonResponse(exchange, 200, ApiResponse.ok(alerts));
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error calculating alerts: " + e.getMessage());
        }
    }

    private void handleGetBudgets(HttpExchange exchange, SessionManager.UserSession session) throws IOException {
        Map<String, String> query = HttpUtil.parseQueryParams(exchange.getRequestURI());

        Integer month = null;
        if (query.containsKey("month") && !query.get("month").trim().isEmpty()) {
            try {
                month = Integer.parseInt(query.get("month").trim());
                if (month < 1 || month > 12) {
                    HttpUtil.sendError(exchange, 400, "Month must be between 1 and 12.");
                    return;
                }
            } catch (NumberFormatException e) {
                HttpUtil.sendError(exchange, 400, "Invalid month parameter.");
                return;
            }
        }

        Integer year = null;
        if (query.containsKey("year") && !query.get("year").trim().isEmpty()) {
            try {
                year = Integer.parseInt(query.get("year").trim());
                if (year < 2000 || year > 2100) {
                    HttpUtil.sendError(exchange, 400, "Year must be between 2000 and 2100.");
                    return;
                }
            } catch (NumberFormatException e) {
                HttpUtil.sendError(exchange, 400, "Invalid year parameter.");
                return;
            }
        }

        try {
            List<BudgetRecord> records = DatabaseManager.getBudgetsWithSpent(session.getUserId(), month, year);
            List<BudgetDTO> dtoList = new ArrayList<>();
            for (BudgetRecord r : records) {
                dtoList.add(BudgetDTO.fromRecord(r));
            }
            HttpUtil.sendJsonResponse(exchange, 200, ApiResponse.ok(dtoList));
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error retrieving budgets: " + e.getMessage());
        }
    }

    private void handleGetBudgetById(HttpExchange exchange, SessionManager.UserSession session, int budgetId) throws IOException {
        try {
            BudgetRecord record = DatabaseManager.getBudgetWithSpentById(budgetId, session.getUserId());
            if (record == null) {
                HttpUtil.sendError(exchange, 404, "Budget not found with ID: " + budgetId);
                return;
            }
            HttpUtil.sendJsonResponse(exchange, 200, ApiResponse.ok(BudgetDTO.fromRecord(record)));
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error retrieving budget: " + e.getMessage());
        }
    }

    private void handleCreateBudget(HttpExchange exchange, SessionManager.UserSession session) throws IOException {
        String body = HttpUtil.readRequestBody(exchange);
        BudgetRequest req;
        try {
            req = JsonUtil.fromJson(body, BudgetRequest.class);
        } catch (Exception e) {
            HttpUtil.sendError(exchange, 400, "Invalid JSON request body.");
            return;
        }

        if (req == null) {
            HttpUtil.sendError(exchange, 400, "Request body is required.");
            return;
        }

        if (req.budgetAmount == null || req.budgetAmount <= 0) {
            HttpUtil.sendError(exchange, 400, "Budget amount must be a positive number.");
            return;
        }
        BigDecimal amountBd = BigDecimal.valueOf(req.budgetAmount).setScale(2, RoundingMode.HALF_UP);

        if (req.categoryId == null || req.categoryId <= 0) {
            HttpUtil.sendError(exchange, 400, "Valid categoryId is required.");
            return;
        }

        if (req.month == null || req.month < 1 || req.month > 12) {
            HttpUtil.sendError(exchange, 400, "Month must be between 1 and 12.");
            return;
        }

        if (req.year == null || req.year < 2000 || req.year > 2100) {
            HttpUtil.sendError(exchange, 400, "Year must be between 2000 and 2100.");
            return;
        }

        try {
            if (!DatabaseManager.isCategoryOwnedByUser(req.categoryId, session.getUserId())) {
                HttpUtil.sendError(exchange, 400, "Invalid category: category does not belong to user.");
                return;
            }

            if (DatabaseManager.isBudgetDuplicate(session.getUserId(), req.categoryId, req.month, req.year, null)) {
                HttpUtil.sendError(exchange, 409, "A budget for this category, month, and year already exists.");
                return;
            }

            int newId = DatabaseManager.addBudgetWithGeneratedId(
                    session.getUserId(), req.categoryId, req.month, req.year, amountBd.doubleValue());

            BudgetRecord created = DatabaseManager.getBudgetWithSpentById(newId, session.getUserId());
            HttpUtil.sendJsonResponse(exchange, 201, ApiResponse.ok("Budget created successfully", BudgetDTO.fromRecord(created)));
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error creating budget: " + e.getMessage());
        }
    }

    private void handleUpdateBudget(HttpExchange exchange, SessionManager.UserSession session, int budgetId) throws IOException {
        try {
            BudgetRecord existing = DatabaseManager.getBudgetWithSpentById(budgetId, session.getUserId());
            if (existing == null) {
                HttpUtil.sendError(exchange, 404, "Budget not found or does not belong to user.");
                return;
            }

            String body = HttpUtil.readRequestBody(exchange);
            BudgetRequest req;
            try {
                req = JsonUtil.fromJson(body, BudgetRequest.class);
            } catch (Exception e) {
                HttpUtil.sendError(exchange, 400, "Invalid JSON request body.");
                return;
            }

            if (req == null) {
                HttpUtil.sendError(exchange, 400, "Request body is required.");
                return;
            }

            int categoryId = (req.categoryId != null) ? req.categoryId : existing.categoryId;
            int month = (req.month != null) ? req.month : existing.month;
            int year = (req.year != null) ? req.year : existing.year;
            double amount = (req.budgetAmount != null) ? req.budgetAmount : existing.budgetAmount;

            if (amount <= 0) {
                HttpUtil.sendError(exchange, 400, "Budget amount must be a positive number.");
                return;
            }
            BigDecimal amountBd = BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP);

            if (month < 1 || month > 12) {
                HttpUtil.sendError(exchange, 400, "Month must be between 1 and 12.");
                return;
            }

            if (year < 2000 || year > 2100) {
                HttpUtil.sendError(exchange, 400, "Year must be between 2000 and 2100.");
                return;
            }

            if (!DatabaseManager.isCategoryOwnedByUser(categoryId, session.getUserId())) {
                HttpUtil.sendError(exchange, 400, "Invalid category: category does not belong to user.");
                return;
            }

            if (DatabaseManager.isBudgetDuplicate(session.getUserId(), categoryId, month, year, budgetId)) {
                HttpUtil.sendError(exchange, 409, "Another budget already exists for this category, month, and year.");
                return;
            }

            DatabaseManager.updateBudgetDirect(budgetId, session.getUserId(), categoryId, month, year, amountBd.doubleValue());
            BudgetRecord updated = DatabaseManager.getBudgetWithSpentById(budgetId, session.getUserId());
            HttpUtil.sendJsonResponse(exchange, 200, ApiResponse.ok("Budget updated successfully", BudgetDTO.fromRecord(updated)));
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error updating budget: " + e.getMessage());
        }
    }

    private void handleDeleteBudget(HttpExchange exchange, SessionManager.UserSession session, int budgetId) throws IOException {
        try {
            BudgetRecord existing = DatabaseManager.getBudgetWithSpentById(budgetId, session.getUserId());
            if (existing == null) {
                HttpUtil.sendError(exchange, 404, "Budget not found or does not belong to user.");
                return;
            }

            DatabaseManager.deleteBudget(budgetId, session.getUserId());
            HttpUtil.sendJsonResponse(exchange, 200, ApiResponse.ok("Budget deleted successfully", null));
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error deleting budget: " + e.getMessage());
        }
    }
}
