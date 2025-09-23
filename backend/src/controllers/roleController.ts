import { Response, NextFunction } from 'express';
import { RoleService, createRoleSchema, updateRoleSchema } from '../services/roleService';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

export class RoleController {
  static async getRoles(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await RoleService.getRoles();
      res.json(roles);
    } catch (error) {
      next(error);
    }
  }

  static async getRoleById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const role = await RoleService.getRoleById(id);
      res.json(role);
    } catch (error) {
      next(error);
    }
  }

  static async createRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const roleData = createRoleSchema.parse(req.body);
      const role = await RoleService.createRole(roleData);

      res.status(201).json({
        message: 'Role created successfully',
        role,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const roleData = updateRoleSchema.parse(req.body);
      const role = await RoleService.updateRole(id, roleData);

      res.json({
        message: 'Role updated successfully',
        role,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await RoleService.deleteRole(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async assignPermission(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: roleId } = req.params;
      const { permissionId } = req.body;

      if (!permissionId) {
        throw createError('Permission ID required', 400);
      }

      const result = await RoleService.assignPermission(roleId, permissionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async removePermission(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: roleId, permissionId } = req.params;
      const result = await RoleService.removePermission(roleId, permissionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
