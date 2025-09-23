import { Request, Response, NextFunction } from 'express';
import { checkAuth, requirePermission, requireRole } from '../auth';
import { prisma } from '../../index';
import jwt from 'jsonwebtoken';

// Mock Prisma
jest.mock('../../index', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock jwt
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      header: jest.fn(),
    };
    mockRes = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('checkAuth', () => {
    it('should authenticate user successfully', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        isActive: true,
        userRoles: [
          {
            role: {
              name: 'ADMIN',
              rolePermissions: [
                {
                  permission: {
                    name: 'user.read',
                  },
                },
              ],
            },
          },
        ],
      };

      (mockReq.header as jest.Mock).mockReturnValue('Bearer valid-token');
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-id' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await checkAuth(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq).toHaveProperty('user');
      expect((mockReq as any).user).toHaveProperty('id', 'user-id');
      expect((mockReq as any).user).toHaveProperty('email', 'test@example.com');
      expect((mockReq as any).user).toHaveProperty('roles', ['ADMIN']);
      expect((mockReq as any).user).toHaveProperty('permissions', ['user.read']);
    });

    it('should return 401 if no token provided', async () => {
      (mockReq.header as jest.Mock).mockReturnValue(undefined);

      await checkAuth(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access token required',
          statusCode: 401,
        })
      );
    });

    it('should return 401 if token is invalid', async () => {
      (mockReq.header as jest.Mock).mockReturnValue('Bearer invalid-token');
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      await checkAuth(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid token',
          statusCode: 401,
        })
      );
    });

    it('should return 401 if user not found', async () => {
      (mockReq.header as jest.Mock).mockReturnValue('Bearer valid-token');
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-id' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await checkAuth(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found or inactive',
          statusCode: 401,
        })
      );
    });
  });

  describe('requirePermission', () => {
    it('should allow access if user has required permission', () => {
      const middleware = requirePermission('user.read');
      (mockReq as any).user = {
        permissions: ['user.read', 'user.write'],
      };

      middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access if user lacks required permission', () => {
      const middleware = requirePermission('user.delete');
      (mockReq as any).user = {
        permissions: ['user.read', 'user.write'],
      };

      middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Insufficient permissions',
          statusCode: 403,
        })
      );
    });

    it('should deny access if user is not authenticated', () => {
      const middleware = requirePermission('user.read');
      (mockReq as any).user = undefined;

      middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
          statusCode: 401,
        })
      );
    });
  });

  describe('requireRole', () => {
    it('should allow access if user has required role', () => {
      const middleware = requireRole('ADMIN');
      (mockReq as any).user = {
        roles: ['ADMIN', 'MANAGER'],
      };

      middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access if user lacks required role', () => {
      const middleware = requireRole('ADMIN');
      (mockReq as any).user = {
        roles: ['MANAGER', 'VIEWER'],
      };

      middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Insufficient role',
          statusCode: 403,
        })
      );
    });
  });
});
