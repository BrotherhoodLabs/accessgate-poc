import { Request, Response, NextFunction } from 'express';

export interface RequestWithCorrelation extends Request {
  correlationId: string;
}

// Fonction simple pour générer un UUID v4 compatible
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Générer ou récupérer l'ID de corrélation depuis les headers
  const correlationId = req.headers['x-correlation-id'] as string || generateUUID();
  
  // Ajouter l'ID de corrélation à la requête
  (req as RequestWithCorrelation).correlationId = correlationId;
  
  // Ajouter l'ID de corrélation aux headers de réponse
  res.set('x-correlation-id', correlationId);
  
  next();
};
