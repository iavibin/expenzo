package com.expensetracker.api;

import com.expensetracker.api.dto.BudgetDTO;
import com.expensetracker.api.dto.MonthlyReportDTO;
import com.expensetracker.api.dto.MonthlyReportDTO.CategoryBreakdownItem;
import com.expensetracker.database.DatabaseManager;
import com.expensetracker.database.DatabaseManager.BudgetRecord;
import com.expensetracker.database.DatabaseManager.CategorySpendingItem;
import com.expensetracker.model.Expense;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ReportController implements HttpHandler {

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
            if ("/api/reports/monthly".equals(path) || "/api/reports/monthly/".equals(path)) {
                if ("GET".equals(method)) {
                    handleMonthlyReport(exchange, session);
                } else {
                    HttpUtil.sendError(exchange, 405, "Method not allowed: " + method);
                }
            } else if ("/api/reports/export".equals(path) || "/api/reports/export/".equals(path)) {
                if ("GET".equals(method)) {
                    handleExportCsv(exchange, session);
                } else {
                    HttpUtil.sendError(exchange, 405, "Method not allowed: " + method);
                }
            } else {
                HttpUtil.sendError(exchange, 404, "Endpoint not found: " + method + " " + path);
            }
        } catch (Exception e) {
            HttpUtil.sendError(exchange, 500, "Internal server error: " + e.getMessage());
        }
    }

    private void handleMonthlyReport(HttpExchange exchange, SessionManager.UserSession session) throws IOException {
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

            double rawExpenses = DatabaseManager.getTotalExpensesForMonth(userId, year, month);
            double rawBudget = DatabaseManager.getTotalBudgetForMonth(userId, year, month);

            BigDecimal expBd = BigDecimal.valueOf(rawExpenses).setScale(2, RoundingMode.HALF_UP);
            BigDecimal budBd = BigDecimal.valueOf(rawBudget).setScale(2, RoundingMode.HALF_UP);
            BigDecimal remBd = budBd.subtract(expBd).setScale(2, RoundingMode.HALF_UP);

            int txCount = DatabaseManager.getTransactionCount(userId, year, month);

            List<CategorySpendingItem> catItems = DatabaseManager.getCategoryBreakdownList(userId, year, month);
            List<CategoryBreakdownItem> breakdown = new ArrayList<>();
            for (CategorySpendingItem item : catItems) {
                double amt = BigDecimal.valueOf(item.amount).setScale(2, RoundingMode.HALF_UP).doubleValue();
                breakdown.add(new CategoryBreakdownItem(item.categoryName, amt));
            }

            List<BudgetRecord> budgetRecords = DatabaseManager.getBudgetsWithSpent(userId, month, year);
            List<BudgetDTO> budgetComparison = new ArrayList<>();
            for (BudgetRecord b : budgetRecords) {
                budgetComparison.add(BudgetDTO.fromRecord(b));
            }

            MonthlyReportDTO dto = new MonthlyReportDTO();
            dto.setMonth(month);
            dto.setYear(year);
            dto.setTotalExpenses(expBd.doubleValue());
            dto.setTotalBudget(budBd.doubleValue());
            dto.setRemainingBudget(remBd.doubleValue());
            dto.setTransactionCount(txCount);
            dto.setCategoryBreakdown(breakdown);
            dto.setBudgetComparison(budgetComparison);

            HttpUtil.sendJsonResponse(exchange, 200, ApiResponse.ok(dto));
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error retrieving monthly report: " + e.getMessage());
        }
    }

    private void handleExportCsv(HttpExchange exchange, SessionManager.UserSession session) throws IOException {
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
            List<Expense> expenses = DatabaseManager.getExpensesForMonth(session.getUserId(), year, month);

            StringBuilder sb = new StringBuilder();
            // Prepend UTF-8 BOM so Excel on Windows renders UTF-8 properly
            sb.append('\uFEFF');

            // Header row
            sb.append("Expense ID,Date,Category,Description,Amount,Payment Method\r\n");

            for (Expense exp : expenses) {
                sb.append(exp.getExpenseId()).append(",");
                sb.append(sanitizeCsvField(exp.getExpenseDate().toString())).append(",");
                sb.append(sanitizeCsvField(exp.getCategoryName())).append(",");
                sb.append(sanitizeCsvField(exp.getDescription())).append(",");
                sb.append(String.format(java.util.Locale.US, "%.2f", exp.getAmount())).append(",");
                sb.append(sanitizeCsvField(exp.getPaymentMethod())).append("\r\n");
            }

            byte[] csvBytes = sb.toString().getBytes(StandardCharsets.UTF_8);

            String filename = String.format("expenzo_report_%04d_%02d.csv", year, month);

            HttpUtil.setCorsHeaders(exchange);
            exchange.getResponseHeaders().set("Content-Type", "text/csv; charset=UTF-8");
            exchange.getResponseHeaders().set("Content-Disposition", "attachment; filename=\"" + filename + "\"");
            exchange.getResponseHeaders().set("Access-Control-Expose-Headers", "Content-Disposition");
            exchange.sendResponseHeaders(200, csvBytes.length);

            try (OutputStream os = exchange.getResponseBody()) {
                os.write(csvBytes);
                os.flush();
            }
        } catch (SQLException e) {
            HttpUtil.sendError(exchange, 500, "Database error generating CSV export: " + e.getMessage());
        }
    }

    /**
     * Prevents CSV Formula Injection:
     * If a cell starts with =, +, -, @, \t, or \r, prepend a single quote (')
     * so spreadsheet engines (Excel, LibreOffice, Google Sheets) treat it as raw text.
     * Also safely quotes and escapes strings containing quotes, commas, or newlines.
     */
    public static String sanitizeCsvField(String field) {
        if (field == null) return "\"\"";
        String value = field.trim();

        if (!value.isEmpty()) {
            char first = value.charAt(0);
            if (first == '=' || first == '+' || first == '-' || first == '@' || first == '\t' || first == '\r') {
                value = "'" + value;
            }
        }

        if (value.contains("\"") || value.contains(",") || value.contains("\n") || value.contains("\r")) {
            value = "\"" + value.replace("\"", "\"\"") + "\"";
        }

        return value;
    }
}
