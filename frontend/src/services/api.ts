import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AuthTokens, LoginCredentials, RegisterData, User, Role, Permission, CreateUserForm, UpdateUserForm, CreateRoleForm, UpdateRoleForm, PaginatedResponse } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              const { accessToken } = response.data;
              
              localStorage.setItem('accessToken', accessToken);
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AxiosResponse<AuthTokens>> {
    return this.api.post('/auth/login', credentials);
  }

  async register(userData: RegisterData): Promise<AxiosResponse<AuthTokens>> {
    return this.api.post('/auth/register', userData);
  }

  async refreshToken(refreshToken: string): Promise<AxiosResponse<AuthTokens>> {
    return this.api.post('/auth/refresh', { refreshToken });
  }

  async logout(userId: string): Promise<AxiosResponse> {
    return this.api.post('/auth/logout', { userId });
  }

  // User endpoints
  async getUsers(page: number = 1, limit: number = 10): Promise<AxiosResponse<PaginatedResponse<User>>> {
    return this.api.get(`/users?page=${page}&limit=${limit}`);
  }

  async getUserById(id: string): Promise<AxiosResponse<User>> {
    return this.api.get(`/users/${id}`);
  }

  async createUser(userData: CreateUserForm): Promise<AxiosResponse<{ user: User }>> {
    return this.api.post('/users', userData);
  }

  async updateUser(id: string, userData: UpdateUserForm): Promise<AxiosResponse<{ user: User }>> {
    return this.api.patch(`/users/${id}`, userData);
  }

  async deleteUser(id: string): Promise<AxiosResponse<{ message: string }>> {
    return this.api.delete(`/users/${id}`);
  }

  async assignRole(userId: string, roleId: string): Promise<AxiosResponse<{ message: string }>> {
    return this.api.post(`/users/${userId}/roles`, { roleId });
  }

  async removeRole(userId: string, roleId: string): Promise<AxiosResponse<{ message: string }>> {
    return this.api.delete(`/users/${userId}/roles/${roleId}`);
  }

  // Role endpoints
  async getRoles(): Promise<AxiosResponse<Role[]>> {
    return this.api.get('/roles');
  }

  async getRoleById(id: string): Promise<AxiosResponse<Role>> {
    return this.api.get(`/roles/${id}`);
  }

  async createRole(roleData: CreateRoleForm): Promise<AxiosResponse<{ role: Role }>> {
    return this.api.post('/roles', roleData);
  }

  async updateRole(id: string, roleData: UpdateRoleForm): Promise<AxiosResponse<{ role: Role }>> {
    return this.api.patch(`/roles/${id}`, roleData);
  }

  async deleteRole(id: string): Promise<AxiosResponse<{ message: string }>> {
    return this.api.delete(`/roles/${id}`);
  }

  async assignPermission(roleId: string, permissionId: string): Promise<AxiosResponse<{ message: string }>> {
    return this.api.post(`/roles/${roleId}/permissions`, { permissionId });
  }

  async removePermission(roleId: string, permissionId: string): Promise<AxiosResponse<{ message: string }>> {
    return this.api.delete(`/roles/${roleId}/permissions/${permissionId}`);
  }

  // Permission endpoints
  async getPermissions(): Promise<AxiosResponse<Permission[]>> {
    return this.api.get('/permissions');
  }

  async getPermissionById(id: string): Promise<AxiosResponse<Permission>> {
    return this.api.get(`/permissions/${id}`);
  }

  async createPermission(permissionData: { name: string; resource: string; action: string; description: string }): Promise<AxiosResponse<Permission>> {
    return this.api.post('/permissions', permissionData);
  }

  async updatePermission(id: string, permissionData: { name: string; resource: string; action: string; description: string }): Promise<AxiosResponse<Permission>> {
    return this.api.put(`/permissions/${id}`, permissionData);
  }

  async deletePermission(id: string): Promise<AxiosResponse<void>> {
    return this.api.delete(`/permissions/${id}`);
  }

  async getPermissionsGroupedByResource(): Promise<AxiosResponse<Record<string, Permission[]>>> {
    return this.api.get('/permissions/grouped');
  }
}

export const apiService = new ApiService();
