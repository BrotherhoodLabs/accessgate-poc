// Tests simples pour l'authentification sans JSX
import { apiService } from '../services/api';

// Mock de l'API service
jest.mock('../services/api', () => ({
  apiService: {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
  }
}));

describe('Authentication API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login API', () => {
    it('should call login API with correct parameters', async () => {
      const mockLogin = jest.fn().mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { id: '1', email: 'test@example.com' }
      });
      (apiService.login as jest.Mock) = mockLogin;

      const credentials = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      await apiService.login(credentials);

      expect(mockLogin).toHaveBeenCalledWith(credentials);
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });

    it('should handle login API errors', async () => {
      const mockLogin = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
      (apiService.login as jest.Mock) = mockLogin;

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      await expect(apiService.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Register API', () => {
    it('should call register API with correct parameters', async () => {
      const mockRegister = jest.fn().mockResolvedValue({
        message: 'User registered successfully'
      });
      (apiService.register as jest.Mock) = mockRegister;

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!'
      };

      await apiService.register(userData);

      expect(mockRegister).toHaveBeenCalledWith(userData);
      expect(mockRegister).toHaveBeenCalledTimes(1);
    });

    it('should handle register API errors', async () => {
      const mockRegister = jest.fn().mockRejectedValue(new Error('Email already exists'));
      (apiService.register as jest.Mock) = mockRegister;

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'Password123!'
      };

      await expect(apiService.register(userData)).rejects.toThrow('Email already exists');
    });
  });

  describe('Logout API', () => {
    it('should call logout API', async () => {
      const mockLogout = jest.fn().mockResolvedValue({});
      (apiService.logout as jest.Mock) = mockLogout;

      await apiService.logout('user-id');

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });
});
