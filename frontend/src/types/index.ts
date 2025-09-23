// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userRoles?: UserRole[];
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy: string;
  role: Role;
}

// Role types
export interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rolePermissions?: RolePermission[];
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
  assignedAt: string;
  permission: Permission;
}

// Permission types
export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  createdAt: string;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form types
export interface CreateUserForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds: string[];
}

export interface UpdateUserForm {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  roleIds?: string[];
}

// Permission types
export interface CreatePermissionForm {
  name: string;
  resource: string;
  action: string;
  description: string;
}

export interface UpdatePermissionForm {
  name?: string;
  resource?: string;
  action?: string;
  description?: string;
}

export interface CreateRoleForm {
  name: string;
  description: string;
  permissionIds: string[];
}

export interface UpdateRoleForm {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];
}
