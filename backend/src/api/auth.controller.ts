import type { Request, Response } from 'express';
import { isValidEmail, isValidDocument, isValidPassword, isValidNickname } from '../core/validators.js';
import { createUser, validateUserLogin } from '../core/users.repo.js';
import { generateToken } from '../core/auth.service.js';
import { HttpError } from '../errors/HttpError.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
};

export async function signIn(req: Request, res: Response) {
  const { email, nickname, password, name, document_number } = req.body || {};

  if (!name || !isValidEmail(email) || !isValidDocument(document_number)) {
    throw new HttpError('Invalid parameters', 400);
  }
  if (!isValidPassword(password)) {
    throw new HttpError('Password must be at least 6 characters', 400);
  }
  if (!isValidNickname(nickname)) {
    throw new HttpError('Nickname must be at least 3 characters', 400);
  }

  const user = await createUser({
    email,
    nickname,
    password,
    name,
    document_number,
  });

  const token = generateToken(user);
  res.cookie('token', token, cookieOptions);

  return res.status(201).json({
    user: {
      id: user.id,
      nickname: user.nickname,
      role: user.role,
      customer_id: user.customer_id,
    },
  });
}

export async function login(req: Request, res: Response) {
  const { nickname, password } = req.body || {};

  if (!nickname || !password) {
    throw new HttpError('Nickname and password are required', 400);
  }

  const user = await validateUserLogin(nickname, password);

  const token = generateToken(user);
  res.cookie('token', token, cookieOptions);

  return res.status(200).json({
    user: {
      id: user.id,
      nickname: user.nickname,
      role: user.role,
      customer_id: user.customer_id,
    },
  });
}

export async function logout(req: Request, res: Response) {
  res.clearCookie('token', cookieOptions);

  return res.status(200).json({
    message: 'Logged out successfully',
  });
}

