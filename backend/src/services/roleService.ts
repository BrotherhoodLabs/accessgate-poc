import { prisma } from '../index';
import { createError } from '../middleware/errorHandler';
import { z } from 'zod';

// Validation schemas
export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Role name too long'),
  description: z.string().min(1, 'Description is required'),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Role name too long').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  isActive: z.boolean().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export class RoleService {
  static async getRoles() {
    const roles = await prisma.role.findMany({
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

    return roles;
  }

  static async getRoleById(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
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

    if (!role) {
      throw createError('Role not found', 404);
    }

    return role;
  }

  static async createRole(roleData: z.infer<typeof createRoleSchema>) {
    const { name, description, permissionIds = [] } = roleData;

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: name.toUpperCase() },
    });

    if (existingRole) {
      throw createError('Role already exists with this name', 400);
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name: name.toUpperCase(),
        description,
        rolePermissions: {
          create: permissionIds.map(permissionId => ({
            permissionId,
          })),
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

    return role;
  }

  static async updateRole(id: string, roleData: z.infer<typeof updateRoleSchema>) {
    const { name, description, isActive, permissionIds } = roleData;

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw createError('Role not found', 404);
    }

    // Check name uniqueness if changing name
    if (name && name.toUpperCase() !== existingRole.name) {
      const nameExists = await prisma.role.findUnique({
        where: { name: name.toUpperCase() },
      });

      if (nameExists) {
        throw createError('Role already exists with this name', 400);
      }
    }

    // Update role
    const role = await prisma.role.update({
      where: { id },
      data: {
        ...(name && { name: name.toUpperCase() }),
        ...(description && { description }),
        ...(isActive !== undefined && { isActive }),
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

    // Update permissions if provided
    if (permissionIds) {
      // Remove existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Add new permissions
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({
            roleId: id,
            permissionId,
          })),
        });
      }

      // Fetch updated role with permissions
      return this.getRoleById(id);
    }

    return role;
  }

  static async deleteRole(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw createError('Role not found', 404);
    }

    // Check if role is assigned to users
    const userCount = await prisma.userRole.count({
      where: { roleId: id },
    });

    if (userCount > 0) {
      throw createError('Cannot delete role that is assigned to users', 400);
    }

    await prisma.role.delete({
      where: { id },
    });

    return { message: 'Role deleted successfully' };
  }

  static async assignPermission(roleId: string, permissionId: string) {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw createError('Role not found', 404);
    }

    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw createError('Permission not found', 404);
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (existingAssignment) {
      throw createError('Role already has this permission', 400);
    }

    // Create assignment
    await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });

    return { message: 'Permission assigned successfully' };
  }

  static async removePermission(roleId: string, permissionId: string) {
    const assignment = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (!assignment) {
      throw createError('Permission assignment not found', 404);
    }

    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    return { message: 'Permission removed successfully' };
  }
}
