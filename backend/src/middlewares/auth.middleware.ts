import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type TokenPayload } from '../core/auth.service.js';
import { HttpError } from '../errors/HttpError.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      throw new HttpError('Authentication required', 401);
    }

    const payload = verifyToken(token);
    req.user = payload;

    next();
  } catch (error: any) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError('Invalid or expired token', 401);
  }
}

