// Contrôleur Employé pour GuinéaManager

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as employeService from '../services/employe.service';
import { AuthenticatedRequest, PaginationInput } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';

// Schémas de validation
const createEmployeSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  telephone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  poste: z.string().optional(),
  banque: z.string().optional(),
  rib: z.string().optional(),
  cnss: z.string().optional(),
  salaireBase: z.number().int().min(0, 'Le salaire doit être positif'),
  indemnites: z.number().int().min(0).optional(),
  primes: z.number().int().min(0).optional(),
  dateEmbauche: z.string().datetime().optional(),
});

const updateEmployeSchema = z.object({
  nom: z.string().min(2).optional(),
  prenom: z.string().min(2).optional(),
  telephone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  poste: z.string().optional(),
  banque: z.string().optional(),
  rib: z.string().optional(),
  cnss: z.string().optional(),
  salaireBase: z.number().int().min(0).optional(),
  indemnites: z.number().int().min(0).optional(),
  primes: z.number().int().min(0).optional(),
  dateEmbauche: z.string().datetime().optional(),
  dateSortie: z.string().datetime().optional().nullable(),
  actif: z.boolean().optional(),
});

// Créer un employé
export const createEmploye = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validated = createEmployeSchema.parse(req.body);
    const { companyId } = req as AuthenticatedRequest;

    const data = {
      ...validated,
      email: validated.email || undefined,
      dateEmbauche: validated.dateEmbauche ? new Date(validated.dateEmbauche) : undefined,
    };

    const employe = await employeService.createEmploye(companyId, data);

    res.status(201).json({
      success: true,
      data: employe,
    });
  }
);

// Obtenir un employé
export const getEmploye = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const employe = await employeService.getEmploye(companyId, id);

    res.json({
      success: true,
      data: employe,
    });
  }
);

// Lister les employés
export const listEmployes = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { page, limit, sortBy, sortOrder, search, actif } = req.query;

    const pagination: PaginationInput & { actif?: boolean } = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      search: search as string,
      actif: actif === 'true' ? true : actif === 'false' ? false : undefined,
    };

    const result = await employeService.listEmployes(companyId, pagination);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  }
);

// Mettre à jour un employé
export const updateEmploye = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validated = updateEmployeSchema.parse(req.body);
    const { companyId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const data = {
      ...validated,
      email: validated.email || undefined,
      dateEmbauche: validated.dateEmbauche ? new Date(validated.dateEmbauche) : undefined,
      dateSortie: validated.dateSortie ? new Date(validated.dateSortie) : validated.dateSortie === null ? null : undefined,
    };

    const employe = await employeService.updateEmploye(companyId, id, data);

    res.json({
      success: true,
      data: employe,
    });
  }
);

// Supprimer un employé
export const deleteEmploye = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const result = await employeService.deleteEmploye(companyId, id);

    res.json({
      success: true,
      data: result,
    });
  }
);

// Obtenir les employés actifs
export const getActiveEmployes = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;

    const employes = await employeService.getActiveEmployes(companyId);

    res.json({
      success: true,
      data: employes,
    });
  }
);

// Obtenir les statistiques
export const getEmployeStats = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;

    const stats = await employeService.getEmployeStats(companyId);

    res.json({
      success: true,
      data: stats,
    });
  }
);

export default {
  createEmploye,
  getEmploye,
  listEmployes,
  updateEmploye,
  deleteEmploye,
  getActiveEmployes,
  getEmployeStats,
};
