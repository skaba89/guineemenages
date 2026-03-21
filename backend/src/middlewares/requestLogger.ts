// Middleware de logging des requêtes pour GuinéaManager

import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Étendre la réponse pour stocker le temps de début
declare module 'express-serve-static-core' {
  interface Response {
    startTime?: number;
    requestId?: string;
  }
}

// Format personnalisé Morgan
morgan.token('id', (req: Request) => (req as any).id);
morgan.token('userId', (req: Request) => (req as any).userId || 'anonymous');
morgan.token('companyId', (req: Request) => (req as any).companyId || 'none');
morgan.token('response-time-ms', (_req: Request, res: Response) => {
  if (!res.startTime) return '0';
  return String(Date.now() - res.startTime);
});

// Format de log
const logFormat = ':id :method :url :status :response-time-ms ms - userId=:userId companyId=:companyId';

// Stream Morgan vers Winston
const stream = {
  write: (message: string) => {
    const trimmed = message.trim();
    const statusCode = parseInt(trimmed.split(' ')[3], 10);
    
    if (statusCode >= 500) {
      logger.error(trimmed);
    } else if (statusCode >= 400) {
      logger.warn(trimmed);
    } else {
      logger.http(trimmed);
    }
  },
};

// Middleware Morgan
export const requestLogger = morgan(logFormat, { stream });

// Middleware pour ajouter un ID unique à chaque requête
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = uuidv4();
  (req as any).id = requestId;
  res.setHeader('X-Request-Id', requestId);
  res.startTime = Date.now();
  next();
};

// Middleware pour logger le corps des requêtes en développement
export const requestBodyLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (process.env.NODE_ENV === 'development') {
    const { method, path, body, query, params } = req;
    
    // Ne pas logger les mots de passe
    const sanitizedBody = { ...body };
    if (sanitizedBody.password) {
      sanitizedBody.password = '***';
    }
    if (sanitizedBody.passwordHash) {
      sanitizedBody.passwordHash = '***';
    }

    logger.debug('Incoming request', {
      method,
      path,
      query: Object.keys(query).length > 0 ? query : undefined,
      params: Object.keys(params).length > 0 ? params : undefined,
      body: Object.keys(sanitizedBody).length > 0 ? sanitizedBody : undefined,
    });
  }

  next();
};

// Middleware pour logger les réponses
export const responseLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Sauvegarder les méthodes originales
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  // Intercepter res.json
  res.json = (body: unknown): Response => {
    const duration = res.startTime ? Date.now() - res.startTime : 0;
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Response', {
        requestId: (req as any).id,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        bodyPreview: typeof body === 'object' ? JSON.stringify(body).substring(0, 500) : String(body).substring(0, 500),
      });
    }

    return originalJson(body);
  };

  // Intercepter res.send
  res.send = (body: unknown): Response => {
    const duration = res.startTime ? Date.now() - res.startTime : 0;
    
    if (process.env.NODE_ENV === 'development' && typeof body === 'string') {
      logger.debug('Response sent', {
        requestId: (req as any).id,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        type: 'html/text',
      });
    }

    return originalSend(body);
  };

  next();
};

// Logger les erreurs de parsing JSON
export const jsonErrorLogger = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof SyntaxError && 'body' in error) {
    logger.warn('JSON parsing error', {
      requestId: (req as any).id,
      path: req.path,
      method: req.method,
      error: error.message,
    });
  }
  next(error);
};

// Export combiné
export const loggingMiddleware = [
  requestIdMiddleware,
  requestLogger,
  requestBodyLogger,
  responseLogger,
];

export default loggingMiddleware;
