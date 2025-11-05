import { bootTestDb, closeDb } from '../test-helpers.js';
import { db } from '../../infra/database.js';
import { handleOrderCreated } from '../../events/consumers/payment.js';
import { handlePaymentConfirmed } from '../../events/consumers/stock.js';
import { handlePaymentFailed } from '../../events/consumers/paymentFailed.js';
import * as producerModule from '../../events/producer.js';

describe('Event Handlers', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await bootTestDb();
  });

  beforeEach(async () => {
    await bootTestDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe('handleOrderCreated', () => {
    it('should publish payment.confirmed or payment.failed when order is created', async () => {
      const orderId = '100';

      // Run handler multiple times to ensure both paths are tested
      const results: string[] = [];
      const publishToOutboxSpy = jest.spyOn(producerModule, 'publishToOutbox').mockImplementation(
        async (...args: unknown[]) => {
          const stream = args[1] as string;
          results.push(stream);
          return 'mock-outbox-id';
        }
      );

      // Run multiple times to have a chance of catching both cases
      for (let i = 0; i < 10; i++) {
        await handleOrderCreated({ order_id: orderId });
      }

      expect(results.length).toBe(10);
      expect(results.some(r => r === 'payment.confirmed')).toBe(true);
      expect(results.some(r => r === 'payment.failed')).toBe(true);

      publishToOutboxSpy.mockRestore();
    });

    it('should not publish event when order_id is invalid', async () => {
      const publishToOutboxSpy = jest.spyOn(producerModule, 'publishToOutbox').mockImplementation(
        async (...args: unknown[]) => 'mock-outbox-id'
      );

      await handleOrderCreated({ order_id: '' });
      await handleOrderCreated({ order_id: '   ' });
      await handleOrderCreated({ order_id: null as any });

      expect(publishToOutboxSpy).not.toHaveBeenCalled();
      publishToOutboxSpy.mockRestore();
    });
  });

  describe('handlePaymentConfirmed', () => {
    it('should update order status to CONFIRMED and decrease stock when payment is confirmed', async () => {
      const orderId = 100;
      await handlePaymentConfirmed({ order_id: orderId.toString() });

      const { rows: statusRows } = await db.query(
        `SELECT status FROM orders WHERE id = $1`,
        [orderId]
      );
      expect(statusRows[0].status).toBe('CONFIRMED');


      const { rows: productAfter } = await db.query(
        `SELECT stock FROM products WHERE id = '10'`
      );
      const stockAfter = Number(productAfter[0].stock);
      expect(stockAfter).toBe(9);
    });

    it('should cancel order when stock is insufficient', async () => {
      const orderId = 100;
      await db.query(
        `INSERT INTO order_items (order_id, product_id, quantity, amount, created_at, updated_at)
         VALUES ($1, '11', 1000, 5000.00, NOW(), NOW())`,
        [orderId]
      );

      await handlePaymentConfirmed({ order_id: orderId.toString() });
      const { rows: orderRowsAfter } = await db.query(
        `SELECT status FROM orders WHERE id = $1`,
        [orderId]
      );
      expect(orderRowsAfter[0].status).toBe('CANCELLED');
    });

    it('should not process when order_id is invalid', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await handlePaymentConfirmed({ order_id: '' });
      await handlePaymentConfirmed({ order_id: '   ' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('handlePaymentFailed', () => {
    it('should update order status to PAYMENT_FAILED when payment fails', async () => {
      const orderId = '100';
      await handlePaymentFailed({ order_id: orderId });

      const { rows: orderRows } = await db.query(
        `SELECT status FROM orders WHERE id = $1`,
        [orderId]
      );
      expect(orderRows[0].status).toBe('PAYMENT_FAILED');
    });

    it('should not update order that is not in PENDING_PAYMENT status', async () => {
      const orderId = '101';
      const originalStatus = 'CONFIRMED';

      await handlePaymentFailed({ order_id: orderId });

      const { rows: orderRows } = await db.query(
        `SELECT status FROM orders WHERE id = $1`,
        [orderId]
      );
      expect(orderRows[0].status).toBe(originalStatus);
    });

    it('should handle non-existent order gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await handlePaymentFailed({ order_id: '999999' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Order 999999 not found')
      );
      consoleSpy.mockRestore();
    });

    it('should not process when order_id is invalid', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await handlePaymentFailed({ order_id: '' });
      await handlePaymentFailed({ order_id: '   ' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

