import api from './api';

export interface User {
  id: string;
  nickname: string;
  role: 'admin' | 'client';
  customer_id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  document_number: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export const userService = {
  async getAll(limit = 50, offset = 0): Promise<PaginatedResponse<User>> {
    const response = await api.get('/users', {
      params: { limit, offset },
    });

    return {
      data: response.data.data || response.data,
      pagination: response.data.pagination || { limit, offset, total: 0 },
    };
  },

  async updateRole(customer_id: string, role: 'admin' | 'client'): Promise<User> {
    const response = await api.patch('/users/role', {
      customer_id,
      role,
    });
    return response.data.user;
  },
};

