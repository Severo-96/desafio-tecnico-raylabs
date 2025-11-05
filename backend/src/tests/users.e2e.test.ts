import { api, bootTestDb, closeDb, loginAs } from './test-helpers.js';
import { UserRole } from '../core/users.repo.js';

describe('Users API', () => {
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

  describe('GET /users/me', () => {
    it('should return authenticated user data', async () => {
      const res = await api
        .get('/api/users/me')
        .set('Cookie', clientCookie)
        .expect(200);

      expect(res.body.user).toMatchObject({
        nickname: 'customertwo',
        role: UserRole.CLIENT,
        name: 'Customer Two',
        email: 'customer2@example.com',
        document_number: '12345678901',
      });
    });

    it('should return admin user data', async () => {
      const res = await api
        .get('/api/users/me')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.user).toMatchObject({
        nickname: 'testcustomer',
        role: UserRole.ADMIN,
        name: 'Test Customer',
        email: 'test@example.com',
        document_number: '39053344705',
      });
    });

    it('should return 401 if not authenticated', async () => {
      const res = await api
        .get('/api/users/me')
        .expect(401);

      expect(res.body.error).toMatch(/Authentication required/i);
    });
  });

  describe('PATCH /users/me', () => {
    it('should update user data with password', async () => {
      const res = await api
        .patch('/api/users/me')
        .set('Cookie', clientCookie)
        .send({
          name: 'Customer Two Updated',
          email: 'customer2updated@example.com',
          document_number: '12345678999',
          password: 'newpassword123',
        })
        .expect(200);

      expect(res.body.user).toMatchObject({
        nickname: 'customertwo',
        role: UserRole.CLIENT,
        name: 'Customer Two Updated',
        email: 'customer2updated@example.com',
        document_number: '12345678999',
      });
    });

    it('should update user data without password', async () => {
      const res = await api
        .patch('/api/users/me')
        .set('Cookie', clientCookie)
        .send({
          name: 'Customer Two Updated Again',
          email: 'customer2again@example.com',
          document_number: '12345678988',
        })
        .expect(200);

      expect(res.body.user).toMatchObject({
        nickname: 'customertwo',
        role: UserRole.CLIENT,
        name: 'Customer Two Updated Again',
        email: 'customer2again@example.com',
        document_number: '12345678988',
      });
    });

    it('should reject update with invalid email', async () => {
      const res = await api
        .patch('/api/users/me')
        .set('Cookie', clientCookie)
        .send({
          name: 'Test',
          email: 'invalid-email',
          document_number: '12345678900',
        })
        .expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('should reject update with invalid document number', async () => {
      const res = await api
        .patch('/api/users/me')
        .set('Cookie', clientCookie)
        .send({
          name: 'Test',
          email: 'test@example.com',
          document_number: '123',
        })
        .expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('should reject update with short password', async () => {
      const res = await api
        .patch('/api/users/me')
        .set('Cookie', clientCookie)
        .send({
          name: 'Test',
          email: 'test@example.com',
          document_number: '12345678900',
          password: '12345',
        })
        .expect(400);

      expect(res.body.error).toMatch(/Password must be at least 6 characters/i);
    });

    it('should reject update with duplicate email', async () => {
      const res = await api
        .patch('/api/users/me')
        .set('Cookie', clientCookie)
        .send({
          name: 'Test',
          email: 'test@example.com',
          document_number: '12345678900',
        })
        .expect(409);

      expect(res.body.error).toMatch(/Email already registered/i);
    });

    it('should reject update with duplicate document number', async () => {
      const res = await api
        .patch('/api/users/me')
        .set('Cookie', clientCookie)
        .send({
          name: 'Test',
          email: 'newemail@example.com',
          document_number: '39053344705',
        })
        .expect(409);

      expect(res.body.error).toMatch(/Document number already registered/i);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await api
        .patch('/api/users/me')
        .send({
          name: 'Test',
          email: 'test@example.com',
          document_number: '12345678900',
        })
        .expect(401);

      expect(res.body.error).toMatch(/Authentication required/i);
    });
  });

  describe('DELETE /users/me', () => {
    it('should delete authenticated user', async () => {
      const signInRes = await api
        .post('/api/auth/sign-in')
        .send({
          email: 'todelete@example.com',
          nickname: 'todelete',
          password: 'password123',
          name: 'To Delete',
          document_number: '99999999999',
        })
        .expect(201);

      const cookies = signInRes.headers['set-cookie'];
      const tokenCookie = Array.isArray(cookies) 
        ? cookies.find((c: string) => c.startsWith('token='))
        : cookies;

      await api
        .delete('/api/users/me')
        .set('Cookie', tokenCookie)
        .expect(204);

      const loginRes = await api
        .post('/api/auth/login')
        .send({
          nickname: 'todelete',
          password: 'password123',
        })
        .expect(401);
      expect(loginRes.body.error).toMatch(/Invalid nickname or password/i);
    });

    it('should not delete customer when user is deleted', async () => {
      const signInRes = await api
        .post('/api/auth/sign-in')
        .send({
          email: 'customercheck@example.com',
          nickname: 'customercheck',
          password: 'password123',
          name: 'Customer Check',
          document_number: '88888888888',
        })
        .expect(201);

      const cookies = signInRes.headers['set-cookie'];
      const tokenCookie = Array.isArray(cookies) 
        ? cookies.find((c: string) => c.startsWith('token='))
        : cookies;

      const userRes = await api
        .get('/api/users/me')
        .set('Cookie', tokenCookie)
        .expect(200);

      const customerId = userRes.body.user.customer_id;

      await api
        .delete('/api/users/me')
        .set('Cookie', tokenCookie)
        .expect(204);

      const customerRes = await api
        .get(`/api/customers/${customerId}`)
        .set('Cookie', adminCookie)
        .expect(200);

      expect(customerRes.body).toMatchObject({
        id: customerId,
        email: 'customercheck@example.com',
        name: 'Customer Check',
      });
      
      expect(customerRes.body.user_id).toBeNull();
    });

    it('should return 401 if not authenticated', async () => {
      const res = await api
        .delete('/api/users/me')
        .expect(401);

      expect(res.body.error).toMatch(/Authentication required/i);
    });
  });

  describe('PATCH /users/role', () => {
    it('should update user role as admin', async () => {
      const res = await api
        .patch('/api/users/role')
        .set('Cookie', adminCookie)
        .send({
          customer_id: '2',
          role: UserRole.ADMIN,
        })
        .expect(200);

      expect(res.body.user).toMatchObject({
        nickname: 'customertwo',
        role: UserRole.ADMIN,
        customer_id: '2',
      });
    });

    it('should update user role from admin to client', async () => {
      await api
        .patch('/api/users/role')
        .set('Cookie', adminCookie)
        .send({
          customer_id: '2',
          role: UserRole.ADMIN,
        })
        .expect(200);

      const res = await api
        .patch('/api/users/role')
        .set('Cookie', adminCookie)
        .send({
          customer_id: '2',
          role: UserRole.CLIENT,
        })
        .expect(200);

      expect(res.body.user).toMatchObject({
        role: UserRole.CLIENT,
      });
    });

    it('should reject update with invalid role', async () => {
      const res = await api
        .patch('/api/users/role')
        .set('Cookie', adminCookie)
        .send({
          customer_id: '2',
          role: 'invalid_role',
        })
        .expect(400);

      expect(res.body.error).toMatch(/Invalid role/i);
    });

    it('should reject update with missing customer_id', async () => {
      const res = await api
        .patch('/api/users/role')
        .set('Cookie', adminCookie)
        .send({
          role: UserRole.ADMIN,
        })
        .expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('should reject update with missing role', async () => {
      const res = await api
        .patch('/api/users/role')
        .set('Cookie', adminCookie)
        .send({
          customer_id: '2',
        })
        .expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('should reject update with non-existent customer_id', async () => {
      const res = await api
        .patch('/api/users/role')
        .set('Cookie', adminCookie)
        .send({
          customer_id: '999999',
          role: UserRole.ADMIN,
        })
        .expect(404);

      expect(res.body.error).toMatch(/User not found for this customer/i);
    });

    it('should return 403 if not admin', async () => {
      const res = await api
        .patch('/api/users/role')
        .set('Cookie', clientCookie)
        .send({
          customer_id: '2',
          role: UserRole.ADMIN,
        })
        .expect(403);

      expect(res.body.error).toMatch(/Admin access required/i);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await api
        .patch('/api/users/role')
        .send({
          customer_id: '2',
          role: UserRole.ADMIN,
        })
        .expect(401);

      expect(res.body.error).toMatch(/Authentication required/i);
    });
  });
});

