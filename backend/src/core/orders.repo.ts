import { db } from '../infra/database.js';
import type { TxClient } from '../infra/transaction.js';
import { HttpError } from '../errors/HttpError.js';

type Order = {
  id: string;
  customer_id: string;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "PAYMENT_FAILED";
  amount: number;
  created_at: string;
  updated_at: string;
};

export async function listOrders(limit = 50, offset = 0) {
  const [result, countResult] = await Promise.all([
    db.query<Order>(
    `SELECT * FROM orders ORDER BY id ASC LIMIT $1 OFFSET $2`,
    [limit, offset]
    ),
    db.query<{ count: string }>(`SELECT COALESCE(COUNT(*), 0)::int as count FROM orders`)
  ]);
  
  return {
    data: result.rows,
    total: Number(countResult.rows[0]?.count || 0)
  };
}

export async function findOrder(id: string) {
  const { rows } = await db.query<Order>(`SELECT * FROM orders WHERE id = $1`, [id]);
  return rows[0];
}

export async function createOrder(tx: TxClient, customer_id: string) {
  const { rows } = await tx.query<Order>(
    `INSERT INTO orders (customer_id, status)
      VALUES ($1, 'PENDING_PAYMENT')
      RETURNING id, customer_id, status`,
    [customer_id]
  );
  if (!rows[0]) throw new HttpError('Order creation failed', 422);

  return rows[0];
}

export async function updateOrderAmount(tx: TxClient, order_id: string, amount: number) {
  const { rows } = await tx.query<Order>(
    `UPDATE orders
       SET amount = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, customer_id, status, amount`,
    [amount, order_id]
  );
  if (!rows[0]) throw new HttpError('Order update failed', 422);

  return rows[0];
}

export async function listCustomerOrders(id: string, limit = 50, offset = 0) {
  const [result, countResult] = await Promise.all([
    db.query<Order>(
    `SELECT * FROM orders
      WHERE customer_id = $1
    ORDER BY id ASC
    LIMIT $2
    OFFSET $3`,
    [id, limit, offset]
    ),
    db.query<{ count: string }>(
      `SELECT COALESCE(COUNT(*), 0)::int as count FROM orders WHERE customer_id = $1`,
      [id]
    )
  ]);
  
  return {
    data: result.rows,
    total: Number(countResult.rows[0]?.count || 0)
  };
}
