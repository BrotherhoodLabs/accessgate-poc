import { AuthService } from '../authService';
import { prisma } from '../../index';
import bcrypt from 'bcryptjs';

// Mock Prisma
jest.mock('../../index', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: userData.email,
      });

      const result = await AuthService.register(userData);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          password: 'hashedPassword',
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
      });
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user-id',
        email: userData.email,
      });

      await expect(AuthService.register(userData)).rejects.toThrow(
        'User already exists with this email'
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-id',
        email: credentials.email,
        password: 'hashedPassword',
        isActive: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await AuthService.login(credentials);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: credentials.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, mockUser.password);
    });

    it('should throw error for invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.login(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for inactive user', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-id',
        email: credentials.email,
        password: 'hashedPassword',
        isActive: false,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(AuthService.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        isActive: true,
      };

      // Mock jwt.verify
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValue({ userId: mockUser.id });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await AuthService.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error for invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';

      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(AuthService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });
});
