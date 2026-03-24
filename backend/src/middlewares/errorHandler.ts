// Middleware de gestion d'erreurs pour GuinéaManager

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import logger from '../utils/logger';
import { config } from '../utils/config';

// Interface pour les erreurs personnalisées
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, unknown>;
  public isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Erreurs prédéfinies
export class NotFoundError extends AppError {
  constructor(resource: string = 'Ressource') {
    super(404, 'NOT_FOUND', `${resource} non trouvé(e)`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Non autorisé') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Accès interdit') {
    super(403, 'FORBIDDEN', message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message: string = 'Paiement requis') {
    super(402, 'PAYMENT_REQUIRED', message);
  }
}

// Middleware de gestion d'erreurs
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log l'erreur
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: config.nodeEnv === 'development' ? req.body : undefined,
    query: req.query,
    params: req.params,
    userId: (req as any).userId,
  });

  // Erreurs Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(error, res);
    return;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_VALIDATION_ERROR',
        message: 'Erreur de validation des données',
      },
    });
    return;
  }

  // Erreurs Zod
  if (error instanceof ZodError) {
    const errors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Données invalides',
        details: { errors },
      },
    });
    return;
  }

  // Erreurs personnalisées
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  // Erreur JSON parsing
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'JSON invalide dans le corps de la requête',
      },
    });
    return;
  }

  // Erreur générique
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.nodeEnv === 'production' 
        ? 'Une erreur interne est survenue' 
        : error.message,
    },
  });
};

// Gestion des erreurs Prisma
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError, res: Response): void => {
  switch (error.code) {
    case 'P2002': // Unique constraint violation
      const target = error.meta?.target as string[] | undefined;
      const field = target?.[0] || 'champ';
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: `Un enregistrement avec ce ${field} existe déjà`,
          details: { field },
        },
      });
      break;

    case 'P2025': // Record not found
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Enregistrement non trouvé',
        },
      });
      break;

    case 'P2003': // Foreign key constraint violation
      res.status(400).json({
        success: false,
        error: {
          code: 'FOREIGN_KEY_ERROR',
          message: 'Référence invalide vers une autre entité',
        },
      });
      break;

    case 'P2014': // Required relation violation
      res.status(400).json({
        success: false,
        error: {
          code: 'RELATION_ERROR',
          message: 'Relation requise manquante',
        },
      });
      break;

    case 'P2016': // Query interpretation error
      res.status(400).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: 'Erreur de requête',
        },
      });
      break;

    default:
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Erreur de base de données',
        },
      });
  }
};

// Middleware pour capturer les routes non trouvées
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} non trouvée`,
    },
  });
};

// Wrapper pour les handlers async
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;
