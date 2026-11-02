# EXPENZO 2.0 — MASTER DEVELOPMENT INSTRUCTION
## Autonomous AI Developer Agent — Google Antigravity IDE

**Project:** Expenzo — Personal Expense & Budget Tracker  
**Development approach:** 10-hour rapid implementation sprint  
**Frontend:** React + Vite + TypeScript  
**Backend:** Existing Java + JDBC  
**Database:** Existing MySQL database  
**Primary objective:** Upgrade the existing Expenzo MVP with a modern React interface while preserving the existing Java backend and MySQL database.

---

# 1. PROJECT OVERVIEW & OBJECTIVES

Expenzo is a personal expense and budget tracking application designed primarily for students, young adults and individuals managing everyday finances.

The existing application uses Java Swing, JDBC and MySQL. The new interface will use React, while Java remains responsible for backend operations and MySQL remains the source of truth.

The application should support:
- Registration and login.
- Add, view, edit and delete expenses.
- Expense categories.
- Monthly category-wise budgets.
- Budget progress and alerts.
- Interactive spending analytics.
- Search, filtering and sorting.
- Monthly expense summaries.
- CSV export.

## Critical rules

- Inspect the existing workspace before modifying it.
- Preserve working Java code and existing MySQL data.
- Do not migrate to Spring Boot.
- Do not replace MySQL or redesign the database.
- Do not add Kafka, Redis, AWS, OAuth, payment gateways or other external infrastructure.
- Do not add unnecessary database tables.
- Do not hardcode financial figures or display static alerts as real.
- Do not claim functionality works until it has been tested.
- Keep the original Swing application available as a fallback.
- Do not add `Audit_Logs` or claim audit-history functionality.

The completed application must calculate financial information dynamically from the authenticated user's actual database records.

---

# 2. TARGET ARCHITECTURE & TECHNOLOGY STACK

## Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui where practical
- Recharts
- Framer Motion
- React Router
- Axios or Fetch API

## Backend

- Existing Java version and Maven configuration.
- Existing JDBC connectivity and `DatabaseManager`.
- Lightweight Java HTTP server, preferably `com.sun.net.httpserver.HttpServer`.
- Gson or another lightweight JSON library, reusing an existing dependency if available.
- Simple controller-level request handling.
- Existing model classes.

## Database

Retain the existing four tables:
1. `users`
2. `categories`
3. `expenses`
4. `budgets`

No new tables are required for this sprint.

## Architecture

```text
React + Vite Frontend
        |
        | HTTP / JSON
        v
Lightweight Java HTTP API
        |
        v
Simple API Controllers
        |
        v
Existing Java Logic / DatabaseManager
        |
        v
JDBC
        |
        v
Existing MySQL Database
```

Do not introduce unnecessary enterprise layers. Keep SQL access in the existing database layer, not scattered across controllers or frontend components.

---

# 3. TARGET WORKSPACE LAYOUT

First inspect the real project structure, package names, Maven configuration and existing classes. Adapt this proposed structure to the actual workspace; do not force file moves that create risk.

```text
Expenzo/
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/[existing-package]/
│       │   ├── Main.java
│       │   ├── api/
│       │   │   ├── ApiServer.java
│       │   │   ├── AuthController.java
│       │   │   ├── ExpenseController.java
│       │   │   ├── BudgetController.java
│       │   │   ├── AnalyticsController.java
│       │   │   └── ReportController.java
│       │   ├── database/
│       │   │   └── DatabaseManager.java
│       │   ├── model/
│       │   │   ├── User.java
│       │   │   ├── Expense.java
│       │   │   ├── Category.java
│       │   │   └── Budget.java
│       │   └── [existing GUI classes retained]
│       └── resources/
│           └── database.sql
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── components/
│       │   ├── Sidebar.tsx
│       │   ├── Header.tsx
│       │   ├── StatCard.tsx
│       │   ├── ExpenseTable.tsx
│       │   ├── BudgetProgress.tsx
│       │   ├── NotificationPanel.tsx
│       │   ├── LoadingState.tsx
│       │   └── EmptyState.tsx
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Register.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Expenses.tsx
│       │   ├── Budgets.tsx
│       │   ├── Reports.tsx
│       │   └── Settings.tsx
│       ├── services/
│       │   ├── api.ts
│       │   ├── authService.ts
│       │   ├── expenseService.ts
│       │   ├── budgetService.ts
│       │   ├── analyticsService.ts
│       │   └── reportService.ts
│       ├── hooks/
│       │   ├── useExpenses.ts
│       │   ├── useBudgets.ts
│       │   └── useDashboard.ts
│       ├── context/
│       │   └── AuthContext.tsx
│       ├── types/
│       │   └── index.ts
│       └── utils/
│           ├── formatCurrency.ts
│           └── dateUtils.ts
└── README.md
```

