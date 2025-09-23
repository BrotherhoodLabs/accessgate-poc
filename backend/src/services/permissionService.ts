import { prisma } from '../index';
import { createError } from '../middleware/errorHandler';

export class PermissionService {
  static async getPermissions() {
    const permissions = await prisma.permission.findMany({
      include: {
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
      orderBy: { resource: 'asc' },
    });

    return permissions;
  }

  static async getPermissionById(id: string) {
    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: {
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

    if (!permission) {
      throw createError('Permission not found', 404);
    }

    return permission;
  }

  static async getPermissionsByResource(resource: string) {
    const permissions = await prisma.permission.findMany({
      where: { resource },
      include: {
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
      orderBy: { action: 'asc' },
    });

    return permissions;
  }

  static async getPermissionsByAction(action: string) {
    const permissions = await prisma.permission.findMany({
      where: { action },
      include: {
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
      orderBy: { resource: 'asc' },
    });

    return permissions;
  }

  static async getPermissionsGroupedByResource() {
    const permissions = await prisma.permission.findMany({
      include: {
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    // Group permissions by resource
    const grouped = permissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource]!.push(permission);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return grouped;
  }
}
