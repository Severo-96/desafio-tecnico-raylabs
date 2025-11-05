import type { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/HttpError.js';
import { UserRole } from '../core/users.repo.js';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user;

  if (!user) {
    throw new HttpError('Authentication required', 401);
  }

  if (user.role !== UserRole.ADMIN) {
    throw new HttpError('Admin access required', 403);
  }

  next();
}