---

# 4. FRONTEND REQUIREMENTS

Build a polished, responsive personal-finance interface.

## Design direction

- Modern dark theme with deep navy or charcoal backgrounds.
- Blue, purple and restrained gradient accents.
- Clean typography and consistent spacing.
- Rounded cards and clear visual hierarchy.
- Smooth but restrained animations.
- Responsive desktop and mobile layouts.
- Accessible labels, keyboard-friendly forms and reduced-motion support.

## Required screens

### Login
- Email or username, matching the existing authentication model.
- Password.
- Login button, validation, loading and error states.
- Registration navigation.
- Connect to the real Java authentication endpoint.

### Registration
- Name, email, password and confirmation.
- Validation and error handling.
- Reuse existing registration logic.

### Dashboard
- Total monthly expenses.
- Total monthly budget.
- Remaining budget.
- Transaction count.
- Category-wise pie chart.
- Monthly expense bar chart.
- Spending trend line chart.
- Highest spending category.
- Recent transactions.
- Category-wise budget progress.
- Dynamic budget notifications.

### Expenses
- Transaction table.
- Add, edit and delete expense forms.
- Search by description.
- Category filter.
- Date-range filter.
- Amount/date sorting.
- Fields: description, amount, category, date and payment mode.

### Budgets
- List category-wise monthly budgets.
- Create, edit and delete budgets.
- Show budget amount, spent amount, remaining amount and percentage used.
- Show threshold warnings.
- Fields: category, amount, month and year.

### Reports
- Selected month and year.
- Total expenses and transaction count.
- Category breakdown.
- Monthly summary.
- CSV export.

Do not implement PDF generation in this sprint.

### Settings
- Basic authenticated-user information.
- Logout.
- No complex roles or permission-management UI.

---

# 5. DYNAMIC DATA SYNCHRONIZATION

MySQL is the source of truth. Do not maintain conflicting financial totals in separate frontend components.

After a successful expense add, edit or delete:
1. Wait for the Java API to confirm success.
2. Refresh expense data.
3. Refresh dashboard totals and charts.
4. Recalculate budget progress.
5. Refresh current budget alerts.
6. Refresh monthly report data where relevant.

After a budget add, edit or delete:
1. Wait for the API response.
2. Refresh budget data.
3. Refresh total and remaining budget cards.
4. Recalculate alerts.
5. Update all relevant dashboard components.

Use lightweight shared React state and reusable hooks. Polling or WebSockets are not required. Updates after the current user's actions must be immediate.

---

# 6. BACKEND IMPLEMENTATION

## Java HTTP server

Add a lightweight HTTP server using `com.sun.net.httpserver.HttpServer`, if compatible with the existing Java version.

Requirements:
- Configurable local port, default `8080`.
- JSON request parsing and JSON responses.
- CORS configured for the Vite development origin.
- Reuse existing `DatabaseManager`.
- Close database and HTTP resources correctly.
- Handle errors consistently.
- Keep API mode separate from launching the Swing UI.
- Preserve the existing desktop application as a fallback.

Use Gson or an already available JSON library. Do not add a large framework.

## Existing classes to inspect and reuse

