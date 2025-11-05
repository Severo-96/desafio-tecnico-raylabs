import type { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import { generateToken } from '../../core/auth.service.js';
import { UserRole } from '../../core/users.repo.js';
import type { User } from '../../core/users.repo.js';
import { HttpError } from '../../errors/HttpError.js';

// Mock auth.service
jest.mock('../../core/auth.service', () => ({
  ...jest.requireActual('../../core/auth.service'),
  verifyToken: jest.fn(),
  generateToken: jest.requireActual('../../core/auth.service').generateToken,
}));

import { verifyToken } from '../../core/auth.service.js';

describe('Middlewares - Unit Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

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

  const mockAdminUser: User = {
    ...mockUser,
    id: '2',
    role: UserRole.ADMIN,
    nickname: 'adminuser',
  };

  beforeEach(() => {
    mockReq = {
      cookies: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate middleware', () => {
    it('should authenticate request with valid token', () => {
      const token = generateToken(mockUser);
      mockReq.cookies = { token };

      (verifyToken as jest.Mock).mockReturnValue({
        user_id: mockUser.id,
        customer_id: mockUser.customer_id,
        role: mockUser.role,
        nickname: mockUser.nickname,
      });

      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(verifyToken).toHaveBeenCalledWith(token);
      expect(mockReq.user).toMatchObject({
        user_id: mockUser.id,
        customer_id: mockUser.customer_id,
        role: mockUser.role,
        nickname: mockUser.nickname,
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should throw HttpError when token is missing', () => {
      mockReq.cookies = {};

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(HttpError);

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow('Authentication required');

      expect(verifyToken).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw HttpError when token is null', () => {
      mockReq.cookies = { token: null as any };

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(HttpError);

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow('Authentication required');
    });

    it('should throw HttpError when token is undefined', () => {
      mockReq.cookies = { token: undefined as any };

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(HttpError);

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow('Authentication required');
    });

    it('should throw HttpError when token is invalid', () => {
      mockReq.cookies = { token: 'invalid-token' };

      (verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid or expired token');
      });

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(HttpError);

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow('Invalid or expired token');

      expect(verifyToken).toHaveBeenCalledWith('invalid-token');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw HttpError when token is expired', () => {
      mockReq.cookies = { token: 'expired-token' };

      (verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(HttpError);

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow('Invalid or expired token');

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should set req.user with token payload', () => {
      const token = generateToken(mockUser);
      const payload = {
        user_id: mockUser.id,
        customer_id: mockUser.customer_id,
        role: mockUser.role,
        nickname: mockUser.nickname,
      };

      mockReq.cookies = { token };
      (verifyToken as jest.Mock).mockReturnValue(payload);

      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toEqual(payload);
    });

    it('should handle admin user token', () => {
      const token = generateToken(mockAdminUser);
      const payload = {
        user_id: mockAdminUser.id,
        customer_id: mockAdminUser.customer_id,
        role: mockAdminUser.role,
        nickname: mockAdminUser.nickname,
      };

      mockReq.cookies = { token };
      (verifyToken as jest.Mock).mockReturnValue(payload);

      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toMatchObject({
        role: UserRole.ADMIN,
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle client user token', () => {
      const token = generateToken(mockUser);
      const payload = {
        user_id: mockUser.id,
        customer_id: mockUser.customer_id,
        role: mockUser.role,
        nickname: mockUser.nickname,
      };

      mockReq.cookies = { token };
      (verifyToken as jest.Mock).mockReturnValue(payload);

      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toMatchObject({
        role: UserRole.CLIENT,
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should preserve HttpError when already thrown', () => {
      const token = generateToken(mockUser);
      mockReq.cookies = { token };

      const httpError = new HttpError('Custom error', 401);
      (verifyToken as jest.Mock).mockImplementation(() => {
        throw httpError;
      });

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(httpError);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin middleware', () => {
    it('should allow admin user to proceed', () => {
      mockReq.user = {
        user_id: mockAdminUser.id,
        customer_id: mockAdminUser.customer_id,
        role: UserRole.ADMIN,
        nickname: mockAdminUser.nickname,
      };

      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should throw HttpError for client user', () => {
      mockReq.user = {
        user_id: mockUser.id,
        customer_id: mockUser.customer_id,
        role: UserRole.CLIENT,
        nickname: mockUser.nickname,
      };

      expect(() => {
        requireAdmin(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(HttpError);

      expect(() => {
        requireAdmin(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow('Admin access required');

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw HttpError when user is not authenticated', () => {
      delete mockReq.user;

      expect(() => {
        requireAdmin(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(HttpError);

      expect(() => {
        requireAdmin(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow('Authentication required');

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw HttpError when user is null', () => {
      mockReq.user = null as any;

      expect(() => {
        requireAdmin(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(HttpError);

      expect(() => {
        requireAdmin(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow('Authentication required');

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should check for correct status code (403) for unauthorized access', () => {
      mockReq.user = {
        user_id: mockUser.id,
        customer_id: mockUser.customer_id,
        role: UserRole.CLIENT,
        nickname: mockUser.nickname,
      };

      try {
        requireAdmin(mockReq as Request, mockRes as Response, mockNext);
      } catch (error: any) {
        expect(error).toBeInstanceOf(HttpError);
        expect(error.statusCode).toBe(403);
      }
    });

    it('should check for correct status code (401) for unauthenticated', () => {
      delete mockReq.user;

      try {
        requireAdmin(mockReq as Request, mockRes as Response, mockNext);
      } catch (error: any) {
        expect(error).toBeInstanceOf(HttpError);
        expect(error.statusCode).toBe(401);
      }
    });

    it('should work with different admin user IDs', () => {
      const adminPayloads = [
        {
          user_id: '1',
          customer_id: '1',
          role: UserRole.ADMIN,
          nickname: 'admin1',
        },
        {
          user_id: '2',
          customer_id: '2',
          role: UserRole.ADMIN,
          nickname: 'admin2',
        },
        {
          user_id: '999',
          customer_id: '999',
          role: UserRole.ADMIN,
          nickname: 'admin999',
        },
      ];

      adminPayloads.forEach(payload => {
        mockReq.user = payload;
        requireAdmin(mockReq as Request, mockRes as Response, mockNext);
        expect(mockNext).toHaveBeenCalled();
        jest.clearAllMocks();
      });
    });
  });

  describe('Middleware Integration', () => {
    it('should work together: authenticate then requireAdmin for admin', () => {
      const token = generateToken(mockAdminUser);
      const payload = {
        user_id: mockAdminUser.id,
        customer_id: mockAdminUser.customer_id,
        role: mockAdminUser.role,
        nickname: mockAdminUser.nickname,
      };

      mockReq.cookies = { token };
      (verifyToken as jest.Mock).mockReturnValue(payload);

      // First authenticate
      authenticate(mockReq as Request, mockRes as Response, mockNext);
      expect(mockReq.user).toEqual(payload);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Then requireAdmin
      requireAdmin(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should work together: authenticate then requireAdmin for client (should fail)', () => {
      const token = generateToken(mockUser);
      const payload = {
        user_id: mockUser.id,
        customer_id: mockUser.customer_id,
        role: mockUser.role,
        nickname: mockUser.nickname,
      };

      mockReq.cookies = { token };
      (verifyToken as jest.Mock).mockReturnValue(payload);

      // First authenticate
      authenticate(mockReq as Request, mockRes as Response, mockNext);
      expect(mockReq.user).toEqual(payload);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Then requireAdmin (should fail)
      expect(() => {
        requireAdmin(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow('Admin access required');

      expect(mockNext).toHaveBeenCalledTimes(1); // Should not call again
    });
  });
});

