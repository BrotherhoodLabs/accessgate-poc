import { Request, Response, NextFunction } from 'express';
import { AuthService, registerSchema, loginSchema } from '../services/authService';
import { createError } from '../middleware/errorHandler';

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: admin@accessgate.com
 *         password:
 *           type: string
 *           minLength: 8
 *           example: Admin123!
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@accessgate.com
 *         password:
 *           type: string
 *           minLength: 8
 *           example: Password123!
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Login successful
 *         accessToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         refreshToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         user:
 *           $ref: '#/components/schemas/User'
 */

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
