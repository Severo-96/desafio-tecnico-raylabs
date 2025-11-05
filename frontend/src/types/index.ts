export interface User {
  id?: number;
  nickname: string;
  email: string;
  role: 'admin' | 'client';
  customer_id: number;
  name?: string;
  document_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: number;
  name: string;
  document_number: number;
  email: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  user_id?: number | null;
  user_nickname?: string | null;
  user_role?: string | null;
}

export interface Product {
  id: number;
  name: string;
  amount: number;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  amount: number;
  product?: Product;
}

export type OrderStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'PAYMENT_FAILED';

export interface Order {
  id: number;
  customer_id: number;
  status: OrderStatus;
  amount: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  customer?: Customer & {
    nickname?: string;
    document_number?: string | number;
  };
}

export interface LoginRequest {
  nickname: string;
  password: string;
}

export interface SignInRequest {
  nickname: string;
  password: string;
  email: string;
  name: string;
  document_number: string;
  phone?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  signIn: (data: SignInRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

