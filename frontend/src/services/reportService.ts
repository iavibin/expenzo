import api from './api';
import { ApiResponse, MonthlyReport } from '../types';

export const reportService = {
  async getMonthlyReport(month: number, year: number): Promise<MonthlyReport> {
    const res = await api.get<ApiResponse<MonthlyReport>>('/reports/monthly', {
      params: { month, year },
    });
    return res.data.data;
  },

  async downloadExportCsv(month: number, year: number): Promise<void> {
    const token = localStorage.getItem('expenzo_token');
    const response = await fetch(`/api/reports/export?month=${month}&year=${year}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to export report: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenzo_report_${year}_${String(month).padStart(2, '0')}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
