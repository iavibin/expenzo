export interface User {
  userId: number;
  name: string;
  email: string;
  token?: string;
}

export interface Category {
  categoryId: number;
  userId?: number;
  categoryName: string;
}

export interface Expense {
  expenseId: number;
  userId?: number;
  categoryId: number;
  categoryName?: string;
  amount: number;
  expenseDate: string;
  paymentMode: string;
  description: string;
}

export interface Budget {
  budgetId: number;
  categoryId: number;
  categoryName?: string;
  month: number;
  year: number;
  budgetAmount: number;
  amountSpent?: number;
  remainingAmount?: number;
  percentageUsed?: number;
  status?: 'NORMAL' | 'APPROACHING' | 'WARNING' | 'EXCEEDED';
}

export interface BudgetAlert {
  budgetId: number;
  categoryName: string;
  percentageUsed: number;
  status: 'NORMAL' | 'APPROACHING' | 'WARNING' | 'EXCEEDED';
  message: string;
}

export interface AnalyticsSummary {
  month: number;
  year: number;
  totalExpenses: number;
  totalBudget: number;
  remainingBudget: number;
  transactionCount: number;
  highestSpendingCategory: string;
  highestSpendingAmount: number;
  categoryBreakdown: { categoryName: string; amount: number }[];
  monthlySpending: { month: string; monthYear: string; amount: number }[];
  recentTransactions: Expense[];
}

export interface MonthlyReport {
  month: number;
  year: number;
  totalExpenses: number;
  totalBudget: number;
  remainingBudget: number;
  transactionCount: number;
  categoryBreakdown: { categoryName: string; amount: number }[];
  budgetComparison: Budget[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
