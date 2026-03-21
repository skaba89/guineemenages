// API Response Helpers for GuinéaManager ERP

import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

/**
 * Send a success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  res.status(statusCode).json(response);
};

/**
 * Send an error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: Record<string, string[]>
): void => {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };
  res.status(statusCode).json(response);
};

/**
 * Send a paginated response
 */
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): void => {
  const totalPages = Math.ceil(total / limit);
  const response: ApiResponse<PaginatedResponse<T>> = {
    success: true,
    data: {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    },
  };
  res.status(200).json(response);
};

/**
 * Send a created response (201)
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Ressource créée avec succès'
): void => {
  sendSuccess(res, data, message, 201);
};

/**
 * Send a no content response (204)
 */
export const sendNoContent = (res: Response): void => {
  res.status(204).send();
};

/**
 * Send a not found response (404)
 */
export const sendNotFound = (
  res: Response,
  message: string = 'Ressource non trouvée'
): void => {
  sendError(res, message, 404);
};

/**
 * Send an unauthorized response (401)
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Non autorisé'
): void => {
  sendError(res, message, 401);
};

/**
 * Send a forbidden response (403)
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Accès interdit'
): void => {
  sendError(res, message, 403);
};

/**
 * Send a validation error response (422)
 */
export const sendValidationError = (
  res: Response,
  errors: Record<string, string[]>,
  message: string = 'Erreurs de validation'
): void => {
  sendError(res, message, 422, errors);
};

/**
 * Send a server error response (500)
 */
export const sendServerError = (
  res: Response,
  message: string = 'Erreur interne du serveur'
): void => {
  sendError(res, message, 500);
};
