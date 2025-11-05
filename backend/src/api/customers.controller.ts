import type { Request, Response } from 'express';
import { isValidDocument, isValidEmail } from '../core/validators.js';
import { createCustomer, findCustomer, listCustomers, updateCustomer, deleteCustomerById } from '../core/customers.repo.js';
import { HttpError } from '../errors/HttpError.js';

export async function getAllCustomers(req: Request, res: Response) {
  const limit = Math.min(100, Number(req.query.limit) || 50);
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const result = await listCustomers(limit, offset);
  return res.json({ 
    data: result.data, 
    pagination: { limit, offset, total: result.total } 
  });
}

export async function getCustomer(req: Request<{ id: string }>, res: Response) {
  const customer = await findCustomer(req.params.id);

  if (!customer) {
    throw new HttpError('Customer not found', 404);
  }

  return res.json(customer);
}

export async function postCustomer(req: Request, res: Response) {
  const { name, email, document_number } = req.body || {};

  if (!name || !isValidEmail(email) || !isValidDocument(document_number)) {
    throw new HttpError('Invalid parameters', 400);
  }

  const customer = await createCustomer(req.body);
  return res.status(201).json(customer);
}

export async function patchCustomer(req: Request, res: Response) {
  const { name, email, document_number } = req.body || {};
  const { id } = req.params;

  if (!name || !isValidEmail(email) || !isValidDocument(document_number)) {
    throw new HttpError('Invalid parameters', 400);
  }

  const customer = await updateCustomer({ id, ...req.body });
  return res.status(200).json(customer);
}

export async function deleteCustomer(req: Request<{ id: string }>, res: Response) {
  await deleteCustomerById(req.params.id);
  return res.status(204).send();
}