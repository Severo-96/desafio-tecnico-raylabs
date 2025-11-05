import type { Request, Response } from "express";
import { isNonNegativeInt, isNonNegativeNumber } from '../core/validators.js';
import { createProduct, findProduct, listProducts, updateProduct, deleteProductById } from '../core/products.repo.js';
import { HttpError } from '../errors/HttpError.js';

export async function getAllProducts(req: Request, res: Response) {
  const limit = Math.min(100, Number(req.query.limit) || 50);
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const result = await listProducts(limit, offset);
  return res.json({ 
    data: result.data, 
    pagination: { limit, offset, total: result.total } 
  });
}

export async function getProduct(req: Request<{ id: string }>, res: Response) {
  const product = await findProduct(req.params.id);

  if (!product) {
    throw new HttpError('Product not Found', 404);
  }

  return res.json(product);
}

export async function postProduct(req: Request, res: Response) {
  const { name, amount, stock } = req.body || {};

  if (!name || !isNonNegativeNumber(amount) || !isNonNegativeInt(stock)) {
    throw new HttpError('Invalid parameters', 400);
  }

  const product = await createProduct(req.body);
  return res.status(201).json(product);
}

export async function patchProduct(req: Request, res: Response) {
  const { name, amount, stock } = req.body || {};
  const { id } = req.params;

  if (!name || !isNonNegativeNumber(amount) || !isNonNegativeInt(stock)) {
    throw new HttpError('Invalid parameters', 400);
  }

  const product = await updateProduct({ id, ...req.body });
  return res.status(200).json(product);
}

export async function deleteProduct(req: Request<{ id: string }>, res: Response) {
  await deleteProductById(req.params.id);
  return res.status(204).send();
}
