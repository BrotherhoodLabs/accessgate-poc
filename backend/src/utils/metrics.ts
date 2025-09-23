import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Collecter les métriques par défaut (CPU, mémoire, etc.)
collectDefaultMetrics();

// Métriques personnalisées
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

export const databaseConnections = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections'
});

export const authAttempts = new Counter({
  name: 'auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['type', 'status'] // type: login/register, status: success/failure
});

export const rbacOperations = new Counter({
  name: 'rbac_operations_total',
  help: 'Total number of RBAC operations',
  labelNames: ['operation', 'resource', 'status'] // operation: create/read/update/delete
});

export const userSessions = new Gauge({
  name: 'user_sessions_active',
  help: 'Number of active user sessions'
});

export const errorRate = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity'] // type: validation/database/auth, severity: low/medium/high
});

// Fonction pour enregistrer les métriques
export const recordHttpRequest = (method: string, route: string, statusCode: number, duration: number) => {
  httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration);
  httpRequestTotal.labels(method, route, statusCode.toString()).inc();
};

export const recordAuthAttempt = (type: 'login' | 'register', status: 'success' | 'failure') => {
  authAttempts.labels(type, status).inc();
};

export const recordRbacOperation = (operation: string, resource: string, status: 'success' | 'failure') => {
  rbacOperations.labels(operation, resource, status).inc();
};

export const recordError = (type: string, severity: 'low' | 'medium' | 'high') => {
  errorRate.labels(type, severity).inc();
};

export const updateActiveConnections = (count: number) => {
  activeConnections.set(count);
};

export const updateDatabaseConnections = (count: number) => {
  databaseConnections.set(count);
};

export const updateUserSessions = (count: number) => {
  userSessions.set(count);
};
