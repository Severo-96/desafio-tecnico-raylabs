import { api, bootTestDb, closeDb } from './test-helpers.js';
import { UserRole } from '../core/users.repo.js';

describe('Authentication API', () => {
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

  describe('POST /auth/sign-in', () => {
    it('should create user with valid data', async () => {
      const res = await api
        .post('/api/auth/sign-in')
        .send({
          email: 'newuser@example.com',
          nickname: 'newuser',
          password: 'password123',
          name: 'New User',
          document_number: '12345678900',
        })
        .expect(201);

      expect(res.body.user).toMatchObject({
        nickname: 'newuser',
        role: UserRole.CLIENT,
      });
      expect(res.body.user.id).toBeTruthy();
      expect(res.body.user.customer_id).toBeTruthy();

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const tokenCookie = Array.isArray(cookies) 
        ? cookies.find((c: string) => c.startsWith('token='))
        : cookies?.toString().includes('token=');
      expect(tokenCookie).toBeTruthy();
    });

    it('should reject sign-in with invalid email', async () => {
      const res = await api
        .post('/api/auth/sign-in')
        .send({
          email: 'invalid-email',
          nickname: 'testuser',
          password: 'password123',
          name: 'Test User',
          document_number: '12345678900',
        })
        .expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('should reject sign-in with invalid document number', async () => {
      const res = await api
        .post('/api/auth/sign-in')
        .send({
          email: 'test@example.com',
          nickname: 'testuser',
          password: 'password123',
          name: 'Test User',
          document_number: '123',
        })
        .expect(400);

      expect(res.body.error).toMatch(/Invalid parameters/i);
    });

    it('should reject sign-in with short password', async () => {
      const res = await api
        .post('/api/auth/sign-in')
        .send({
          email: 'test@example.com',
          nickname: 'testuser',
          password: '12345',
          name: 'Test User',
          document_number: '12345678900',
        })
        .expect(400);

      expect(res.body.error).toMatch(/Password must be at least 6 characters/i);
    });

    it('should reject sign-in with short nickname', async () => {
      const res = await api
        .post('/api/auth/sign-in')
        .send({
          email: 'test@example.com',
          nickname: 'ab',
          password: 'password123',
          name: 'Test User',
          document_number: '12345678900',
        })
        .expect(400);

      expect(res.body.error).toMatch(/Nickname must be at least 3 characters/i);
    });

    it('should reject sign-in with missing required fields', async () => {
      const res = await api
        .post('/api/auth/sign-in')
        .send({
          email: 'test@example.com',
          nickname: 'testuser',
          // missing password, name, document_number
        })
        .expect(400);

      expect(res.body.error).toBeDefined();
    });

    it('should reject sign-in with duplicate nickname', async () => {
      // First create a user
      await api
        .post('/api/auth/sign-in')
        .send({
          email: 'first@example.com',
          nickname: 'duplicatenick',
          password: 'password123',
          name: 'First User',
          document_number: '11111111111',
        })
        .expect(201);

      // Try to create another with the same nickname
      const res = await api
        .post('/api/auth/sign-in')
        .send({
          email: 'second@example.com',
          nickname: 'duplicatenick',
          password: 'password123',
          name: 'Second User',
          document_number: '22222222222',
        })
        .expect(409);

      expect(res.body.error).toMatch(/Nickname already registered/i);
    });

    it('should reject sign-in with duplicate email', async () => {
      const res = await api
        .post('/api/auth/sign-in')
        .send({
          email: 'test@example.com',
          nickname: 'seconduser',
          password: 'password123',
          name: 'Second User',
          document_number: '22222222222',
        })
        .expect(409);

      expect(res.body.error).toMatch(/Email already registered/i);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await api
        .post('/api/auth/login')
        .send({
          nickname: 'testcustomer',
          password: 'password123',
        })
        .expect(200);

      expect(res.body.user).toMatchObject({
        nickname: 'testcustomer',
        role: UserRole.ADMIN,
      });
      expect(res.body.user.id).toBeTruthy();
      expect(res.body.user.customer_id).toBeTruthy();

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const tokenCookie = Array.isArray(cookies) 
        ? cookies.find((c: string) => c.startsWith('token='))
        : cookies?.toString().includes('token=');
      expect(tokenCookie).toBeTruthy();
    });

    it('should login with client user credentials', async () => {
      const res = await api
        .post('/api/auth/login')
        .send({
          nickname: 'customertwo',
          password: 'password123',
        })
        .expect(200);

      expect(res.body.user).toMatchObject({
        nickname: 'customertwo',
        role: UserRole.CLIENT,
      });
    });

    it('should reject login with invalid nickname', async () => {
      const res = await api
        .post('/api/auth/login')
        .send({
          nickname: 'nonexistent',
          password: 'password123',
        })
        .expect(401);

      expect(res.body.error).toMatch(/Invalid nickname or password/i);
    });

    it('should reject login with invalid password', async () => {
      const res = await api
        .post('/api/auth/login')
        .send({
          nickname: 'testcustomer',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(res.body.error).toMatch(/Invalid nickname or password/i);
    });

    it('should reject login with missing nickname', async () => {
      const res = await api
        .post('/api/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);

      expect(res.body.error).toMatch(/Nickname and password are required/i);
    });

    it('should reject login with missing password', async () => {
      const res = await api
        .post('/api/auth/login')
        .send({
          nickname: 'testcustomer',
        })
        .expect(400);

      expect(res.body.error).toMatch(/Nickname and password are required/i);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      // Login to set cookie
      const loginRes = await api
        .post('/api/auth/login')
        .send({
          nickname: 'testcustomer',
          password: 'password123',
        })
        .expect(200);

      const cookies = loginRes.headers['set-cookie'];
      const tokenCookie = Array.isArray(cookies) 
        ? cookies.find((c: string) => c.startsWith('token='))
        : cookies;

      // Logout
      const res = await api
        .post('/api/auth/logout')
        .set('Cookie', tokenCookie)
        .expect(200);

      expect(res.body.message).toMatch(/Logged out successfully/i);

      const logoutCookies = res.headers['set-cookie'];
      expect(logoutCookies).toBeDefined();
      expect(logoutCookies?.toString()).toContain('token=;');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await api
        .post('/api/auth/logout')
        .expect(401);

      expect(res.body.error).toMatch(/Authentication required/i);
    });
  });
});

