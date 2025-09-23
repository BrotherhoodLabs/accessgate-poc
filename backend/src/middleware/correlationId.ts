import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithCorrelationId extends Request {
  correlationId?: string;
}

export const correlationIdMiddleware = (
  req: RequestWithCorrelationId,
  res: Response,
  next: NextFunction
): void => {
  // Get correlation ID from header or generate new one
  const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  
  // Add to request object
  req.correlationId = correlationId;
  
  // Add to response headers
  res.set('X-Correlation-ID', correlationId);
  
  next();
};