- `Main.java`: preserve the existing entry point; add a separate API startup path if appropriate.
- `DatabaseManager.java`: extend only with required retrieval, CRUD and aggregate methods.
- `Expense.java`: reuse the existing model; add fields only if needed.
- `Budget.java`: reuse for budget operations and calculations.
- Existing authentication classes: preserve working registration/login behaviour.
- Existing Swing panels: retain as fallback; do not delete them during migration.

## New lightweight classes

- `ApiServer.java`
- `AuthController.java`
- `ExpenseController.java`
- `BudgetController.java`
- `AnalyticsController.java`
- `ReportController.java`

Controllers should parse and validate HTTP requests, call existing database methods or small helpers, and return JSON. Avoid a large service architecture.

---

# 7. REST API CONTRACT

Base URL:

```text
http://localhost:8080/api
```

Use consistent JSON responses.

Success:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Failure:

```json
{
  "success": false,
  "message": "Unable to complete the request",
  "data": null
}
```

Use appropriate HTTP status codes: 200, 201, 400, 401, 404, 409 and 500.

## Authentication

### POST `/api/auth/register`

Request:

```json
{
  "name": "Alex",
  "email": "alex@example.com",
  "password": "example-password"
}
```

Response data:

```json
{
  "userId": 1,
  "name": "Alex",
  "email": "alex@example.com"
}
```

### POST `/api/auth/login`

Request:

```json
{
  "email": "alex@example.com",
  "password": "example-password"
}
```

Response data:

```json
{
  "userId": 1,
  "name": "Alex",
  "email": "alex@example.com"
}
```

### POST `/api/auth/logout`

End the current session.

### GET `/api/auth/me`

Return the current authenticated user's basic information.

Preserve the existing authentication model. Use a minimal server-managed session or another simple consistent mechanism. Never return passwords or password hashes. Never trust a user ID supplied by the browser as proof of ownership. If secure authentication cannot be completed, disclose the limitation rather than pretending it is secure.

## Expenses

### GET `/api/expenses`

Optional query parameters:

```text
?categoryId=2&startDate=2026-11-01&endDate=2026-11-30&search=food&sortBy=amount&sortOrder=desc
```

Example response data:

```json
[
  {
    "expenseId": 1,
    "description": "Lunch",
    "amount": 150.00,
    "categoryId": 2,
    "categoryName": "Food",
    "expenseDate": "2026-11-02",
    "paymentMode": "UPI"
  }
]
```

### POST `/api/expenses`

Request:

```json
{
  "description": "Lunch",
  "amount": 150.00,
  "categoryId": 2,
  "expenseDate": "2026-11-02",
  "paymentMode": "UPI"
}
```

### PUT `/api/expenses/{id}`

Request:

```json
{
  "description": "Updated lunch",
  "amount": 180.00,
  "categoryId": 2,
  "expenseDate": "2026-11-02",
  "paymentMode": "UPI"
}
```

### DELETE `/api/expenses/{id}`

Delete only a record belonging to the authenticated user.

## Categories

### GET `/api/categories`

Return actual category records from MySQL:

```json
[
  {
    "categoryId": 1,
    "categoryName": "Food"
  },
  {
    "categoryId": 2,
    "categoryName": "Travel"
  }
]
```

Do not hardcode categories if database records exist.

## Budgets

### GET `/api/budgets`

Optional parameters: `month`, `year`.

Example response data:

```json
[
  {
    "budgetId": 1,
    "categoryId": 1,
    "categoryName": "Food",
    "month": 11,
    "year": 2026,
    "budgetAmount": 5000.00,
    "amountSpent": 3200.00,
    "remainingAmount": 1800.00,
    "percentageUsed": 64.0,
    "status": "NORMAL"
  }
]
```

Calculate `amountSpent` from actual expense records for the authenticated user, category and selected month.

### POST `/api/budgets`

Request:

```json
{
  "categoryId": 1,
  "month": 11,
  "year": 2026,
  "budgetAmount": 5000.00
}
```

### PUT `/api/budgets/{id}`

Request:

```json
{
  "categoryId": 1,
  "month": 11,
  "year": 2026,
  "budgetAmount": 6000.00
}
```

