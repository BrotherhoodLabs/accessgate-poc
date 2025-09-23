import { Request, Response, NextFunction } from 'express';
import { AuthService, registerSchema, loginSchema } from '../services/authService';
import { createError } from '../middleware/errorHandler';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData = registerSchema.parse(req.body);
      const tokens = await AuthService.register(userData);

      res.status(201).json({
        message: 'User registered successfully',
        ...tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const credentials = loginSchema.parse(req.body);
      const tokens = await AuthService.login(credentials);

      res.json({
        message: 'Login successful',
        ...tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw createError('Refresh token required', 400);
      }

      const tokens = await AuthService.refreshToken(refreshToken);

      res.json({
        message: 'Token refreshed successfully',
        ...tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.body;

      if (!userId) {
        throw createError('User ID required', 400);
      }

      await AuthService.logout(userId);

      res.json({
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }
}
