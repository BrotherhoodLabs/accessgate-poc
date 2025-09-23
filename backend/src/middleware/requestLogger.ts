import { Request, Response, NextFunction } from 'express';
import pinoHttp from 'pino-http';
import logger from '../utils/logger';
import { RequestWithCorrelationId } from './correlationId';

export const requestLogger = pinoHttp({
  logger,
  serializers: {
    req: (req: RequestWithCorrelationId) => ({
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-correlation-id': req.headers['x-correlation-id'],
      },
      remoteAddress: req.connection?.remoteAddress,
    }),
    res: (res: Response) => ({
      statusCode: res.statusCode,
      headers: res.getHeaders(),
    }),
  },
  customLogLevel: (req: RequestWithCorrelationId, res: Response, err?: Error) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    }
    return 'info';
  },
  customSuccessMessage: (req: RequestWithCorrelationId, res: Response) => {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
  customErrorMessage: (req: RequestWithCorrelationId, res: Response, err: Error) => {
    return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
  },
});
