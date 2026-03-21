// Contrôleur Client pour GuinéaManager

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as clientService from '../services/client.service';
import { AuthenticatedRequest, PaginationInput } from '../types';
import { asyncHandler, ValidationError } from '../middlewares/errorHandler';

// Schémas de validation
const createClientSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  telephone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  adresse: z.string().optional(),
  notes: z.string().optional(),
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
    const { companyId } = req as AuthenticatedRequest;

    // Nettoyer l'email vide
    const data = {
      ...validated,
      email: validated.email || undefined,
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
    const { companyId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const client = await clientService.getClient(companyId, id);

    res.json({
      success: true,
      data: client,
    });
  }
);

// Lister les clients
export const listClients = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { page, limit, sortBy, sortOrder, search } = req.query;

    const pagination: PaginationInput = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      search: search as string,
    };

    const result = await clientService.listClients(companyId, pagination);

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
    const { companyId } = req as AuthenticatedRequest;
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
    const { companyId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const result = await clientService.deleteClient(companyId, id);

    res.json({
      success: true,
      data: result,
    });
  }
);

// Obtenir les factures d'un client
export const getClientInvoices = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { id } = req.params;
    const { page, limit, sortBy, sortOrder } = req.query;

    const pagination: PaginationInput = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await clientService.getClientInvoices(companyId, id, pagination);

    res.json({
      success: true,
      data: result.data,
      client: result.client,
      pagination: result.pagination,
    });
  }
);

// Obtenir les clients avec solde dû
export const getClientsWithBalance = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;

    const clients = await clientService.getClientsWithBalance(companyId);

    res.json({
      success: true,
      data: clients,
    });
  }
);

export default {
  createClient,
  getClient,
  listClients,
  updateClient,
  deleteClient,
  getClientInvoices,
  getClientsWithBalance,
};
