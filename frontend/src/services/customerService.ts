import api from './api';
import type { Customer } from '../types';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export const customerService = {
  async getAll(limit = 50, offset = 0): Promise<PaginatedResponse<Customer>> {
    const response = await api.get('/customers', {
      params: { limit, offset },
    });

    return {
      data: response.data.data || response.data,
      pagination: response.data.pagination || { limit, offset, total: 0 },
    };
  },

  async getById(id: number): Promise<Customer> {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  async update(id: number, data: { name: string; email: string; document_number: string }): Promise<Customer> {
    const response = await api.patch(`/customers/${id}`, data);
    return response.data;
  },

  async create(data: { name: string; email: string; document_number: string }): Promise<Customer> {
    const response = await api.post('/customers', data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/customers/${id}`);
  },
};

