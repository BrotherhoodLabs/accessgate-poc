import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, LoginCredentials, RegisterData } from '../types';
import { apiService } from '../services/api';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.login(credentials);
          const { accessToken, refreshToken } = response.data;
          
          // Store tokens
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          // Get user info (we'll need to implement this endpoint)
          // For now, we'll extract from token or make a separate call
          const user: AuthUser = {
            id: 'temp-id', // This should come from the API
            email: credentials.email,
            roles: ['USER'], // This should come from the API
            permissions: ['user.read'], // This should come from the API
          };
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error?.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.register(userData);
          const { accessToken, refreshToken } = response.data;
          
          // Store tokens
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          // Get user info
          const user: AuthUser = {
            id: 'temp-id', // This should come from the API
            email: userData.email,
            roles: ['USER'], // This should come from the API
            permissions: ['user.read'], // This should come from the API
          };
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error?.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        const { user } = get();
        
        if (user) {
          apiService.logout(user.id).catch(console.error);
        }
        
        // Clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshAuth: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const response = await apiService.refreshToken(refreshToken);
          const { accessToken } = response.data;
          
          localStorage.setItem('accessToken', accessToken);
          
          // Keep existing user data, just update the token
          set({ isAuthenticated: true });
        } catch (error) {
          // Refresh failed, logout
          get().logout();
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
