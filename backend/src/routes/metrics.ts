import { Router } from 'express';
import { register } from 'prom-client';

const router = Router();

// Endpoint pour les métriques Prometheus
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error);
  }
});

// Endpoint de santé détaillé avec métriques
router.get('/health/detailed', async (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env['npm_package_version'] || '1.0.0',
      environment: process.env['NODE_ENV'] || 'development',
      metrics: {
        // Ici on pourrait ajouter des métriques personnalisées
        activeConnections: 0, // À implémenter avec un compteur
        totalRequests: 0, // À implémenter avec un compteur
        errorRate: 0, // À implémenter avec un compteur
      }
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
