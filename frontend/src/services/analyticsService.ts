import api from './api';
import { AnalyticsSummary, ApiResponse } from '../types';

export const analyticsService = {
  async getAnalytics(month?: number, year?: number): Promise<AnalyticsSummary> {
    const res = await api.get<ApiResponse<AnalyticsSummary>>('/analytics', {
      params: { month, year },
    });
    return res.data.data;
  },
};
