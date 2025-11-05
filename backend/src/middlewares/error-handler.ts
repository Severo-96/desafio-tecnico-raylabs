import type { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/HttpError.js';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof HttpError
    ? err.statusCode : typeof err.status === 'number'
    ? err.status : typeof err.statusCode === 'number'
    ? err.statusCode : 500;

  return res.status(status).json({
    error: err.message || 'Internal server error',
    code: err.code,
    details: err.details,
  });
}
