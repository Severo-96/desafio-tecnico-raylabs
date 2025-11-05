import { startConsumer } from './streamConsumer.js';
import { publishToOutbox } from '../producer.js';
import { withTransaction } from '../../infra/transaction.js';
import type { TxClient } from '../../infra/transaction.js';

export async function handleOrderCreated(data: { order_id: string; }) {
  if (!data.order_id || typeof data.order_id !== 'string' || data.order_id.trim() === '') {
    console.error('Invalid order_id in handleOrderCreated:', data);
    return;
  }

  const ok = Math.random() > 0.5;

  await withTransaction(async (tx: TxClient) => {
    if (ok) {
      await publishToOutbox(tx, "payment.confirmed", {
        type: "PAYMENT_CONFIRMED",
        data: { order_id: data.order_id },
      });
    } else {
      await publishToOutbox(tx, "payment.failed", {
        type: "PAYMENT_FAILED",
        data: { order_id: data.order_id },
      });
    }
  });
}

if (process.env.NODE_ENV !== 'test') {
startConsumer({
  stream: "order.created",
  group: "payment_group",
  consumer: `payment_${process.pid}`,
  handler: handleOrderCreated,
});
}
