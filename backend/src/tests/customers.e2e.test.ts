import { api, bootTestDb, closeDb, loginAs } from './test-helpers.js';
import { UserRole } from '../core/users.repo.js';

describe('Customers API', () => {
  let authCookie: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await bootTestDb();
  });

  beforeEach(async () => {
    await bootTestDb();
    authCookie = await loginAs(UserRole.ADMIN);
  });

  afterAll(async () => {
    await closeDb();
  });

  describe('POST /customers', () => {
    it('create customer with valid CPF', async () => {
      const res = await api
        .post('/api/customers')
        .set('Cookie', authCookie)
        .send({
          name: 'Maria da Silva',
          email: 'maria@example.com',
          document_number: '390.533.447-85',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Maria da Silva',
        email: 'maria@example.com',
        document_number: '39053344785',
      });
      expect(res.body.id).toBeTruthy();
    });

    it('create customer with valid CNPJ', async () => {
      const res = await api
        .post('/api/customers')
        .set('Cookie', authCookie)
        .send({
          name: 'Empresa X',
          email: 'contato@empresax.com',
          document_number: '45.723.174/0001-10',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Empresa X',
        email: 'contato@empresax.com',
        document_number: '45723174000110',
      });
      expect(res.body.id).toBeTruthy();
    });

    it('create customer with normalized name', async () => {
      const res = await api
        .post('/api/customers')
        .set('Cookie', authCookie)
        .send({
          name: '      José      da       Silva        ',
          email: 'jose@example.com',
          document_number: '390.533.447-04',
        })
        .expect(201);

      expect(res.body.name).toMatch('José da Silva');
    });

    it('Reject invalid name (empty)', async () => {
      const res = await api
        .post('/api/customers')
        .set('Cookie', authCookie)
        .send({
          name: '',
          email: 'email@mail.com',
          document: '390.533.447-00',
        })
        .expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('Reject invalid e-mail', async () => {
      const res = await api
        .post('/api/customers')
        .set('Cookie', authCookie)
        .send({
          name: 'Fulano',
          email: 'invalido',
          document: '390.533.447-05',
        })
        .expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('Reject invalid document number', async () => {
      const res = await api
        .post('/api/customers')
        .set('Cookie', authCookie)
        .send({
          name: 'Fulano',
          email: 'fulano@example.com',
          document: '123.456.789'
        })
        .expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('Reject duplicated e-mail', async () => {
      const dup = await api.post('/api/customers').set('Cookie', authCookie).send({
        name: 'Another Person Name',
        email: 'customer2@example.com',
        document_number: '123.456.789-10',
      });

      expect(dup.status).toBe(409);
      expect(dup.body.error).toMatch(/Email already registered/i);
    });

    it('Reject duplicated document numbers', async () => {
      const dup = await api.post('/api/customers').set('Cookie', authCookie).send({
        name: 'Another Person Name',
        email: 'another-mail@mail.com',
        document_number: '123.456.789-01',
      });

      expect(dup.status).toBe(409);
      expect(dup.body.error).toMatch(/Document number already registered/i);
    });
  });

  describe('GET /customers', () => {
    it('Return customers list', async () => {
      const res = await api.get('/api/customers').set('Cookie', authCookie).expect(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(3);
    });
  });
  
  describe('GET /customers/:id', () => {
    it('Return customer data by id', async () => {
      const res = await api.get(`/api/customers/1`).set('Cookie', authCookie).expect(200);
      expect(res.body.name).toBe('Test Customer');
      expect(res.body.email).toBe('test@example.com');
      expect(res.body.document_number).toBe('39053344705');
    });

    it('Return 404 if customer do not exist', async () => {
      const got = await api.get(`/api/customers/9999999`).set('Cookie', authCookie).expect(404);
      expect(got.body.error).toMatch(/Customer not found/i);
    });
  });

  describe('PATCH /customers/:id', () => {
    it('update customer with new valid info', async () => {  
      const res = await api.patch(`/api/customers/2`).set('Cookie', authCookie).send({
        name: 'Customer Two Updated',
        email: 'customer2updated@example.com',
        document_number: '12345678999',
      }).expect(200);

      expect(res.body).toMatchObject({
        id: '2',
        name: 'Customer Two Updated',
        email: 'customer2updated@example.com',
        document_number: '12345678999',
      });
    });

    it('Reject invalid name (empty)', async () => {
      const res = await api.patch(`/api/customers/3`).set('Cookie', authCookie).send({
        name: '',
        email: 'email@mail.com',
        document_number: '390.533.447-00',
      }).expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('Reject invalid e-mail', async () => {
      const res = await api.patch(`/api/customers/1`).set('Cookie', authCookie).send({
        name: 'Fulano',
        email: 'invalido',
        document_number: '390.533.447-05',
      }).expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('Reject invalid document number', async () => {
      const res = await api.patch(`/api/customers/2`).set('Cookie', authCookie).send({
        name: 'Fulano',
        email: 'fulano@example.com',
        document_number: '123.456.789'
      }).expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('Reject duplicated e-mail', async () => {
      const res = await api.patch(`/api/customers/1`).set('Cookie', authCookie).send({
        name: 'Another Person Name',
        email: 'customer2@example.com',
        document_number: '123.456.789-10',
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/Email already registered/i);
    });

    it('Reject duplicated document numbers', async () => {
      const res = await api.patch(`/api/customers/2`).set('Cookie', authCookie).send({
        name: 'Another Person Name',
        email: 'another-mail@mail.com',
        document_number: '390.533.447-05',
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/Document number already registered/i);
    });

    it('Return 404 if customer do not exist', async () => {
      const got = await api.patch(`/api/customers/9999999`).set('Cookie', authCookie).send({
        name: 'Another Person Name',
        email: 'another-mail@mail.com',
        document_number: '123.456.789-10',
      }).expect(404);

      expect(got.body.error).toMatch(/Customer not found/i);
    });
  });

  describe('DELETE /customers/:id', () => {
    it('delete customer from database', async () => {
      const res = await api.delete(`/api/customers/3`).set('Cookie', authCookie).expect(204);
    });

    it('Return 404 if customer do not exist', async () => {
      const got = await api.delete(`/api/customers/9999999`).set('Cookie', authCookie).expect(404);
      expect(got.body.error).toMatch(/Customer not found/i);
    });
  });
});
