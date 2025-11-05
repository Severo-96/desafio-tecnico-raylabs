import { api, bootTestDb, closeDb, loginAs } from './test-helpers.js';
import { UserRole } from '../core/users.repo.js';

describe('Products API', () => {
  let adminCookie: string;
  let clientCookie: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await bootTestDb();
  });

  beforeEach(async () => {
    await bootTestDb();
    adminCookie = await loginAs(UserRole.ADMIN);
    clientCookie = await loginAs(UserRole.CLIENT);
  });

  afterAll(async () => {
    await closeDb();
  });

  describe('POST /products', () => {
    it('Reject product creation for client (requires admin)', async () => {
      const res = await api
        .post('/api/products')
        .set('Cookie', clientCookie)
        .send({
          name: 'Product 1',
          amount: 1.99,
          stock: 1,
        })
        .expect(403);

      expect(res.body.error).toMatch(/Admin access required/i);
    });

    it('create product with valid params', async () => {
      const res = await api
        .post('/api/products')
        .set('Cookie', adminCookie)
        .send({
          name: 'Product 1',
          amount: 1.99,
          stock: 1,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Product 1',
        amount: '1.99',
        stock: 1,
      });
      expect(res.body.id).toBeTruthy();
    });

    it('create product with normalized name', async () => {
      const res = await api
        .post('/api/products')
        .set('Cookie', adminCookie)
        .send({
          name: '      Amazing      SUPER        Product        ',
          amount: 3.99,
          stock: 100,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Amazing SUPER Product',
        amount: '3.99',
        stock: 100,
      });
    });

    it('Reject invalid amount (negative number)', async () => {
      const res = await api
        .post('/api/products')
        .set('Cookie', adminCookie)
        .send({
          name: 'Product 1',
          amount: -1.97,
          stock: 1,
        })
        expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('Reject invalid amount (empty param)', async () => {
      const res = await api
        .post('/api/products')
        .set('Cookie', adminCookie)
        .send({
          name: 'Product 1',
          amount: '',
          stock: 1,
        })
        expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('Reject invalid stock (negative number)', async () => {
      const res = await api
        .post('/api/products')
        .set('Cookie', adminCookie)
        .send({
          name: 'Product 1',
          amount: 1,
          stock: -1,
        })
        expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('Reject invalid stock (not integer)', async () => {
      const res = await api
        .post('/api/products')
        .set('Cookie', adminCookie)
        .send({
          name: 'Product 1',
          amount: 1,
          stock: 1.12,
        })
        expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('Reject invalid stock (empty param)', async () => {
      const res = await api
        .post('/api/products')
        .set('Cookie', adminCookie)
        .send({
          name: 'Product 1',
          amount: 1,
          stock: '',
        })
        expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('Reject duplicated product names', async () => {
      await api.post('/api/products').set('Cookie', adminCookie).send({
        name: 'Product 1',
        amount: 1,
        stock: 1,
      }).expect(201);

      const res = await api.post('/api/products').set('Cookie', adminCookie).send({
        name: 'Product 1',
        amount: 2,
        stock: 2,
      }).expect(409);

      expect(res.body.error).toMatch(/Product already registered/i);
    });
  });

  describe('GET /products', () => {
    it('Return products list for admin', async () => {
      const res = await api.get('/api/products').set('Cookie', adminCookie).expect(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(4);
    });

    it('Return products list for client', async () => {
      const res = await api.get('/api/products').set('Cookie', clientCookie).expect(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(4);
    });
  });
  
  describe('GET /products/:id', () => {
    it('Return product data by id for admin', async () => {
      const res = await api.get(`/api/products/10`).set('Cookie', adminCookie).expect(200);
      expect(res.body).toMatchObject({
        name: 'Product One',
        amount: '100.00',
        stock: 10,
      });
    });

    it('Return product data by id for client', async () => {
      const res = await api.get(`/api/products/10`).set('Cookie', clientCookie).expect(200);
      expect(res.body).toMatchObject({
        name: 'Product One',
        amount: '100.00',
        stock: 10,
      });
    });

    it('Return 404 if product do not exist', async () => {
      const got = await api.get(`/api/products/9999999`).set('Cookie', adminCookie).expect(404);
      expect(got.body.error).toMatch(/Product not found/i);
    });
  });

  describe('PATCH /products/:id', () => {
    it('update product with new valid info', async () => {
      const res = await api.patch(`/api/products/11`).set('Cookie', adminCookie).send({
        name: 'Product Two Updated',
        amount: 75.5,
        stock: 100,
      }).expect(200);

      expect(res.body).toMatchObject({
        id: '11',
        name: 'Product Two Updated',
        amount: '75.50',
        stock: 100,
      });
    });


    it('Update product with normalized name', async () => {
      const res = await api.patch(`/api/products/12`).set('Cookie', adminCookie).send({
        name: '      Amazing      SUPER        Product        ',
        amount: 3.99,
        stock: 100,
      }).expect(200);

      expect(res.body).toMatchObject({
        name: 'Amazing SUPER Product',
        amount: '3.99',
        stock: 100,
      });
    });

    it('Reject invalid amount (negative number)', async () => {
      const res = await api.patch(`/api/products/10`).set('Cookie', adminCookie).send({
        name: 'Product 1',
        amount: -1.97,
        stock: 1,
      }).expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('Reject invalid amount (empty param)', async () => {
      const res = await api.patch(`/api/products/11`).set('Cookie', adminCookie).send({
        name: 'Product 1',
        amount: '',
        stock: 1,
      }).expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('Reject invalid stock (negative number)', async () => {
      const res = await api.patch(`/api/products/12`).set('Cookie', adminCookie).send({
        name: 'Product 1',
        amount: 1,
        stock: -1,
      }).expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('Reject invalid stock (not integer)', async () => {
      const res = await api.patch(`/api/products/13`).set('Cookie', adminCookie).send({
        name: 'Product 1',
        amount: 1,
        stock: 1.12,
      }).expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('Reject invalid stock (empty param)', async () => {
      const res = await api.patch(`/api/products/10`).set('Cookie', adminCookie).send({
        name: 'Product 1',
        amount: 1,
        stock: '',
      }).expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('Reject duplicated product names', async () => {
      const res = await api.patch(`/api/products/11`).set('Cookie', adminCookie).send({
        name: 'Product One',
        amount: 2,
        stock: 2,
      }).expect(409);

      expect(res.body.error).toMatch(/Product already registered/i);
    });
  });

  describe('DELETE /products/:id', () => {
    it('delete product from database', async () => {
      const res = await api.delete(`/api/products/13`).set('Cookie', adminCookie).expect(204);
    });

    it('Return 404 if product do no exist', async () => {
      const got = await api.delete(`/api/products/9999999`).set('Cookie', adminCookie).expect(404);
      expect(got.body.error).toMatch(/Product not found/i);
    });
  });
});