### DELETE `/api/budgets/{id}`

Delete only the authenticated user's budget.

Prevent duplicate budgets for the same user, category, month and year using existing constraints or application-level validation.

## Analytics

### GET `/api/analytics`

Optional parameters: `month`, `year`.

Example response data:

```json
{
  "totalExpenses": 8500.00,
  "totalBudget": 12000.00,
  "remainingBudget": 3500.00,
  "transactionCount": 24,
  "highestSpendingCategory": "Food",
  "categoryBreakdown": [
    {
      "categoryName": "Food",
      "amount": 3500.00
    },
    {
      "categoryName": "Travel",
      "amount": 2500.00
    }
  ],
  "monthlySpending": [
    {
      "month": "August",
      "amount": 6000.00
    },
    {
      "month": "September",
      "amount": 7200.00
    },
    {
      "month": "October",
      "amount": 8100.00
    }
  ]
}
```

These values illustrate the response format only. Calculate all returned figures from actual database records. Do not copy example figures into the application. Return available historical records; do not invent historical transactions. Show a sensible empty state when no data exists.

## Budget alerts

### GET `/api/budgets/alerts`

Calculate:

```text
percentageUsed = amountSpent / budgetAmount * 100
```

Thresholds:
- Below 75%: `NORMAL`
- 75% to below 90%: `APPROACHING`
- 90% to below 100%: `WARNING`
- 100% or above: `EXCEEDED`

Example response data:

```json
[
  {
    "budgetId": 1,
    "categoryName": "Food",
    "percentageUsed": 92.0,
    "status": "WARNING",
    "message": "You have used 92% of your Food budget."
  }
]
```

Generate alerts dynamically from current budget and expense records. Do not create repeated notification rows or hardcode alert messages unrelated to actual spending. Recalculate after expense or budget changes. Handle zero or invalid budget amounts safely.

## Monthly reports

### GET `/api/reports/monthly?month=11&year=2026`

Example response data:

```json
{
  "month": 11,
  "year": 2026,
  "totalExpenses": 8500.00,
  "transactionCount": 24,
  "categoryBreakdown": [
    {
      "categoryName": "Food",
      "amount": 3500.00
    },
    {
      "categoryName": "Travel",
      "amount": 2500.00
    }
  ]
}
```

### GET `/api/reports/export?month=11&year=2026`

Return a downloadable CSV containing only the authenticated user's expense records for that month. Set correct content type and content-disposition headers. Escape CSV fields and guard against spreadsheet formula injection.

---

# 8. TIME-SAVING IMPLEMENTATION SHORTCUTS

Use simple, honest shortcuts that preserve dynamic behaviour.

- Analytics: SQL `GROUP BY` and simple Java aggregation.
- Pie chart: actual category totals.
- Bar chart: actual monthly totals.
- Line chart: reuse monthly spending totals.
- Highest category: find the maximum category total.
- Budget alerts: simple Java conditional logic.
- Notifications: calculate current alert messages when requested; no notification table.
- Search: optional SQL filters or simple Java filtering for the small dataset.
- Reports: direct CSV generation in Java.
- User roles: one normal user type; no role hierarchy.
- Mock service wrappers: temporary development scaffolding only. Replace with real endpoints before completion.

Never label fabricated financial records as actual user records. The final dashboard must be connected to the same underlying data as the expense and budget pages.

---

# 9. SECURITY AND VALIDATION

Even under the deadline:

1. Use JDBC PreparedStatements.
2. Reject invalid or negative expense amounts.
3. Use `BigDecimal` for monetary calculations where practical.
4. Validate category IDs and dates.
5. Scope all user-owned queries and mutations to the authenticated user.
6. Never expose password hashes.
7. Reuse secure password hashing if present; improve storage carefully if not.
8. Validate month and year values.
9. Prevent duplicate monthly budgets.
10. Prevent unauthorized edits and deletions.
11. Handle database failures gracefully.
12. Do not expose SQL errors or stack traces to the frontend.
13. Escape CSV values and prevent formula injection.
14. Never report success before the database operation succeeds.

