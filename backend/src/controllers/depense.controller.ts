// Contrôleur Dépense pour GuinéaManager

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as depenseService from '../services/depense.service';
import { AuthenticatedRequest, PaginationInput } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';

// Schémas de validation
const createDepenseSchema = z.object({
  categorie: z.enum(['ACHAT', 'LOYER', 'SALAIRES', 'UTILITIES', 'TRANSPORT', 'COMMUNICATION', 'FOURNITURES', 'SERVICES', 'IMPOTS', 'AUTRES']),
  montant: z.number().int().positive('Le montant doit être positif'),
  date: z.string().datetime().optional(),
  description: z.string().optional(),
  fournisseurId: z.string().optional(),
  justificatifUrl: z.string().url().optional(),
  modePaiement: z.enum(['CASH', 'ORANGE_MONEY', 'MTN', 'VIREMENT', 'CHEQUE', 'CARTE']).optional(),
  reference: z.string().optional(),
  offlineId: z.string().optional(),
});

const updateDepenseSchema = z.object({
  categorie: z.enum(['ACHAT', 'LOYER', 'SALAIRES', 'UTILITIES', 'TRANSPORT', 'COMMUNICATION', 'FOURNITURES', 'SERVICES', 'IMPOTS', 'AUTRES']).optional(),
  montant: z.number().int().positive('Le montant doit être positif').optional(),
  date: z.string().datetime().optional(),
  description: z.string().optional(),
  fournisseurId: z.string().optional().nullable(),
  justificatifUrl: z.string().url().optional(),
  modePaiement: z.enum(['CASH', 'ORANGE_MONEY', 'MTN', 'VIREMENT', 'CHEQUE', 'CARTE']).optional(),
  reference: z.string().optional(),
});

// Créer une dépense
export const createDepense = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validated = createDepenseSchema.parse(req.body);
    const { companyId, userId } = req as AuthenticatedRequest;

    const data = {
      ...validated,
      date: validated.date ? new Date(validated.date) : undefined,
    };

    const depense = await depenseService.createDepense(companyId, userId, data);

    res.status(201).json({
      success: true,
      data: depense,
    });
  }
);

// Obtenir une dépense
export const getDepense = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const depense = await depenseService.getDepense(companyId, id);

    res.json({
      success: true,
      data: depense,
    });
  }
);

// Lister les dépenses
export const listDepenses = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { page, limit, sortBy, sortOrder, search, categorie, dateDebut, dateFin } = req.query;

    const pagination: PaginationInput & { 
      categorie?: string; 
      dateDebut?: Date; 
      dateFin?: Date;
    } = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      search: search as string,
      categorie: categorie as string,
      dateDebut: dateDebut ? new Date(dateDebut as string) : undefined,
      dateFin: dateFin ? new Date(dateFin as string) : undefined,
    };

    const result = await depenseService.listDepenses(companyId, pagination);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  }
);

// Mettre à jour une dépense
export const updateDepense = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validated = updateDepenseSchema.parse(req.body);
    const { companyId, userId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const data = {
      ...validated,
      date: validated.date ? new Date(validated.date) : undefined,
    };

    const depense = await depenseService.updateDepense(companyId, userId, id, data);

    res.json({
      success: true,
      data: depense,
    });
  }
);

// Supprimer une dépense
export const deleteDepense = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId, userId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const result = await depenseService.deleteDepense(companyId, userId, id);

    res.json({
      success: true,
      data: result,
    });
  }
);

// Statistiques par catégorie
export const getStatsParCategorie = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { dateDebut, dateFin } = req.query;

    const stats = await depenseService.getStatsParCategorie(
      companyId,
      dateDebut ? new Date(dateDebut as string) : undefined,
      dateFin ? new Date(dateFin as string) : undefined
    );

    res.json({
      success: true,
      data: stats,
    });
  }
);

// Statistiques mensuelles
export const getStatsMensuelles = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { annee } = req.query;

    const stats = await depenseService.getStatsMensuelles(
      companyId,
      annee ? parseInt(annee as string) : new Date().getFullYear()
    );

    res.json({
      success: true,
      data: stats,
    });
  }
);

// Total des dépenses
export const getTotalDepenses = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { dateDebut, dateFin } = req.query;

    const total = await depenseService.getTotalDepenses(
      companyId,
      dateDebut ? new Date(dateDebut as string) : undefined,
      dateFin ? new Date(dateFin as string) : undefined
    );

    res.json({
      success: true,
      data: total,
    });
  }
);

export default {
  createDepense,
  getDepense,
  listDepenses,
  updateDepense,
  deleteDepense,
  getStatsParCategorie,
  getStatsMensuelles,
  getTotalDepenses,
};
