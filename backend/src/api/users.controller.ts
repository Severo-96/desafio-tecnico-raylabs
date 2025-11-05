import type { Request, Response } from 'express';
import { isValidEmail, isValidDocument, isValidPassword, isNotEmptyParam } from '../core/validators.js';
import { updateUser, findUserById, updateUserRoleByCustomerId, deleteUserById, findUserAndCustomerById, listUsers, UserRole } from '../core/users.repo.js';
import { HttpError } from '../errors/HttpError.js';

type UpdateParams = {
  id: string | number;
  email: string;
  name: string;
  document_number: string;
  password?: string;
};

export async function getUser(req: Request, res: Response) {
  const userPayload = req.user;
  
  if (!userPayload) {
    throw new HttpError('User not authenticated', 401);
  }

  const user = await findUserAndCustomerById(userPayload.user_id);
  
  if (!user) {
    throw new HttpError('User not found', 404);
  }

  return res.status(200).json({
    user: {
      nickname: user.nickname,
      role: user.role,
      customer_id: user.customer_id,
      name: user.name,
      email: user.email,
      document_number: user.document_number,
    },
  });
}

export async function patchUser(req: Request, res: Response) {
  const userPayload = req.user;
  
  if (!userPayload) {
    throw new HttpError('User not authenticated', 401);
  }

  const { email, password, name, document_number } = req.body || {};

  if (!name || !isValidEmail(email) || !isValidDocument(document_number)) {
    throw new HttpError('Invalid parameters', 400);
  }

  if (isNotEmptyParam(password) && !isValidPassword(password)) {
    throw new HttpError('Password must be at least 6 characters', 400);
  }

  const user = await findUserById(userPayload.user_id);
  
  if (!user) {
    throw new HttpError('User not found', 404);
  }

  const updateParams: UpdateParams = {
    id: user.id,
    email,
    name,
    document_number,
    ...(isNotEmptyParam(password) ? { password } : {}),
  };
  const updatedUser = await updateUser(updateParams);

  return res.status(200).json({
    user: {
      nickname: updatedUser.nickname,
      role: updatedUser.role,
      email,
      name,
      document_number,
    },
  });
}

export async function patchUserRole(req: Request, res: Response) {
  const { customer_id, role } = req.body || {};

  if (!customer_id || !role) {
    throw new HttpError('Invalid parameters', 400);
  }

  if (role !== UserRole.ADMIN && role !== UserRole.CLIENT) {
    throw new HttpError('Invalid role', 400);
  }

  const updatedUser = await updateUserRoleByCustomerId(customer_id, role);

  return res.status(200).json({
    user: {
      id: updatedUser.id,
      nickname: updatedUser.nickname,
      role: updatedUser.role,
      customer_id: updatedUser.customer_id,
    },
  });
}

export async function deleteUser(req: Request, res: Response) {
  const userPayload = req.user;
  
  if (!userPayload) {
    throw new HttpError('User not authenticated', 401);
  }

  const user = await findUserById(userPayload.user_id);
  
  if (!user) {
    throw new HttpError('User not found', 404);
  }

  await deleteUserById(user.id);
  return res.status(204).send();
}

export async function getAllUsers(req: Request, res: Response) {
  const limit = Math.min(100, Number(req.query.limit) || 50);
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const result = await listUsers(limit, offset);
  return res.json({ 
    data: result.data, 
    pagination: { limit, offset, total: result.total } 
  });
}

