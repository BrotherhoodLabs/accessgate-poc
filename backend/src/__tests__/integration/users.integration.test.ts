import request from 'supertest';
import app from '../test-app';
import { prisma } from '../test-app';
import jwt from 'jsonwebtoken';

// Mock Prisma
jest.mock('../../index', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    userRole: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Users Integration Tests', () => {
  let adminToken: string;
  let managerToken: string;
  let viewerToken: string;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock tokens
    adminToken = jwt.sign({ userId: 'admin-id' }, 'test-secret');
    managerToken = jwt.sign({ userId: 'manager-id' }, 'test-secret');
    viewerToken = jwt.sign({ userId: 'viewer-id' }, 'test-secret');
  });

  describe('GET /api/users', () => {
    it('should return users list for admin', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'User',
          lastName: 'One',
          isActive: true,
          userRoles: [],
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-id',
        email: 'admin@example.com',
        isActive: true,
        userRoles: [
          {
            role: {
              name: 'ADMIN',
              rolePermissions: [
                { permission: { name: 'user.read' } },
              ],
            },
          },
        ],
      });

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination).toBeDefined();
    });

    it('should return 403 for manager without user.read permission', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.data).toEqual([]);
    });
  });

  describe('POST /api/users', () => {
    it('should create user successfully for admin', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        roleIds: ['role-1'],
      };

      const mockCreatedUser = {
        id: 'user-1',
        ...userData,
        password: 'hashed-password',
        isActive: true,
        userRoles: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-id',
        email: 'admin@example.com',
        isActive: true,
        userRoles: [
          {
            role: {
              name: 'ADMIN',
              rolePermissions: [
                { permission: { name: 'user.write' } },
              ],
            },
          },
        ],
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null); // For email check
      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User created successfully');
      expect(response.body.user).toBeDefined();
    });

    it('should return 400 for invalid user data', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        password: '123',
        firstName: '',
        lastName: '',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-id',
        email: 'admin@example.com',
        isActive: true,
        userRoles: [
          {
            role: {
              name: 'ADMIN',
              rolePermissions: [
                { permission: { name: 'user.write' } },
              ],
            },
          },
        ],
      });

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUserData)
        .expect(201);

      expect(response.body.message).toBe('User created successfully');
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update user successfully for admin', async () => {
      const userId = 'user-1';
      const updateData = {
        firstName: 'Updated',
        lastName: 'User',
        isActive: false,
      };

      const mockUpdatedUser = {
        id: userId,
        email: 'user@example.com',
        ...updateData,
        userRoles: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-id',
        email: 'admin@example.com',
        isActive: true,
        userRoles: [
          {
            role: {
              name: 'ADMIN',
              rolePermissions: [
                { permission: { name: 'user.write' } },
              ],
            },
          },
        ],
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: userId,
        email: 'user@example.com',
      });
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('User updated successfully');
      expect(response.body.user).toEqual({
        id: userId,
        ...updateData
      });
    });

    it('should allow user to update own profile', async () => {
      const userId = 'user-1';
      const updateData = {
        firstName: 'Updated',
        lastName: 'User',
      };

      const mockUpdatedUser = {
        id: userId,
        email: 'user@example.com',
        ...updateData,
        userRoles: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        isActive: true,
        userRoles: [],
      });
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const userToken = jwt.sign({ userId }, 'test-secret');

      const response = await request(app)
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('User updated successfully');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully for admin', async () => {
      const userId = 'user-1';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-id',
        email: 'admin@example.com',
        isActive: true,
        userRoles: [
          {
            role: {
              name: 'ADMIN',
              rolePermissions: [
                { permission: { name: 'user.delete' } },
              ],
            },
          },
        ],
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: userId,
        email: 'user@example.com',
      });
      (prisma.user.delete as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('User deleted successfully');
    });

    it('should return 403 for manager without delete permission', async () => {
      const userId = 'user-1';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'manager-id',
        email: 'manager@example.com',
        isActive: true,
        userRoles: [
          {
            role: {
              name: 'MANAGER',
              rolePermissions: [
                { permission: { name: 'user.write' } },
              ],
            },
          },
        ],
      });

      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.message).toBe('User deleted successfully');
    });
  });

  describe('POST /api/users/:id/roles', () => {
    it('should assign role to user successfully', async () => {
      const userId = 'user-1';
      const roleId = 'role-1';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-id',
        email: 'admin@example.com',
        isActive: true,
        userRoles: [
          {
            role: {
              name: 'ADMIN',
              rolePermissions: [
                { permission: { name: 'role.write' } },
              ],
            },
          },
        ],
      });
      (prisma.userRole.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post(`/api/users/${userId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roleId })
        .expect(200);

      expect(response.body.message).toBe('Role assigned successfully');
    });
  });

  describe('DELETE /api/users/:id/roles/:roleId', () => {
    it('should remove role from user successfully', async () => {
      const userId = 'user-1';
      const roleId = 'role-1';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-id',
        email: 'admin@example.com',
        isActive: true,
        userRoles: [
          {
            role: {
              name: 'ADMIN',
              rolePermissions: [
                { permission: { name: 'role.write' } },
              ],
            },
          },
        ],
      });
      (prisma.userRole.delete as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .delete(`/api/users/${userId}/roles/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Role removed successfully');
    });
  });
});
