import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
import type { User } from './users.repo.js';
import { UserRole } from './users.repo.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

const JWT_SECRET: string = process.env.JWT_SECRET;
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '1d';

export interface TokenPayload {
  user_id: string;
  customer_id: string;
  role: UserRole;
  nickname: string;
}

export function generateToken(user: User): string {
  const payload: TokenPayload = {
    user_id: user.id,
    customer_id: user.customer_id,
    role: user.role,
    nickname: user.nickname,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

