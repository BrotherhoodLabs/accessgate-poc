import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Mock Prisma for testing
export const prisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  role: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  permission: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  userRole: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  rolePermission: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
};

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env['CORS_ORIGINS']?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'),
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/auth', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes (simplified for testing)
app.post('/api/auth/register', (req, res) => {
  res.status(201).json({ message: 'User registered successfully' });
});

app.post('/api/auth/login', (req, res) => {
  res.status(200).json({ 
    message: 'Login successful',
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token'
  });
});

// Users routes (simplified for testing)
app.get('/api/users', (req, res) => {
  res.status(200).json({
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0
    }
  });
});

app.post('/api/users', (req, res) => {
  res.status(201).json({
    message: 'User created successfully',
    user: { id: 'test-user-id', ...req.body }
  });
});

app.patch('/api/users/:id', (req, res) => {
  res.status(200).json({
    message: 'User updated successfully',
    user: { id: req.params.id, ...req.body }
  });
});

app.delete('/api/users/:id', (req, res) => {
  res.status(200).json({
    message: 'User deleted successfully'
  });
});

app.post('/api/users/:id/roles', (req, res) => {
  res.status(200).json({
    message: 'Role assigned successfully'
  });
});

app.delete('/api/users/:id/roles/:roleId', (req, res) => {
  res.status(200).json({
    message: 'Role removed successfully'
  });
});

export default app;
