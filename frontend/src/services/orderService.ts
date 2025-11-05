import api from './api';
import type { Order } from '../types';

export interface CreateOrderRequest {
  customer_id: number;
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export const orderService = {
  async getAll(limit = 50, offset = 0): Promise<PaginatedResponse<Order>> {
    const response = await api.get('/orders', {
      params: { limit, offset },
    });

    return {
      data: response.data.data || response.data,
      pagination: response.data.pagination || { limit, offset, total: 0 },
    };
  },

  async getById(id: number): Promise<Order> {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  async getByCustomerId(customerId: number, limit = 50, offset = 0): Promise<PaginatedResponse<Order>> {
    const response = await api.get(`/orders/customers/${customerId}`, {
      params: { limit, offset },
    });

    return {
      data: response.data.data || response.data,
      pagination: response.data.pagination || { limit, offset, total: 0 },
    };
  },

  async create(order: CreateOrderRequest): Promise<Order> {
    const response = await api.post('/orders', order);
    return response.data;
  },
};

