import '@testing-library/jest-dom';

// Mock de l'API service
jest.mock('./services/api', () => ({
  apiService: {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    refreshToken: jest.fn(),
    getUsers: jest.fn(),
    getRoles: jest.fn(),
    getPermissions: jest.fn(),
  }
}));

// Mock de React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

// Mock de Material-UI
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useTheme: () => ({
    palette: {
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' },
    },
  }),
}));

// Mock de Zustand store
jest.mock('./store/authStore', () => ({
  useAuthStore: () => ({
    user: null,
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
    setUser: jest.fn(),
  })
}));

// Mock des variables d'environnement
process.env.VITE_API_BASE_URL = 'http://localhost:8000/api';
