import type { TxClient } from '../../infra/transaction.js';
import { startConsumer } from './streamConsumer.js';
import { withTransaction } from '../../infra/transaction.js';

export async function handlePaymentFailed(data: { order_id: string }) {
  if (!data.order_id  || data.order_id.trim() === '') {
    console.error('Invalid order_id in handlePaymentFailed:', data);
    return;
  }

  await withTransaction(async (tx: TxClient) => {
    const { rows } = await tx.query(
      `UPDATE orders
         SET status = 'PAYMENT_FAILED', updated_at = NOW()
       WHERE id = $1 AND status = 'PENDING_PAYMENT'
       RETURNING id`,
      [data.order_id]
    );
    
    if (rows.length === 0) {
      console.warn(`Order ${data.order_id} not found or not in PENDING_PAYMENT status`);
    }
  });
}

if (process.env.NODE_ENV !== 'test') {
startConsumer({
  stream: "payment.failed",
  group: "payment_failed_group",
  consumer: `payment_failed_${process.pid}`,
  handler: handlePaymentFailed,
});
}

