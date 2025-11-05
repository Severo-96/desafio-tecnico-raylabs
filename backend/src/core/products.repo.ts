import { db } from '../infra/database.js';
import { normalizeName } from './validators.js';
import { HttpError } from '../errors/HttpError.js';

export type Product = {
  id: string;
  name: string;
  amount: number;
  stock: number;
  created_at: string;
  updated_at: string;
};

export async function listProducts(limit = 50, offset = 0) {
  const [result, countResult] = await Promise.all([
    db.query<Product>(
    `SELECT * FROM products ORDER BY id ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    db.query<{ count: string }>(`SELECT COALESCE(COUNT(*), 0)::int as count FROM products`)
  ]);
  
  return {
    data: result.rows,
    total: Number(countResult.rows[0]?.count || 0)
  };
}

export async function findProduct(id: string) {
  const { rows } = await db.query<Product>(`SELECT * FROM products WHERE id = $1`, [id]);
  return rows[0];
}

export async function createProduct(params: { name: string, amount: number, stock: number }) {
  const nameNormalized = normalizeName(params.name);

  try {
  const { rows } = await db.query<Product>(
    `INSERT INTO products (name, amount, stock)
    VALUES ($1, $2, $3)
    RETURNING *`,
    [nameNormalized, params.amount, params.stock]
  );
  return rows[0];

  } catch (err: any) {
    if (err.constraint === 'uniq_products_name') {
      throw new HttpError('Product already registered', 409);
    }
    throw err;
  }
}

export async function updateProduct(params: { id: string | number, name: string; amount: number; stock: number }) {
  const existing = await db.query('SELECT * FROM products WHERE id = $1', [params.id]);
  if (existing.rowCount === 0) {
    throw new HttpError('Product not found', 404);
  }

  const nameNormalized = normalizeName(params.name);

  try {
    const { rows } = await db.query(`
      UPDATE products
      SET name = $1,
          amount = $2,
          stock = $3,
          updated_at = NOW()
      WHERE id = $4
      RETURNING *;`,
      [nameNormalized, params.amount, params.stock, params.id]
    );
    return rows[0];

  } catch (err: any) {
    if (err.constraint === 'uniq_products_name') {
      throw new HttpError('Product already registered', 409);
    }
    throw err;
  }
}

export async function deleteProductById(id: string | number ) {
  const result = await db.query(`DELETE FROM products WHERE id = $1 RETURNING *;`, [id]);

  if (result.rowCount === 0) {
    throw new HttpError('Product not found', 404);
  }
}
