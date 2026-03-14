// Error Handling Middleware for GuinéaManager ERP

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { sendError, sendValidationError, sendServerError } from '../utils/response';

/**
 * Custom application error class
 */
export class AppError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 400, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Ressource non trouvée') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Unauthorized error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Non autorisé') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Accès interdit') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Validation error (422)
 */
export class ValidationError extends AppError {
  errors: Record<string, string[]>;

  constructor(message: string = 'Erreurs de validation', errors: Record<string, string[]> = {}) {
    super(message, 422, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflit avec une ressource existante') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Format Zod validation errors
 */
const formatZodErrors = (error: ZodError): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return errors;
};

/**
 * Handle Prisma errors
 */
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = (error.meta?.target as string[])?.join(', ') || 'champ';
      return new ConflictError(`Un enregistrement avec ce ${field} existe déjà`);
    
    case 'P2025':
      // Record not found
      return new NotFoundError('Enregistrement non trouvé');
    
    case 'P2003':
      // Foreign key constraint violation
      return new ValidationError('Référence invalide vers une ressource liée');
    
    case 'P2014':
      // Required relation violation
      return new ValidationError('Relation requise manquante');
    
    case 'P2011':
      // Null constraint violation
      const nullField = (error.meta?.target as string) || 'champ';
      return new ValidationError(`Le champ ${nullField} est requis`);
    
    default:
      return new AppError('Erreur de base de données', 500, 'DATABASE_ERROR');
  }
};

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known error types
  if (error instanceof AppError) {
    if (error instanceof ValidationError) {
      sendValidationError(res, error.errors, error.message);
      return;
    }
    sendError(res, error.message, error.statusCode);
    return;
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const errors = formatZodErrors(error);
    sendValidationError(res, errors, 'Erreurs de validation');
    return;
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const appError = handlePrismaError(error);
    sendError(res, appError.message, appError.statusCode);
    return;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    sendError(res, 'Erreur de validation des données', 400);
    return;
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && 'body' in error) {
    sendError(res, 'JSON invalide dans le corps de la requête', 400);
    return;
  }

  // Handle unknown errors
  sendServerError(res, process.env.NODE_ENV === 'development' ? error.message : undefined);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Route ${req.method} ${req.path} non trouvée`, 404);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
