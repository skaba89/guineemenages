// Contrôleur Facture pour GuinéaManager

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as factureService from '../services/facture.service';
import { AuthenticatedRequest, PaginationInput } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';

// Schémas de validation
const ligneFactureSchema = z.object({
  produitId: z.string().optional(),
  designation: z.string().min(1, 'La désignation est requise'),
  description: z.string().optional(),
  quantite: z.number().int().positive('La quantité doit être positive'),
  prixUnitaire: z.number().int().min(0, 'Le prix unitaire doit être positif'),
});

const createFactureSchema = z.object({
  clientId: z.string().min(1, 'Le client est requis'),
  date: z.string().datetime().optional(),
  echeance: z.string().datetime().optional(),
  notes: z.string().optional(),
  conditions: z.string().optional(),
  lignes: z.array(ligneFactureSchema).min(1, 'Au moins une ligne est requise'),
  offlineId: z.string().optional(),
});

const updateFactureSchema = z.object({
  clientId: z.string().optional(),
  date: z.string().datetime().optional(),
  echeance: z.string().datetime().optional(),
  notes: z.string().optional(),
  conditions: z.string().optional(),
  lignes: z.array(ligneFactureSchema).min(1, 'Au moins une ligne est requise').optional(),
});

const paiementSchema = z.object({
  montant: z.number().int().positive('Le montant doit être positif'),
  mode: z.enum(['CASH', 'ORANGE_MONEY', 'MTN', 'VIREMENT', 'CHEQUE', 'CARTE']),
  reference: z.string().optional(),
  referenceMobile: z.string().optional(),
  notes: z.string().optional(),
  offlineId: z.string().optional(),
});

// Créer une facture
export const createFacture = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validated = createFactureSchema.parse(req.body);
    const { companyId, userId } = req as AuthenticatedRequest;

    // Convertir les dates
    const data = {
      ...validated,
      date: validated.date ? new Date(validated.date) : undefined,
      echeance: validated.echeance ? new Date(validated.echeance) : undefined,
    };

    const facture = await factureService.createFacture(companyId, userId, data);

    res.status(201).json({
      success: true,
      data: facture,
    });
  }
);

// Obtenir une facture
export const getFacture = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const facture = await factureService.getFacture(companyId, id);

    res.json({
      success: true,
      data: facture,
    });
  }
);

// Lister les factures
export const listFactures = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { page, limit, sortBy, sortOrder, search, statut, clientId } = req.query;

    const pagination: PaginationInput & { statut?: string; clientId?: string } = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      search: search as string,
      statut: statut as string,
      clientId: clientId as string,
    };

    const result = await factureService.listFactures(companyId, pagination);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  }
);

// Mettre à jour une facture
export const updateFacture = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validated = updateFactureSchema.parse(req.body);
    const { companyId, userId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const data = {
      ...validated,
      date: validated.date ? new Date(validated.date) : undefined,
      echeance: validated.echeance ? new Date(validated.echeance) : undefined,
    };

    const facture = await factureService.updateFacture(companyId, userId, id, data);

    res.json({
      success: true,
      data: facture,
    });
  }
);

// Supprimer une facture
export const deleteFacture = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId, userId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const result = await factureService.deleteFacture(companyId, userId, id);

    res.json({
      success: true,
      data: result,
    });
  }
);

// Envoyer une facture
export const sendFacture = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId, userId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const facture = await factureService.sendFacture(companyId, userId, id);

    res.json({
      success: true,
      data: facture,
    });
  }
);

// Générer le PDF d'une facture
export const getFacturePdf = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const pdfBuffer = await factureService.generatePdf(companyId, id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="facture-${id}.pdf"`);
    res.send(pdfBuffer);
  }
);

// Enregistrer un paiement
export const recordPayment = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validated = paiementSchema.parse(req.body);
    const { companyId, userId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const paiement = await factureService.recordPayment(companyId, userId, id, validated);

    res.status(201).json({
      success: true,
      data: paiement,
    });
  }
);

// Annuler une facture
export const cancelFacture = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId, userId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const result = await factureService.cancelFacture(companyId, userId, id);

    res.json({
      success: true,
      data: result,
    });
  }
);

export default {
  createFacture,
  getFacture,
  listFactures,
  updateFacture,
  deleteFacture,
  sendFacture,
  getFacturePdf,
  recordPayment,
  cancelFacture,
};
