CREATE DATABASE IF NOT EXISTS expense_tracker
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE expense_tracker;

CREATE TABLE IF NOT EXISTS users (
    user_id   INT           NOT NULL AUTO_INCREMENT,
    name      VARCHAR(100)  NOT NULL,
    email     VARCHAR(150)  NOT NULL,
    password  VARCHAR(255)  NOT NULL,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email)
);

CREATE TABLE IF NOT EXISTS categories (
    category_id   INT           NOT NULL AUTO_INCREMENT,
    user_id       INT           NOT NULL,
    category_name VARCHAR(100)  NOT NULL,
    PRIMARY KEY (category_id),
    UNIQUE KEY uq_category_per_user (user_id, category_name),
    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expenses (
    expense_id     INT            NOT NULL AUTO_INCREMENT,
    user_id        INT            NOT NULL,
    category_id    INT            NOT NULL,
    amount         DECIMAL(10, 2) NOT NULL,
    expense_date   DATE           NOT NULL,
    payment_method VARCHAR(50)    NOT NULL DEFAULT 'Cash',
    description    VARCHAR(255),
    PRIMARY KEY (expense_id),
    CONSTRAINT fk_expenses_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_expenses_category
        FOREIGN KEY (category_id) REFERENCES categories (category_id)
        ON DELETE RESTRICT,
    INDEX idx_expenses_user_date (user_id, expense_date)
);

CREATE TABLE IF NOT EXISTS budgets (
    budget_id     INT            NOT NULL AUTO_INCREMENT,
    user_id       INT            NOT NULL,
    category_id   INT            NOT NULL,
    month         TINYINT        NOT NULL,  -- 1 to 12
    year          SMALLINT       NOT NULL,
    budget_amount DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (budget_id),
    UNIQUE KEY uq_budget_per_month (user_id, category_id, month, year),
    CONSTRAINT fk_budgets_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_budgets_category
        FOREIGN KEY (category_id) REFERENCES categories (category_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_month CHECK (month BETWEEN 1 AND 12),
    CONSTRAINT chk_budget_amount CHECK (budget_amount > 0)
);