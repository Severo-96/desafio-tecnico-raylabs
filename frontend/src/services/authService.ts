import api from './api';
import type { LoginRequest, SignInRequest, User } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<void> {
    await api.post('/auth/login', credentials);
  },

  async signIn(data: SignInRequest): Promise<void> {
    await api.post('/auth/sign-in', data);
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<User> {
    const response = await api.get('/users/me');
    return response.data.user;
  },

  async updateUser(data: { email: string; name: string; document_number: string; password?: string }): Promise<User> {
    const response = await api.patch('/users/me', data);
    return response.data.user;
  },

  async deleteUser(): Promise<void> {
    await api.delete('/users/me');
  },
};

