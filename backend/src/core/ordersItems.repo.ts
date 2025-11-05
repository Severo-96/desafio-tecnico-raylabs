import { db } from '../infra/database.js';
import type { TxClient } from '../infra/transaction.js';
import { HttpError } from '../errors/HttpError.js';

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  amount: number;
  created_at: string;
  updated_at: string;
};

export async function findOrderItemsByOrderId(order_id: string) {
  const { rows } = await db.query<OrderItem>(`SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC`, [order_id]);
  return rows;
}

export async function createOrderItem( tx: TxClient, params: { order_id: string; product_id: string; quantity: number; amount: number }) {
  try {
    const { rows } = await tx.query<OrderItem>(
      `INSERT INTO order_items (order_id, product_id, quantity, amount)
       VALUES ($1, $2, $3, $4)
       RETURNING id, order_id, product_id, quantity, amount, created_at, updated_at`,
      [params.order_id, params.product_id, params.quantity, params.amount]
    );
    return rows[0]!;

  } catch (err: any) {
    if (err.constraint === 'uniq_order_items_order_product') {
      throw new HttpError('Product already exists in this order', 409);
    }
    throw err;
  }
}


