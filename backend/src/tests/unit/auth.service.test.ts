import jwt from 'jsonwebtoken';
import { generateToken, verifyToken, type TokenPayload } from '../../core/auth.service.js';
import { UserRole } from '../../core/users.repo.js';
import type { User } from '../../core/users.repo.js';

const originalEnv = process.env;

describe('Auth Service - Unit Tests', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long-for-security';
    process.env.JWT_EXPIRES_IN = '1d';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    nickname: 'testuser',
    password_hash: 'hashed_password',
    role: UserRole.CLIENT,
    customer_id: '1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  describe('generateToken', () => {
    it('should generate a valid token', () => {
      const token = generateToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include all user data in token payload', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.decode(token) as TokenPayload;

      expect(decoded).toMatchObject({
        user_id: mockUser.id,
        customer_id: mockUser.customer_id,
        role: mockUser.role,
        nickname: mockUser.nickname,
      });
    });

    it('should generate token with admin role', () => {
      const adminUser: User = { ...mockUser, role: UserRole.ADMIN };
      const token = generateToken(adminUser);
      const decoded = jwt.decode(token) as TokenPayload;

      expect(decoded.role).toBe(UserRole.ADMIN);
    });

    it('should generate token with client role', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.decode(token) as TokenPayload;

      expect(decoded.role).toBe(UserRole.CLIENT);
    });

    it('should respect JWT_EXPIRES_IN from environment', () => {
      process.env.JWT_EXPIRES_IN = '2h';
      
      const token = generateToken(mockUser);
      const decoded = jwt.decode(token) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      
      const now = Math.floor(Date.now() / 1000);
      expect(decoded.exp).toBeGreaterThan(now);
    });

    it('should generate different tokens for different users', () => {
      const user1: User = { ...mockUser, id: '1', nickname: 'user1' };
      const user2: User = { ...mockUser, id: '2', nickname: 'user2' };

      const token1 = generateToken(user1);
      const token2 = generateToken(user2);

      expect(token1).not.toBe(token2);
    });

    it('should generate different tokens for same user at different times', () => {
      const token1 = generateToken(mockUser);

      return new Promise(resolve => {
        setTimeout(() => {
          const token2 = generateToken(mockUser);
          expect(token1).not.toBe(token2);
          resolve(undefined);
        }, 1000); // 1 second for confidence to ensure the token is different
      });
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(mockUser);
      const payload = verifyToken(token);

      expect(payload).toMatchObject({
        user_id: mockUser.id,
        customer_id: mockUser.customer_id,
        role: mockUser.role,
        nickname: mockUser.nickname,
      });
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        verifyToken(invalidToken);
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-valid-jwt';

      expect(() => {
        verifyToken(malformedToken);
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for token with wrong secret', () => {
      const wrongSecret = 'different-secret-key-minimum-32-characters-long';
      const token = jwt.sign(
        {
          user_id: mockUser.id,
          customer_id: mockUser.customer_id,
          role: mockUser.role,
          nickname: mockUser.nickname,
        },
        wrongSecret,
        { expiresIn: '1d' }
      );

      expect(() => {
        verifyToken(token);
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for expired token', async () => {
      const token = jwt.sign(
        {
          user_id: mockUser.id,
          customer_id: mockUser.customer_id,
          role: mockUser.role,
          nickname: mockUser.nickname,
        },
        process.env.JWT_SECRET!,
        { expiresIn: '1ms' }
      );

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(() => {
        verifyToken(token);
      }).toThrow('Invalid or expired token');
    }, 1000);

    it('should verify token with admin role', () => {
      const adminUser: User = { ...mockUser, role: UserRole.ADMIN };
      const token = generateToken(adminUser);
      const payload = verifyToken(token);

      expect(payload.role).toBe(UserRole.ADMIN);
    });

    it('should verify token with client role', () => {
      const token = generateToken(mockUser);
      const payload = verifyToken(token);

      expect(payload.role).toBe(UserRole.CLIENT);
    });

    it('should preserve all token payload fields', () => {
      const token = generateToken(mockUser);
      const payload = verifyToken(token);

      expect(payload).toHaveProperty('user_id');
      expect(payload).toHaveProperty('customer_id');
      expect(payload).toHaveProperty('role');
      expect(payload).toHaveProperty('nickname');
    });

    it('should throw error for empty token', () => {
      expect(() => {
        verifyToken('');
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for token with tampered payload', () => {
      const token = generateToken(mockUser);
      const parts = token.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.tampered`;

      expect(() => {
        verifyToken(tamperedToken);
      }).toThrow('Invalid or expired token');
    });
  });

  describe('Token Integration', () => {
    it('should generate and verify token successfully', () => {
      const token = generateToken(mockUser);
      const payload = verifyToken(token);

      expect(payload.user_id).toBe(mockUser.id);
      expect(payload.customer_id).toBe(mockUser.customer_id);
      expect(payload.role).toBe(mockUser.role);
      expect(payload.nickname).toBe(mockUser.nickname);
    });

    it('should work with different JWT_EXPIRES_IN values', () => {
      const expiresInValues = ['1h', '2h', '1d', '7d', '30m'];

      expiresInValues.forEach(expiresIn => {
        process.env.JWT_EXPIRES_IN = expiresIn;
        const token = generateToken(mockUser);
        const payload = verifyToken(token);

        expect(payload).toBeDefined();
        expect(payload.user_id).toBe(mockUser.id);
      });
    });
  });
});

