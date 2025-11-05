import { api, bootTestDb, closeDb, loginAs } from './test-helpers.js';
import { UserRole } from '../core/users.repo.js';

describe('Orders API', () => {
  let clientCookie: string;
  let adminCookie: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await bootTestDb();
  });

  beforeEach(async () => {
    await bootTestDb();
    clientCookie = await loginAs(UserRole.CLIENT);
    adminCookie = await loginAs(UserRole.ADMIN);
  });

  afterAll(async () => {
    await closeDb();
  });

  describe('POST /orders', () => {
    it('should create order with valid items', async () => {
      const res = await api
        .post('/api/orders')
        .set('Cookie', adminCookie)
        .send({
          customer_id: '1',
          items: [
            { product_id: '10', quantity: 2 },
            { product_id: '11', quantity: 1 },
          ],
        })
        .expect(201);

      expect(res.body).toMatchObject({
        customer_id: '1',
        status: 'PENDING_PAYMENT',
      });
      expect(res.body.id).toBeTruthy();
      expect(res.body.amount).toBe('250.00');
      expect(res.body.items).toHaveLength(2);
      
      expect(res.body.items[0]).toMatchObject({
        product_id: '10',
        quantity: 2,
        amount: '200.00',
      });
      expect(res.body.items[1]).toMatchObject({
        product_id: '11',
        quantity: 1,
        amount: '50.00',
      });
    });

    it('should create order with single item', async () => {
      const res = await api
        .post('/api/orders')
        .set('Cookie', adminCookie)
        .send({
          customer_id: '1',
          items: [
            { product_id: '10', quantity: 1 },
          ],
        })
        .expect(201);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.amount).toBe('100.00');
    });

    it('should reject order with invalid customer_id', async () => {
      const res = await api
        .post('/api/orders')
        .set('Cookie', adminCookie)
        .send({
          customer_id: '999999',
          items: [
            { product_id: '10', quantity: 1 },
          ],
        })
        .expect(404);

      expect(res.body.error).toMatch(/Customer not found/i);
    });

    it('should reject order with invalid product_id', async () => {
      const res = await api
        .post('/api/orders')
        .set('Cookie', adminCookie)
        .send({
          customer_id: '1',
          items: [
            { product_id: '999999', quantity: 1 },
          ],
        })
        .expect(404);

      expect(res.body.error).toMatch(/Product not found/i);
    });

    it('should reject order with insufficient stock', async () => {
      const res = await api
        .post('/api/orders')
        .set('Cookie', adminCookie)
        .send({
          customer_id: '1',
          items: [
            { product_id: '10', quantity: 9999 },
          ],
        })
        .expect(400);

      expect(res.body.error).toMatch(/out of stock/i);
    });

    it('should reject order with invalid quantity (zero)', async () => {
      const res = await api
        .post('/api/orders')
        .set('Cookie', adminCookie)
        .send({
          customer_id: '1',
          items: [
            { product_id: '10', quantity: 0 },
          ],
        })
        .expect(400);

      expect(res.body.error).toMatch(/Invalid quantity/i);
    });

    it('should reject order with invalid quantity (negative)', async () => {
      const res = await api
        .post('/api/orders')
        .set('Cookie', adminCookie)
        .send({
          customer_id: '1',
          items: [
            { product_id: '10', quantity: -1 },
          ],
        })
        .expect(400);

      expect(res.body.error).toMatch(/Invalid quantity/i);
    });

    it('should reject order with invalid quantity (non-integer)', async () => {
      const res = await api
        .post('/api/orders')
        .set('Cookie', adminCookie)
        .send({
          customer_id: '1',
          items: [
            { product_id: '10', quantity: 1.5 },
          ],
        })
        .expect(400);

      expect(res.body.error).toMatch(/Invalid quantity/i);
    });

    it('should reject order with missing items', async () => {
      const res = await api
        .post('/api/orders')
        .set('Cookie', adminCookie)
        .send({
          customer_id: '1',
          items: [],
        })
        .expect(400);

      expect(res.body.error).toMatch(/Invalid Parameters/i);
    });

    it('should reject order with missing customer_id', async () => {
      const res = await api
        .post('/api/orders')
        .set('Cookie', adminCookie)
        .send({
          items: [
            { product_id: '10', quantity: 1 },
          ],
        })
        .expect(400);

      expect(res.body.error).toMatch(/Invalid Parameters/i);
    });

    it('should reject order with duplicate products', async () => {
      const res = await api
        .post('/api/orders')
        .set('Cookie', adminCookie)
        .send({
          customer_id: '1',
          items: [
            { product_id: '10', quantity: 1 },
            { product_id: '10', quantity: 2 }, // duplicate
          ],
        })
        .expect(409);

      expect(res.body.error).toMatch(/Product already exists in this order/i);
    });

    it('should correctly calculate order amount for multiple items', async () => {
      const res = await api
        .post('/api/orders')
        .set('Cookie', adminCookie)
        .send({
          customer_id: '1',
          items: [
            { product_id: '10', quantity: 3 }, // 100 * 3 = 300
            { product_id: '11', quantity: 2 }, // 50 * 2 = 100
          ],
        })
        .expect(201);

      expect(res.body.amount).toBe('400.00');
    });
  });

  describe('GET /orders/:id', () => {
    it('should get order by id with items', async () => {
      const res = await api.get(`/api/orders/100`).set('Cookie', adminCookie).expect(200);
      expect(res.body).toMatchObject({
        id: '100',
        customer_id: '1',
        status: 'PENDING_PAYMENT',
      });
    });

    it('should get confirmed order with multiple items', async () => {
      const res = await api
        .get(`/api/orders/101`)
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.status).toBe('CONFIRMED');
      expect(res.body.items).toHaveLength(2);
    });

    it('should return 404 for non-existent order', async () => {
      const res = await api
        .get('/api/orders/999999')
        .set('Cookie', adminCookie)
        .expect(404);

      expect(res.body.error).toMatch(/Order not found/i);
    });
  });

  describe('GET /orders', () => {
    it('should list all orders with pagination', async () => {
      const res = await api
        .get('/api/orders')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toMatchObject({
        limit: expect.any(Number),
        offset: expect.any(Number),
        total: expect.any(Number),
      });

      expect(res.body.pagination.total).toBeGreaterThanOrEqual(5);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    });

    it('should respect limit parameter', async () => {
      const res = await api
        .get('/api/orders?limit=2')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.pagination.limit).toBe(2);
    });

    it('should respect offset parameter', async () => {
      const res1 = await api.get('/api/orders?limit=1&offset=0').set('Cookie', adminCookie).expect(200);
      const res2 = await api.get('/api/orders?limit=1&offset=1').set('Cookie', adminCookie).expect(200);

      expect(res1.body.data[0].id).not.toBe(res2.body.data[0].id);
    });
  });

  describe('GET /orders/customers/:id', () => {
    it('should list orders for a specific customer', async () => {
      const res = await api
        .get(`/api/orders/customers/1`)
        .set('Cookie', clientCookie)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');

      expect(res.body.pagination.total).toBeGreaterThanOrEqual(3);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      expect(res.body.data.every((order: any) => order.customer_id === '1')).toBe(true);
    });

    it('should list orders for customer 2', async () => {
      const res = await api
        .get(`/api/orders/customers/2`)
        .set('Cookie', clientCookie)
        .expect(200);

      expect(res.body.pagination.total).toBeGreaterThanOrEqual(2);
      expect(res.body.data.every((order: any) => order.customer_id === '2')).toBe(true);
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await api
        .get('/api/orders/customers/999999')
        .set('Cookie', clientCookie)
        .expect(404);

      expect(res.body.error).toMatch(/Customer not found/i);
    });

    it('should return empty array for customer with no orders', async () => {
      const res = await api
        .get(`/api/orders/customers/3`)
        .set('Cookie', clientCookie)
        .expect(200);

      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });
  });
});
