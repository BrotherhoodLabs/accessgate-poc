import { UserService, createUserSchema, updateUserSchema } from '../userService';
import { prisma } from '../../index';
import { createError } from '../../middleware/errorHandler';

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
    role: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userRole: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return paginated users successfully', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'User',
          lastName: 'One',
          isActive: true,
          userRoles: [],
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          firstName: 'User',
          lastName: 'Two',
          isActive: true,
          userRoles: [],
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(2);

      const result = await UserService.getUsers(1, 10);

      expect(result).toEqual({
        users: mockUsers,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          pages: 1,
        },
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          userRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle empty user list', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      const result = await UserService.getUsers(1, 10);

      expect(result.users).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getUserById', () => {
    it('should return user by id successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        firstName: 'User',
        lastName: 'Test',
        isActive: true,
        userRoles: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.getUserById('user-1');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          userRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  rolePermissions: {
                    include: {
                      permission: {
                        select: {
                          id: true,
                          name: true,
                          description: true,
                          action: true,
                          resource: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(UserService.getUserById('non-existent')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        roleIds: ['role-1'],
      };

      const mockUser = {
        id: 'user-1',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: true,
        createdAt: new Date(),
        userRoles: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.createUser(userData, 'admin-id');

      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: userData.email,
          password: expect.any(String),
          firstName: userData.firstName,
          lastName: userData.lastName,
          userRoles: {
            create: userData.roleIds.map(roleId => ({
              roleId,
              assignedBy: 'admin-id',
            })),
          },
        }),
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
          userRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
      });
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
        roleIds: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: userData.email,
      });

      await expect(UserService.createUser(userData, 'admin-id')).rejects.toThrow(
        'User already exists with this email'
      );
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
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
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        email: 'user@example.com',
      });
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result = await UserService.updateUser(userId, updateData, 'admin-id');

      expect(result).toEqual(mockUpdatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          updatedAt: true,
          userRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
      });
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        UserService.updateUser('non-existent', {}, 'admin-id')
      ).rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = 'user-1';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        email: 'user@example.com',
      });
      (prisma.user.delete as jest.Mock).mockResolvedValue({});

      const result = await UserService.deleteUser(userId);

      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(UserService.deleteUser('non-existent')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('assignRole', () => {
    it('should assign role to user successfully', async () => {
      const userId = 'user-1';
      const roleId = 'role-1';
      const assignedBy = 'admin-id';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        email: 'user@example.com',
      });
      (prisma.role.findUnique as jest.Mock).mockResolvedValue({
        id: roleId,
        name: 'ADMIN',
      });
      (prisma.userRole.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.userRole.create as jest.Mock).mockResolvedValue({});

      const result = await UserService.assignRole(userId, roleId, assignedBy);

      expect(result).toEqual({ message: 'Role assigned successfully' });
      expect(prisma.userRole.create).toHaveBeenCalledWith({
        data: {
          userId,
          roleId,
          assignedBy,
        },
      });
    });
  });

  describe('removeRole', () => {
    it('should remove role from user successfully', async () => {
      const userId = 'user-1';
      const roleId = 'role-1';

      (prisma.userRole.findUnique as jest.Mock).mockResolvedValue({
        id: 'assignment-1',
        userId,
        roleId,
      });
      (prisma.userRole.delete as jest.Mock).mockResolvedValue({});

      const result = await UserService.removeRole(userId, roleId);

      expect(result).toEqual({ message: 'Role removed successfully' });
      expect(prisma.userRole.delete).toHaveBeenCalledWith({
        where: {
          userId_roleId: {
            userId,
            roleId,
          },
        },
      });
    });
  });
});
