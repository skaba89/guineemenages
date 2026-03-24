// Contrôleur Client pour GuinéaManager

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as clientService from '../services/client.service';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';

// Schémas de validation
const createClientSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  telephone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  adresse: z.string().optional(),
  notes: z.string().optional(),
  pays: z.string().optional(),
  type: z.enum(['PARTICULIER', 'ENTREPRISE']).optional(),
});

const updateClientSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  telephone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  adresse: z.string().optional(),
  notes: z.string().optional(),
});

// Créer un client
export const createClient = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validated = createClientSchema.parse(req.body);
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.companyId!;

    // Nettoyer l'email vide et préparer les données
    const data = {
      nom: validated.nom,
      telephone: validated.telephone,
      email: validated.email || undefined,
      adresse: validated.adresse,
      notes: validated.notes,
      pays: validated.pays || 'Guinée',
      type: validated.type || 'PARTICULIER',
    };

    const client = await clientService.createClient(companyId, data);

    res.status(201).json({
      success: true,
      data: client,
    });
  }
);

// Obtenir un client
export const getClient = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.companyId!;
    const { id } = req.params;

    const client = await clientService.getClientById(companyId, id);

    res.json({
      success: true,
      data: client,
    });
  }
);

// Lister les clients
export const listClients = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.companyId!;
    const { page, limit, search, type } = req.query;

    const result = await clientService.getClients(companyId, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      search: search as string,
      type: type as 'PARTICULIER' | 'ENTREPRISE' | undefined,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  }
);

// Mettre à jour un client
export const updateClient = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validated = updateClientSchema.parse(req.body);
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.companyId!;
    const { id } = req.params;

    // Nettoyer l'email vide
    const data = {
      ...validated,
      email: validated.email || undefined,
    };

    const client = await clientService.updateClient(companyId, id, data);

    res.json({
      success: true,
      data: client,
    });
  }
);

// Supprimer un client
export const deleteClient = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.companyId!;
    const { id } = req.params;

    const result = await clientService.deleteClient(companyId, id);

    res.json({
      success: true,
      data: result,
    });
  }
);

// Obtenir les statistiques clients
export const getClientStats = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.companyId!;

    const stats = await clientService.getClientStats(companyId);

    res.json({
      success: true,
      data: stats,
    });
  }
);

export default {
  createClient,
  getClient,
  listClients,
  updateClient,
  deleteClient,
  getClientStats,
};
