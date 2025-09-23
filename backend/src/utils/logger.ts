import pino from 'pino';

// Configuration du logger structuré pour Grafana
const loggerConfig: pino.LoggerOptions = {
  level: process.env['LOG_LEVEL'] || 'info',
  formatters: {
    level: (label: string) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    req: (req: any) => ({
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers?.['user-agent'],
        'content-type': req.headers?.['content-type'],
        'authorization': req.headers?.['authorization'] ? '[REDACTED]' : undefined,
      },
      correlationId: req.correlationId,
    }),
    res: (res: any) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
};

// Ajouter le transport seulement en développement
if (process.env['NODE_ENV'] === 'development') {
  loggerConfig.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  };
}

const logger = pino(loggerConfig);

// Logger enrichi avec des métadonnées
export const createLogger = (context?: string) => {
  return logger.child({ 
    context: context || 'app',
    service: 'accessgate-backend',
    version: process.env['npm_package_version'] || '1.0.0',
  });
};

// Logger par défaut
export const appLogger = createLogger();

// Loggers spécialisés
export const authLogger = createLogger('auth');
export const rbacLogger = createLogger('rbac');
export const dbLogger = createLogger('database');
export const apiLogger = createLogger('api');
export const testLogger = createLogger('test');

// Fonctions de logging avec métriques
export const logAuthAttempt = (type: 'login' | 'register', status: 'success' | 'failure', user?: string, error?: Error) => {
  const logData = {
    type,
    status,
    user: user || 'unknown',
    timestamp: new Date().toISOString(),
  };

  if (status === 'success') {
    authLogger.info(logData, `Authentication ${type} successful`);
  } else {
    authLogger.warn({ ...logData, error: error?.message }, `Authentication ${type} failed`);
  }
};

export const logRbacOperation = (operation: string, resource: string, user: string, status: 'success' | 'failure', details?: any) => {
  const logData = {
    operation,
    resource,
    user,
    status,
    details,
    timestamp: new Date().toISOString(),
  };

  if (status === 'success') {
    rbacLogger.info(logData, `RBAC operation ${operation} on ${resource} successful`);
  } else {
    rbacLogger.warn(logData, `RBAC operation ${operation} on ${resource} failed`);
  }
};

export const logDatabaseOperation = (operation: string, table: string, duration: number, status: 'success' | 'failure', error?: Error) => {
  const logData = {
    operation,
    table,
    duration,
    status,
    error: error?.message,
    timestamp: new Date().toISOString(),
  };

  if (status === 'success') {
    dbLogger.info(logData, `Database operation ${operation} on ${table} completed in ${duration}ms`);
  } else {
    dbLogger.error(logData, `Database operation ${operation} on ${table} failed`);
  }
};

export const logApiRequest = (method: string, path: string, statusCode: number, duration: number, user?: string) => {
  const logData = {
    method,
    path,
    statusCode,
    duration,
    user: user || 'anonymous',
    timestamp: new Date().toISOString(),
  };

  if (statusCode >= 400) {
    apiLogger.warn(logData, `API request ${method} ${path} returned ${statusCode}`);
  } else {
    apiLogger.info(logData, `API request ${method} ${path} completed`);
  }
};

export const logError = (error: Error, context: string, severity: 'low' | 'medium' | 'high' = 'medium', metadata?: any) => {
  const logData = {
    error: error.message,
    stack: error.stack,
    context,
    severity,
    metadata,
    timestamp: new Date().toISOString(),
  };

  switch (severity) {
    case 'low':
      appLogger.warn(logData, `Low severity error in ${context}`);
      break;
    case 'medium':
      appLogger.error(logData, `Medium severity error in ${context}`);
      break;
    case 'high':
      appLogger.fatal(logData, `High severity error in ${context}`);
      break;
  }
};

export const logTestResult = (testName: string, status: 'pass' | 'fail', duration: number, details?: any) => {
  const logData = {
    testName,
    status,
    duration,
    details,
    timestamp: new Date().toISOString(),
  };

  if (status === 'pass') {
    testLogger.info(logData, `Test ${testName} passed in ${duration}ms`);
  } else {
    testLogger.error(logData, `Test ${testName} failed in ${duration}ms`);
  }
};

export default logger;