Do not add `Audit_Logs`; the existing database scope is four tables.

---

# 10. TEN-HOUR EXECUTION PLAN

## Phase 1 — Inspect and set up (Hour 0–1)

- Inspect the full Java project.
- Identify actual packages, Maven dependencies and database schema.
- Inspect `DatabaseManager` and existing model/authentication methods.
- Create React + Vite + TypeScript frontend.
- Install only required dependencies.
- Build shared layout, navigation and routes.

Deliverable: React application runs with a modern layout.

## Phase 2 — Java API (Hours 1–3)

- Implement lightweight HTTP server.
- Configure port, JSON handling and CORS.
- Reuse DatabaseManager.
- Implement authentication, expense, category and budget endpoints.
- Test actual MySQL connectivity and CRUD.

Deliverable: React can retrieve and modify actual database records.

## Phase 3 — Dashboard and analytics (Hours 3–5)

- Build summary cards.
- Connect analytics API.
- Implement pie, bar and line charts.
- Implement highest-category card.
- Implement recent transactions and budget overview.

Deliverable: Connected analytics dashboard.

## Phase 4 — Expenses and budgets (Hours 5–6.5)

- Implement expense table and CRUD forms.
- Add search, category/date filters and sorting.
- Implement budget CRUD and progress.

Deliverable: Working expense and budget management.

## Phase 5 — Alerts and reports (Hours 6.5–7.5)

- Implement budget thresholds.
- Implement dynamic alert panel.
- Implement monthly summaries.
- Implement CSV export.

Deliverable: Dynamic alerts and downloadable reports.

## Phase 6 — Integration and testing (Hours 7.5–10)

- Test registration and login.
- Test expense create/edit/delete.
- Verify dashboard totals and charts after each change.
- Test budget create/edit/delete.
- Test all alert thresholds.
- Test filters and CSV export.
- Fix integration errors.
- Polish responsive layout.
- Verify repeatable startup instructions.

If time becomes critical, prioritize working authentication, expense CRUD, budget CRUD, dynamic dashboard, analytics, alerts, CSV export and then visual polish.

---

# 11. ACCEPTANCE TESTS

Do not declare completion just because the frontend renders.

| Test | Expected result |
|---|---|
| Register | User stored successfully |
| Login | User reaches dashboard |
| Add expense | Database and UI update |
| Edit expense | Database and UI update |
| Delete expense | Database and UI update |
| Create budget | Budget appears |
| Delete budget | Budget disappears |
| Add expense in category | Pie chart updates |
| Increase spending | Budget progress updates |
| Cross 75% | Approaching alert appears |
| Cross 90% | Warning appears |
| Reach/exceed 100% | Exceeded alert appears |
| Search | Matching records appear |
| Date filter | Only matching records appear |
| CSV export | Correct monthly records download |
| Reload | Existing records remain |

Final conditions:
- Existing MySQL data is preserved.
- Java backend runs without Spring Boot.
- React runs independently through Vite.
- Financial values come from actual database records.
- Expense and budget changes update dependent UI.
- Alerts are dynamically calculated.
- No unsupported audit functionality is introduced.
- No external services are required.
- Existing Swing application remains available as fallback.
- README contains clear startup instructions.

---

# 12. FINAL AGENT EXECUTION INSTRUCTIONS

You are the autonomous lead developer upgrading Expenzo.

Before modifying files, inspect the workspace and report:
- Existing backend structure.
- Existing database tables.
- Reusable methods.
- Available dependencies.
- Conflicts between the proposed layout and actual code.

Then proceed incrementally.

Do not spend excessive time redesigning. Do not rewrite working functionality. Implement one end-to-end feature at a time, test it, and continue.

Keep the application runnable throughout development.

The final goal is a modern React-based Expenzo application backed by the existing Java + JDBC + MySQL system, with working expense management, budget management, dynamic analytics, smart budget alerts, advanced filters and CSV reports.

**Deliver a functional, visually impressive and demonstrable student project within the 10-hour sprint—not an unnecessarily complex enterprise system.**
