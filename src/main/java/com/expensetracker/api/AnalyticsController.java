package com.expensetracker.api;

import com.expensetracker.api.dto.AnalyticsDTO;
import com.expensetracker.api.dto.AnalyticsDTO.CategoryBreakdownItem;
import com.expensetracker.api.dto.AnalyticsDTO.MonthlyTrendItem;
import com.expensetracker.api.dto.ExpenseDTO;
import com.expensetracker.database.DatabaseManager;
import com.expensetracker.database.DatabaseManager.CategorySpendingItem;
import com.expensetracker.database.DatabaseManager.MonthlySpendingTrend;
import com.expensetracker.model.Expense;
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

public class AnalyticsController implements HttpHandler {

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

        if ("/api/analytics".equals(path) || "/api/analytics/".equals(path)) {
            if ("GET".equals(method)) {
                handleGetAnalytics(exchange, session);
            } else {
                HttpUtil.sendError(exchange, 405, "Method not allowed: " + method);
            }
        } else {
            HttpUtil.sendError(exchange, 404, "Endpoint not found: " + method + " " + path);
        }
    }

    private void handleGetAnalytics(HttpExchange exchange, SessionManager.UserSession session) throws IOException {
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
            int userId = session.getUserId();

            // Monetary values calculated using BigDecimal
            double rawExpenses = DatabaseManager.getTotalExpensesForMonth(userId, year, month);
            double rawBudget = DatabaseManager.getTotalBudgetForMonth(userId, year, month);

            BigDecimal expBd = BigDecimal.valueOf(rawExpenses).setScale(2, RoundingMode.HALF_UP);
            BigDecimal budBd = BigDecimal.valueOf(rawBudget).setScale(2, RoundingMode.HALF_UP);
            BigDecimal remBd = budBd.subtract(expBd).setScale(2, RoundingMode.HALF_UP);

            int txCount = DatabaseManager.getTransactionCount(userId, year, month);

            // Category breakdown
            List<CategorySpendingItem> catItems = DatabaseManager.getCategoryBreakdownList(userId, year, month);
            List<CategoryBreakdownItem> breakdown = new ArrayList<>();
            String highestCat = "None";
            double highestAmt = 0.0;

            for (int i = 0; i < catItems.size(); i++) {
                CategorySpendingItem item = catItems.get(i);
                double amt = BigDecimal.valueOf(item.amount).setScale(2, RoundingMode.HALF_UP).doubleValue();
                breakdown.add(new CategoryBreakdownItem(item.categoryName, amt));
                if (i == 0) {
                    highestCat = item.categoryName;
                    highestAmt = amt;
                }
            }

            // Monthly trends (past 6 months)
            List<MonthlySpendingTrend> trendItems = DatabaseManager.getMonthlySpendingTrends(userId, year, month, 6);
            List<MonthlyTrendItem> monthlySpending = new ArrayList<>();
            for (MonthlySpendingTrend t : trendItems) {
                double amt = BigDecimal.valueOf(t.amount).setScale(2, RoundingMode.HALF_UP).doubleValue();
                monthlySpending.add(new MonthlyTrendItem(t.month, t.monthYear, amt));
            }

            // Recent 5 transactions
            List<Expense> recentExpenses = DatabaseManager.getRecentExpenses(userId, 5);
            List<ExpenseDTO> recentDto = new ArrayList<>();
            for (Expense e : recentExpenses) {
                recentDto.add(ExpenseDTO.fromModel(e));
            }

            AnalyticsDTO dto = new AnalyticsDTO();
            dto.setMonth(month);
            dto.setYear(year);
            dto.setTotalExpenses(expBd.doubleValue());
            dto.setTotalBudget(budBd.doubleValue());
            dto.setRemainingBudget(remBd.doubleValue());
            dto.setTransactionCount(txCount);
            dto.setHighestSpendingCategory(highestCat);
            dto.setHighestSpendingAmount(highestAmt);
            dto.setCategoryBreakdown(breakdown);
            dto.setMonthlySpending(monthlySpending);
            dto.setRecentTransactions(recentDto);

            HttpUtil.sendJsonResponse(exchange, 200, ApiResponse.ok(dto));
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error generating analytics: " + e.getMessage());
        }
    }
}
