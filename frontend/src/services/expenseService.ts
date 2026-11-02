import api from './api';
import { ApiResponse, Expense } from '../types';

export interface ExpenseFilterParams {
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExpensePayload {
  description: string;
  amount: number;
  categoryId: number;
  expenseDate: string;
  paymentMode: string;
}

export const expenseService = {
  async getExpenses(params?: ExpenseFilterParams): Promise<Expense[]> {
    const res = await api.get<ApiResponse<Expense[]>>('/expenses', { params });
    return res.data.data;
  },

  async createExpense(payload: ExpensePayload): Promise<Expense> {
    const res = await api.post<ApiResponse<Expense>>('/expenses', payload);
    return res.data.data;
  },

  async updateExpense(id: number, payload: Partial<ExpensePayload>): Promise<Expense> {
    const res = await api.put<ApiResponse<Expense>>(`/expenses/${id}`, payload);
    return res.data.data;
  },

  async deleteExpense(id: number): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },
};
