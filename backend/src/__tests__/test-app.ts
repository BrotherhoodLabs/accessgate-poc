import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { correlationIdMiddleware } from '../utils/correlationId';
import { requestLogger } from '../middleware/requestLogger';
import { errorHandler } from '../middleware/errorHandler';
import { rateLimiter } from '../middleware/rateLimiter';
import { metricsMiddleware } from '../middleware/metrics';
import authRoutes from '../routes/auth';
import userRoutes from '../routes/users';
import roleRoutes from '../routes/roles';
import permissionRoutes from '../routes/permissions';
import metricsRoutes from '../routes/metrics';

const app = express();

// Middleware de base
app.use(helmet());
app.use(cors({
  origin: process.env['CORS_ORIGINS']?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging et métriques
app.use(correlationIdMiddleware);
app.use(requestLogger);
app.use(metricsMiddleware);

// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/metrics', metricsRoutes);

// Middleware de gestion d'erreurs
app.use(errorHandler);

export { app };