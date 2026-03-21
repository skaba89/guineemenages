// Auth Controller for GuinéaManager ERP

import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { loginSchema, registerSchema } from '../utils/validation';
import { sendSuccess, sendCreated, sendError } from '../utils/response';
import { asyncHandler } from '../middlewares/error.middleware';
import { ZodError } from 'zod';

/**
 * Register a new user with a new company
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = registerSchema.parse(req.body);
  const companyNom = req.body.companyNom || 'Mon Entreprise';

  const { user, token } = await authService.registerWithCompany({
    ...validatedData,
    companyNom,
  });

  sendCreated(res, { user, token }, 'Compte créé avec succès');
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = loginSchema.parse(req.body);
  const { user, token } = await authService.login(validatedData);

  sendSuccess(res, { user, token }, 'Connexion réussie');
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await authService.getCurrentUser(userId);

  sendSuccess(res, user);
});

/**
 * Update user password
 * PUT /api/auth/password
 */
export const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    sendError(res, 'Mot de passe actuel et nouveau mot de passe requis', 400);
    return;
  }

  if (newPassword.length < 8) {
    sendError(res, 'Le nouveau mot de passe doit contenir au moins 8 caractères', 400);
    return;
  }

  await authService.updatePassword(userId, currentPassword, newPassword);

  sendSuccess(res, null, 'Mot de passe mis à jour avec succès');
});

/**
 * Logout (client-side token invalidation)
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // In a stateless JWT system, logout is handled client-side
  // by removing the token from storage
  sendSuccess(res, null, 'Déconnexion réussie');
});

/**
 * Verify token validity
 * GET /api/auth/verify
 */
export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
  // If we reach here, the token is valid (middleware already verified)
  sendSuccess(res, { valid: true, user: req.user });
});
