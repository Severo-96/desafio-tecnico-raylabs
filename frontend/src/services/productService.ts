import api from './api';
import type { Product } from '../types';

export interface CreateProductRequest {
  name: string;
  amount: number;
  stock: number;
}

export interface UpdateProductRequest {
  name: string;
  amount: number;
  stock: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export const productService = {
  async getAll(limit = 50, offset = 0): Promise<PaginatedResponse<Product>> {
    const response = await api.get('/products', {
      params: { limit, offset },
    });

    return {
      data: response.data.data || response.data,
      pagination: response.data.pagination || { limit, offset, total: 0 },
    };
  },

  async getById(id: number): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async create(data: CreateProductRequest): Promise<Product> {
    const response = await api.post('/products', data);
    return response.data;
  },

  async update(id: number, data: UpdateProductRequest): Promise<Product> {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};

