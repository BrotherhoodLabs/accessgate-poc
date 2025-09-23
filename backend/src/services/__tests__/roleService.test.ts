import { RoleService, createRoleSchema, updateRoleSchema } from '../roleService';
import { prisma } from '../../index';
import { createError } from '../../middleware/errorHandler';

// Mock Prisma
jest.mock('../../index', () => ({
  prisma: {
    role: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    userRole: {
      count: jest.fn(),
    },
    permission: {
      findUnique: jest.fn(),
    },
    rolePermission: {
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

describe('RoleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRoles', () => {
    it('should return all roles with permissions and user count', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          name: 'ADMIN',
          description: 'Administrator role',
          isActive: true,
          rolePermissions: [
            {
              permission: {
                id: 'perm-1',
                name: 'user.read',
                resource: 'user',
                action: 'read',
                description: 'Read users',
              },
            },
          ],
          _count: {
            userRoles: 2,
          },
        },
      ];

      (prisma.role.findMany as jest.Mock).mockResolvedValue(mockRoles);

      const result = await RoleService.getRoles();

      expect(result).toEqual(mockRoles);
      expect(prisma.role.findMany).toHaveBeenCalledWith({
        include: {
          rolePermissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  name: true,
                  resource: true,
                  action: true,
                  description: true,
                },
              },
            },
          },
          _count: {
            select: {
              userRoles: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getRoleById', () => {
    it('should return role by id with permissions and users', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'ADMIN',
        description: 'Administrator role',
        isActive: true,
        rolePermissions: [],
        userRoles: [],
      };

      (prisma.role.findUnique as jest.Mock).mockResolvedValue(mockRole);

      const result = await RoleService.getRoleById('role-1');

      expect(result).toEqual(mockRole);
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        include: {
          rolePermissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  name: true,
                  resource: true,
                  action: true,
                  description: true,
                },
              },
            },
          },
          userRoles: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
    });

    it('should throw error if role not found', async () => {
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(RoleService.getRoleById('non-existent')).rejects.toThrow(
        'Role not found'
      );
    });
  });

  describe('createRole', () => {
    it('should create role successfully', async () => {
      const roleData = {
        name: 'EDITOR',
        description: 'Editor role',
        permissionIds: ['perm-1', 'perm-2'],
      };

      const mockRole = {
        id: 'role-1',
        name: 'EDITOR',
        description: 'Editor role',
        isActive: true,
        rolePermissions: [],
      };

      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.role.create as jest.Mock).mockResolvedValue(mockRole);

      const result = await RoleService.createRole(roleData);

      expect(result).toEqual(mockRole);
      expect(prisma.role.create).toHaveBeenCalledWith({
        data: {
          name: 'EDITOR',
          description: 'Editor role',
          rolePermissions: {
            create: [
              { permissionId: 'perm-1' },
              { permissionId: 'perm-2' },
            ],
          },
        },
        include: {
          rolePermissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  name: true,
                  resource: true,
                  action: true,
                  description: true,
                },
              },
            },
          },
        },
      });
    });

    it('should throw error if role already exists', async () => {
      const roleData = {
        name: 'ADMIN',
        description: 'Administrator role',
        permissionIds: [],
      };

      (prisma.role.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-role',
        name: 'ADMIN',
      });

      await expect(RoleService.createRole(roleData)).rejects.toThrow(
        'Role already exists with this name'
      );
    });
  });

  describe('updateRole', () => {
    it('should update role successfully', async () => {
      const roleId = 'role-1';
      const roleData = {
        name: 'UPDATED_ROLE',
        description: 'Updated description',
        isActive: false,
      };

      const mockUpdatedRole = {
        id: roleId,
        ...roleData,
        rolePermissions: [],
      };

      (prisma.role.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          id: roleId,
          name: 'OLD_ROLE',
        })
        .mockResolvedValueOnce(null); // No existing role with the new name
      (prisma.role.update as jest.Mock).mockResolvedValue(mockUpdatedRole);

      const result = await RoleService.updateRole(roleId, roleData);

      expect(result).toEqual(mockUpdatedRole);
      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: roleId },
        data: {
          name: 'UPDATED_ROLE',
          description: 'Updated description',
          isActive: false,
        },
        include: {
          rolePermissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  name: true,
                  resource: true,
                  action: true,
                  description: true,
                },
              },
            },
          },
        },
      });
    });

    it('should throw error if role not found', async () => {
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        RoleService.updateRole('non-existent', { name: 'TEST' })
      ).rejects.toThrow('Role not found');
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      const roleId = 'role-1';

      (prisma.role.findUnique as jest.Mock).mockResolvedValue({
        id: roleId,
        name: 'TEST_ROLE',
      });
      (prisma.userRole.count as jest.Mock).mockResolvedValue(0);
      (prisma.role.delete as jest.Mock).mockResolvedValue({});

      const result = await RoleService.deleteRole(roleId);

      expect(result).toEqual({ message: 'Role deleted successfully' });
      expect(prisma.role.delete).toHaveBeenCalledWith({
        where: { id: roleId },
      });
    });

    it('should throw error if role not found', async () => {
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(RoleService.deleteRole('non-existent')).rejects.toThrow(
        'Role not found'
      );
    });

    it('should throw error if role is assigned to users', async () => {
      const roleId = 'role-1';

      (prisma.role.findUnique as jest.Mock).mockResolvedValue({
        id: roleId,
        name: 'TEST_ROLE',
      });
      (prisma.userRole.count as jest.Mock).mockResolvedValue(2);

      await expect(RoleService.deleteRole(roleId)).rejects.toThrow(
        'Cannot delete role that is assigned to users'
      );
    });
  });

  describe('assignPermission', () => {
    it('should assign permission to role successfully', async () => {
      const roleId = 'role-1';
      const permissionId = 'perm-1';

      (prisma.role.findUnique as jest.Mock).mockResolvedValue({
        id: roleId,
        name: 'TEST_ROLE',
      });
      (prisma.permission.findUnique as jest.Mock).mockResolvedValue({
        id: permissionId,
        name: 'user.read',
      });
      (prisma.rolePermission.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.rolePermission.create as jest.Mock).mockResolvedValue({});

      const result = await RoleService.assignPermission(roleId, permissionId);

      expect(result).toEqual({ message: 'Permission assigned successfully' });
      expect(prisma.rolePermission.create).toHaveBeenCalledWith({
        data: {
          roleId,
          permissionId,
        },
      });
    });

    it('should throw error if role not found', async () => {
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        RoleService.assignPermission('non-existent', 'perm-1')
      ).rejects.toThrow('Role not found');
    });

    it('should throw error if permission not found', async () => {
      (prisma.role.findUnique as jest.Mock).mockResolvedValue({
        id: 'role-1',
        name: 'TEST_ROLE',
      });
      (prisma.permission.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        RoleService.assignPermission('role-1', 'non-existent')
      ).rejects.toThrow('Permission not found');
    });

    it('should throw error if permission already assigned', async () => {
      const roleId = 'role-1';
      const permissionId = 'perm-1';

      (prisma.role.findUnique as jest.Mock).mockResolvedValue({
        id: roleId,
        name: 'TEST_ROLE',
      });
      (prisma.permission.findUnique as jest.Mock).mockResolvedValue({
        id: permissionId,
        name: 'user.read',
      });
      (prisma.rolePermission.findUnique as jest.Mock).mockResolvedValue({
        roleId,
        permissionId,
      });

      await expect(
        RoleService.assignPermission(roleId, permissionId)
      ).rejects.toThrow('Role already has this permission');
    });
  });

  describe('removePermission', () => {
    it('should remove permission from role successfully', async () => {
      const roleId = 'role-1';
      const permissionId = 'perm-1';

      (prisma.rolePermission.findUnique as jest.Mock).mockResolvedValue({
        roleId,
        permissionId,
      });
      (prisma.rolePermission.delete as jest.Mock).mockResolvedValue({});

      const result = await RoleService.removePermission(roleId, permissionId);

      expect(result).toEqual({ message: 'Permission removed successfully' });
      expect(prisma.rolePermission.delete).toHaveBeenCalledWith({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
      });
    });

    it('should throw error if permission assignment not found', async () => {
      (prisma.rolePermission.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        RoleService.removePermission('role-1', 'perm-1')
      ).rejects.toThrow('Permission assignment not found');
    });
  });
});
