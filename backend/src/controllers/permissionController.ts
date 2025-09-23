import { Response, NextFunction } from 'express';
import { PermissionService } from '../services/permissionService';
import { AuthRequest } from '../middleware/auth';

export class PermissionController {
  static async getPermissions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await PermissionService.getPermissions();
      res.json(permissions);
    } catch (error) {
      next(error);
    }
  }

  static async getPermissionById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const permission = await PermissionService.getPermissionById(id);
      res.json(permission);
    } catch (error) {
      next(error);
    }
  }

  static async getPermissionsByResource(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { resource } = req.params;
      const permissions = await PermissionService.getPermissionsByResource(resource);
      res.json(permissions);
    } catch (error) {
      next(error);
    }
  }

  static async getPermissionsByAction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { action } = req.params;
      const permissions = await PermissionService.getPermissionsByAction(action);
      res.json(permissions);
    } catch (error) {
      next(error);
    }
  }

  static async getPermissionsGroupedByResource(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await PermissionService.getPermissionsGroupedByResource();
      res.json(permissions);
    } catch (error) {
      next(error);
    }
  }
}
