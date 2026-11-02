package com.expensetracker.api;

import com.expensetracker.api.dto.ExpenseDTO;
import com.expensetracker.database.DatabaseManager;
import com.expensetracker.model.Expense;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ExpenseController implements HttpHandler {

    private static final Pattern EXPENSE_ID_PATTERN = Pattern.compile("^/api/expenses/(\\d+)$");

    public static class ExpenseRequest {
        public String description;
        public Double amount;
        public Integer categoryId;
        public String expenseDate;
        public String paymentMode;
        public String paymentMethod; // Fallback if sent as paymentMethod
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
            if ("/api/expenses".equals(path) || "/api/expenses/".equals(path)) {
                if ("GET".equals(method)) {
                    handleGetExpenses(exchange, session);
                } else if ("POST".equals(method)) {
                    handleCreateExpense(exchange, session);
                } else {
                    HttpUtil.sendError(exchange, 405, "Method not allowed: " + method);
                }
            } else {
                Matcher matcher = EXPENSE_ID_PATTERN.matcher(path);
                if (matcher.matches()) {
                    int expenseId = Integer.parseInt(matcher.group(1));
                    if ("PUT".equals(method)) {
                        handleUpdateExpense(exchange, session, expenseId);
                    } else if ("DELETE".equals(method)) {
                        handleDeleteExpense(exchange, session, expenseId);
                    } else if ("GET".equals(method)) {
                        handleGetExpenseById(exchange, session, expenseId);
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

    private void handleGetExpenses(HttpExchange exchange, SessionManager.UserSession session) throws IOException {
        Map<String, String> query = HttpUtil.parseQueryParams(exchange.getRequestURI());

        Integer categoryId = null;
        if (query.containsKey("categoryId") && !query.get("categoryId").trim().isEmpty()) {
            try {
                categoryId = Integer.parseInt(query.get("categoryId").trim());
            } catch (NumberFormatException e) {
                HttpUtil.sendError(exchange, 400, "Invalid categoryId parameter.");
                return;
            }
        }

        LocalDate startDate = null;
        if (query.containsKey("startDate") && !query.get("startDate").trim().isEmpty()) {
            try {
                startDate = LocalDate.parse(query.get("startDate").trim());
            } catch (DateTimeParseException e) {
                HttpUtil.sendError(exchange, 400, "Invalid startDate format. Expected YYYY-MM-DD.");
                return;
            }
        }

        LocalDate endDate = null;
        if (query.containsKey("endDate") && !query.get("endDate").trim().isEmpty()) {
            try {
                endDate = LocalDate.parse(query.get("endDate").trim());
            } catch (DateTimeParseException e) {
                HttpUtil.sendError(exchange, 400, "Invalid endDate format. Expected YYYY-MM-DD.");
                return;
            }
        }

        String search = query.get("search");
        String sortBy = query.get("sortBy");
        String sortOrder = query.get("sortOrder");

        try {
            List<Expense> expenses = DatabaseManager.getFilteredExpenses(
                    session.getUserId(), categoryId, startDate, endDate, search, sortBy, sortOrder);

            List<ExpenseDTO> dtoList = new ArrayList<>();
            for (Expense exp : expenses) {
                dtoList.add(ExpenseDTO.fromModel(exp));
            }

            HttpUtil.sendJsonResponse(exchange, 200, ApiResponse.ok(dtoList));
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error retrieving expenses: " + e.getMessage());
        }
    }

    private void handleGetExpenseById(HttpExchange exchange, SessionManager.UserSession session, int expenseId) throws IOException {
        try {
            Expense expense = DatabaseManager.getExpenseById(expenseId, session.getUserId());
            if (expense == null) {
                HttpUtil.sendError(exchange, 404, "Expense not found with ID: " + expenseId);
                return;
            }
            HttpUtil.sendJsonResponse(exchange, 200, ApiResponse.ok(ExpenseDTO.fromModel(expense)));
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error retrieving expense: " + e.getMessage());
        }
    }

    private void handleCreateExpense(HttpExchange exchange, SessionManager.UserSession session) throws IOException {
        String body = HttpUtil.readRequestBody(exchange);
        ExpenseRequest req;
        try {
            req = JsonUtil.fromJson(body, ExpenseRequest.class);
        } catch (Exception e) {
            HttpUtil.sendError(exchange, 400, "Invalid JSON request body.");
            return;
        }

        if (req == null) {
            HttpUtil.sendError(exchange, 400, "Request body is required.");
            return;
        }

        // Validate amount
        if (req.amount == null || req.amount <= 0) {
            HttpUtil.sendError(exchange, 400, "Expense amount must be a positive number.");
            return;
        }
        BigDecimal amountBd = BigDecimal.valueOf(req.amount).setScale(2, RoundingMode.HALF_UP);

        // Validate category
        if (req.categoryId == null || req.categoryId <= 0) {
            HttpUtil.sendError(exchange, 400, "Valid categoryId is required.");
            return;
        }

        try {
            if (!DatabaseManager.isCategoryOwnedByUser(req.categoryId, session.getUserId())) {
                HttpUtil.sendError(exchange, 400, "Invalid category: category does not exist or belong to user.");
                return;
            }
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error validating category: " + e.getMessage());
            return;
        }

        // Validate date
        if (req.expenseDate == null || req.expenseDate.trim().isEmpty()) {
            HttpUtil.sendError(exchange, 400, "expenseDate is required in YYYY-MM-DD format.");
            return;
        }
        LocalDate date;
        try {
            date = LocalDate.parse(req.expenseDate.trim());
        } catch (DateTimeParseException e) {
            HttpUtil.sendError(exchange, 400, "Invalid expenseDate format. Expected YYYY-MM-DD.");
            return;
        }

        // Description & payment mode
        String description = (req.description != null) ? req.description.trim() : "";
        if (description.length() > 255) {
            description = description.substring(0, 255);
        }

        String paymentMode = req.paymentMode != null ? req.paymentMode.trim()
                : (req.paymentMethod != null ? req.paymentMethod.trim() : "Cash");
        if (paymentMode.isEmpty()) paymentMode = "Cash";
        if (paymentMode.length() > 50) paymentMode = paymentMode.substring(0, 50);

        Expense exp = new Expense();
        exp.setUserId(session.getUserId());
        exp.setCategoryId(req.categoryId);
        exp.setAmount(amountBd.doubleValue());
        exp.setExpenseDate(date);
        exp.setPaymentMethod(paymentMode);
        exp.setDescription(description);

        try {
            int newId = DatabaseManager.addExpenseWithGeneratedId(exp);
            Expense created = DatabaseManager.getExpenseById(newId, session.getUserId());
            HttpUtil.sendJsonResponse(exchange, 201, ApiResponse.ok("Expense created successfully", ExpenseDTO.fromModel(created)));
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error creating expense: " + e.getMessage());
        }
    }

    private void handleUpdateExpense(HttpExchange exchange, SessionManager.UserSession session, int expenseId) throws IOException {
        try {
            Expense existing = DatabaseManager.getExpenseById(expenseId, session.getUserId());
            if (existing == null) {
                HttpUtil.sendError(exchange, 404, "Expense not found or does not belong to user.");
                return;
            }

            String body = HttpUtil.readRequestBody(exchange);
            ExpenseRequest req;
            try {
                req = JsonUtil.fromJson(body, ExpenseRequest.class);
            } catch (Exception e) {
                HttpUtil.sendError(exchange, 400, "Invalid JSON request body.");
                return;
            }

            if (req == null) {
                HttpUtil.sendError(exchange, 400, "Request body is required.");
                return;
            }

            if (req.amount != null) {
                if (req.amount <= 0) {
                    HttpUtil.sendError(exchange, 400, "Expense amount must be a positive number.");
                    return;
                }
                BigDecimal bd = BigDecimal.valueOf(req.amount).setScale(2, RoundingMode.HALF_UP);
                existing.setAmount(bd.doubleValue());
            }

            if (req.categoryId != null) {
                if (!DatabaseManager.isCategoryOwnedByUser(req.categoryId, session.getUserId())) {
                    HttpUtil.sendError(exchange, 400, "Invalid category: category does not belong to user.");
                    return;
                }
                existing.setCategoryId(req.categoryId);
            }

            if (req.expenseDate != null && !req.expenseDate.trim().isEmpty()) {
                try {
                    existing.setExpenseDate(LocalDate.parse(req.expenseDate.trim()));
                } catch (DateTimeParseException e) {
                    HttpUtil.sendError(exchange, 400, "Invalid expenseDate format. Expected YYYY-MM-DD.");
                    return;
                }
            }

            if (req.description != null) {
                String desc = req.description.trim();
                if (desc.length() > 255) desc = desc.substring(0, 255);
                existing.setDescription(desc);
            }

            String pMode = req.paymentMode != null ? req.paymentMode.trim() : req.paymentMethod;
            if (pMode != null && !pMode.trim().isEmpty()) {
                String pm = pMode.trim();
                if (pm.length() > 50) pm = pm.substring(0, 50);
                existing.setPaymentMethod(pm);
            }

            DatabaseManager.updateExpense(existing);
            Expense updated = DatabaseManager.getExpenseById(expenseId, session.getUserId());
            HttpUtil.sendJsonResponse(exchange, 200, ApiResponse.ok("Expense updated successfully", ExpenseDTO.fromModel(updated)));
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error updating expense: " + e.getMessage());
        }
    }

    private void handleDeleteExpense(HttpExchange exchange, SessionManager.UserSession session, int expenseId) throws IOException {
        try {
            Expense existing = DatabaseManager.getExpenseById(expenseId, session.getUserId());
            if (existing == null) {
                HttpUtil.sendError(exchange, 404, "Expense not found or does not belong to user.");
                return;
            }

            DatabaseManager.deleteExpense(expenseId, session.getUserId());
            HttpUtil.sendJsonResponse(exchange, 200, ApiResponse.ok("Expense deleted successfully", null));
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error deleting expense: " + e.getMessage());
        }
    }
}
