import api from './api';
import { ApiResponse, User } from '../types';

export const authService = {
  async register(name: string, email: string, password: string):Promise<User> {
    const res = await api.post<ApiResponse<User>>('/auth/register', { name, email, password });
    return res.data.data;
  },

  async login(email: string, password: string): Promise<User> {
    const res = await api.post<ApiResponse<User>>('/auth/login', { email, password });
    return res.data.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('expenzo_token');
      localStorage.removeItem('expenzo_user');
    }
  },

  async getMe(): Promise<User> {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },

  async updateProfile(name: string): Promise<User> {
    const res = await api.put<ApiResponse<User>>('/auth/profile', { name });
    return res.data.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post<ApiResponse<null>>('/auth/change-password', { currentPassword, newPassword });
  },
};
