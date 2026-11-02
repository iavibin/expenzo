import api from './api';
import { ApiResponse, Budget, BudgetAlert } from '../types';

export interface BudgetPayload {
  categoryId: number;
  month: number;
  year: number;
  budgetAmount: number;
}

export const budgetService = {
  async getBudgets(month?: number, year?: number): Promise<Budget[]> {
    const res = await api.get<ApiResponse<Budget[]>>('/budgets', {
      params: { month, year },
    });
    return res.data.data;
  },

  async createBudget(payload: BudgetPayload): Promise<Budget> {
    const res = await api.post<ApiResponse<Budget>>('/budgets', payload);
    return res.data.data;
  },

  async updateBudget(id: number, payload: Partial<BudgetPayload>): Promise<Budget> {
    const res = await api.put<ApiResponse<Budget>>(`/budgets/${id}`, payload);
    return res.data.data;
  },

  async deleteBudget(id: number): Promise<void> {
    await api.delete(`/budgets/${id}`);
  },

  async getAlerts(month?: number, year?: number): Promise<BudgetAlert[]> {
    const res = await api.get<ApiResponse<BudgetAlert[]>>('/budgets/alerts', {
      params: { month, year },
    });
    return res.data.data;
  },
};
