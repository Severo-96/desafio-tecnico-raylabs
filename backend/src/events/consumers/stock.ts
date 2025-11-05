import type { TxClient } from '../../infra/transaction.js';
import { startConsumer } from './streamConsumer.js';
import { withTransaction } from '../../infra/transaction.js';
import { findOrderItemsByOrderId } from '../../core/ordersItems.repo.js';

export async function handlePaymentConfirmed(data: { order_id: string }) {
  if (!data.order_id  || data.order_id.trim() === '') {
    console.error('Invalid order_id in handlePaymentConfirmed:', data);
    return;
  }

  await withTransaction(async (tx: TxClient) => {
    // Check if order is already processed (CONFIRMED or CANCELLED)
    const { rows: existingOrder } = await tx.query<{ status: string }>(
      `SELECT status FROM orders WHERE id = $1`,
      [data.order_id]
    );

    if (existingOrder.length === 0) {
      console.warn(`Order ${data.order_id} not found`);
      return;
    }

    const order = existingOrder[0]!;
    if (order.status !== 'PENDING_PAYMENT') {
      console.log(`Order ${data.order_id} already processed (status: ${order.status}), skipping`);
      return;
    }

    const items = await findOrderItemsByOrderId(data.order_id);

    const productIds = items.map((i) => i.product_id);
    if (productIds.length > 0) {
      await tx.query(
        `SELECT id FROM products WHERE id = ANY($1::bigint[]) FOR UPDATE`,
        [productIds]
      );
    }

    const { rows: insufficient } = await tx.query<{ id: string }>(
      `SELECT products.id
         FROM products
         JOIN order_items ON order_items.product_id = products.id
       WHERE order_items.order_id = $1
         AND products.stock < order_items.quantity`,
      [data.order_id]
    );

    if (insufficient.length > 0) {
      await tx.query(
        `UPDATE orders
           SET status = 'CANCELLED', updated_at = NOW()
         WHERE id = $1`,
        [data.order_id]
      );
      return;
    }

    await tx.query(
      `UPDATE products
         SET stock = products.stock - order_items.quantity, updated_at = NOW()
       FROM order_items
       WHERE order_items.order_id = $1
         AND order_items.product_id = products.id`,
      [data.order_id]
    );

    await tx.query(
      `UPDATE orders
          SET status = 'CONFIRMED', updated_at = NOW()
        WHERE id = $1`,
      [data.order_id]
    );
  });
}

if (process.env.NODE_ENV !== 'test') {
startConsumer({
  stream: "payment.confirmed",
  group: "stock_group",
  consumer: `stock_${process.pid}`,
  handler: handlePaymentConfirmed,
});
}
