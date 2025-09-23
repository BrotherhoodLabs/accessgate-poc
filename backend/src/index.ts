import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { correlationIdMiddleware } from './utils/correlationId';
import { requestLogger, appLogger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { metricsMiddleware } from './middleware/metrics';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import roleRoutes from './routes/roles';
import permissionRoutes from './routes/permissions';
import metricsRoutes from './routes/metrics';
import { swaggerSpec } from './config/swagger';
import swaggerUi from 'swagger-ui-express';

const app = express();
const PORT = process.env['PORT'] || 8000;

// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: process.env['CORS_ORIGINS']?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/metrics', metricsRoutes);

// Middleware de gestion d'erreurs
app.use(errorHandler);

// Gestionnaire 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  appLogger.info(`🚀 AccessGate Backend API démarré sur le port ${PORT}`);
  appLogger.info(`📊 Métriques disponibles sur http://localhost:${PORT}/api/metrics/metrics`);
  appLogger.info(`📚 Documentation API disponible sur http://localhost:${PORT}/api-docs`);
  appLogger.info(`🏥 Health check disponible sur http://localhost:${PORT}/health`);
});

// Gestion des signaux de fermeture
process.on('SIGTERM', () => {
  appLogger.info('SIGTERM reçu, fermeture gracieuse du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  appLogger.info('SIGINT reçu, fermeture gracieuse du serveur...');
  process.exit(0);
});

export default app;
