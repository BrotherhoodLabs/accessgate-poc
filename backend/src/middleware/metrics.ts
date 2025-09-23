import { Request, Response, NextFunction } from 'express';
import { recordHttpRequest } from '../utils/metrics';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const method = req.method;
    const route = req.route?.path || req.path;
    const statusCode = res.statusCode;
    
    recordHttpRequest(method, route, statusCode, duration);
  });
  
  next();
};
