import { db } from '../infra/database.js';
import { normalizeDigits, normalizeName } from './validators.js';
import { HttpError } from '../errors/HttpError.js';
import type { TxClient } from '../infra/transaction.js';

export type Customer = {
  id: string;
  name: string;
  email: string;
  document_number: number;
  user_id?: string | null;
  created_at: string;
  updated_at: string;
};

export async function listCustomers(limit = 50, offset = 0) {
  const [result, countResult] = await Promise.all([
    db.query<Customer>(
    `SELECT 
      customers.*,
      users.id as user_id
    FROM customers
    LEFT JOIN users ON users.customer_id = customers.id
    ORDER BY customers.id ASC 
    LIMIT $1 OFFSET $2`,
    [limit, offset]
    ),
    db.query<{ count: string }>(`SELECT COALESCE(COUNT(*), 0)::int as count FROM customers`)
  ]);
  
  return {
    data: result.rows,
    total: Number(countResult.rows[0]?.count || 0)
  };
}

export async function findCustomer(id: string) {
  const { rows } = await db.query<Customer>(
    `SELECT 
      customers.*,
      users.id as user_id
    FROM customers
    LEFT JOIN users ON users.customer_id = customers.id
    WHERE customers.id = $1::bigint`,
    [id]
  );
  return rows[0];
}

export async function createCustomer(
  params: { name: string; email: string; document_number: string },
  tx?: TxClient
) {
  const documentNormalized = normalizeDigits(params.document_number);
  const emailNormalized = params.email.trim().toLowerCase();
  const nameNormalized = normalizeName(params.name);
  const queryClient = tx || db;

  try {
    const { rows } = await queryClient.query<Customer>(
      `INSERT INTO customers (name, email, document_number)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [nameNormalized, emailNormalized, documentNormalized]
    );
    return rows[0];

  } catch (err: any) {
    if (err.constraint === 'uniq_customers_email') {
      throw new HttpError('Email already registered', 409);
    }
    if (err.constraint === 'uniq_customers_document') {
      throw new HttpError('Document number already registered', 409);
    }
    throw err;
  }
}

export async function updateCustomer(
  params: { id: string | number, name: string; email: string; document_number: string },
  tx?: TxClient
) {
  const queryClient = tx || db;
  
  const existing = await queryClient.query('SELECT * FROM customers WHERE id = $1', [params.id]);
  if (existing.rowCount === 0) {
    throw new HttpError('Customer not found', 404);
  }

  const documentNormalized = normalizeDigits(params.document_number);
  const emailNormalized = params.email.trim().toLowerCase();
  const nameNormalized = normalizeName(params.name);

  try {
    const { rows } = await queryClient.query<Customer>(`
      UPDATE customers
      SET name = $1,
          email = $2,
          document_number = $3,
          updated_at = NOW()
      WHERE id = $4
      RETURNING *;`,
      [nameNormalized, emailNormalized, documentNormalized, params.id]
    );
    return rows[0];

  } catch (err: any) {
    if (err.constraint === 'uniq_customers_email') {
      throw new HttpError('Email already registered', 409);
    }
    if (err.constraint === 'uniq_customers_document') {
      throw new HttpError('Document number already registered', 409);
    }
    throw err;
  }
}

export async function deleteCustomerById(id: string | number ) {
  const result = await db.query(`DELETE FROM customers WHERE id = $1 RETURNING *;`, [id]);

  if (result.rowCount === 0) {
    throw new HttpError('Customer not found', 404);
  }
}
