# Expenzo - Personal Expense Tracker

## About
Expenzo is a simple and intuitive desktop application built in Java to help users track their daily expenses and manage monthly budgets. It provides clear insights into spending habits through category-wise breakdown and a clean user interface.

## Features
- User registration and login
- Expense management
- Categories
- Monthly budgets
- Spending summary
- MySQL database integration

## Tech Stack
- Java 17+
- Java Swing
- MySQL
- JDBC
- Maven

## Project Structure
- src/main/java/com/expensetracker/ - Main application logic and GUI panels
- src/main/java/com/expensetracker/database/ - JDBC connection and database manager
- src/main/java/com/expensetracker/model/ - POJO classes representing DB entities
- src/main/resources/database.sql - SQL script to initialize the database
- pom.xml - Maven dependencies configuration

## Database Setup
1. Create the MySQL database using database.sql.
2. Copy .env.example to .env.
3. Enter the local MySQL credentials in .env.
4. Run the Maven project.

## How to Run
mvn clean compile
mvn exec:java "-Dexec.mainClass=com.expensetracker.Main"

## Concepts Demonstrated
- OOP
- Encapsulation
- Exception handling
- Java Swing
- JDBC
- SQL CRUD
- Primary/Foreign Keys
- JOIN
- Aggregate functions
- Transactions
