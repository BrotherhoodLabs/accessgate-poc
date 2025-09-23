import { Response, NextFunction } from 'express';
import { UserService, createUserSchema, updateUserSchema } from '../services/userService';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

export class UserController {
  static async getUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await UserService.getUsers(page, limit);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Users can only view their own profile unless they have user.read permission
      if (id !== req.user?.id && !req.user?.permissions.includes('user.read')) {
        throw createError('Access denied', 403);
      }

      const user = await UserService.getUserById(id);

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData = createUserSchema.parse(req.body);
      const assignedBy = req.user!.id;

      const user = await UserService.createUser(userData, assignedBy);

      res.status(201).json({
        message: 'User created successfully',
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userData = updateUserSchema.parse(req.body);
      const updatedBy = req.user!.id;

      // Users can only update their own profile unless they have user.write permission
      if (id !== req.user?.id && !req.user?.permissions.includes('user.write')) {
        throw createError('Access denied', 403);
      }

      const user = await UserService.updateUser(id, userData, updatedBy);

      res.json({
        message: 'User updated successfully',
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Only users with user.delete permission can delete users
      if (!req.user?.permissions.includes('user.delete')) {
        throw createError('Access denied', 403);
      }

      const result = await UserService.deleteUser(id);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async assignRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: userId } = req.params;
      const { roleId } = req.body;
      const assignedBy = req.user!.id;

      if (!roleId) {
        throw createError('Role ID required', 400);
      }

      // Only users with role.write permission can assign roles
      if (!req.user?.permissions.includes('role.write')) {
        throw createError('Access denied', 403);
      }

      const result = await UserService.assignRole(userId, roleId, assignedBy);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async removeRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: userId, roleId } = req.params;

      // Only users with role.write permission can remove roles
      if (!req.user?.permissions.includes('role.write')) {
        throw createError('Access denied', 403);
      }

      const result = await UserService.removeRole(userId, roleId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
