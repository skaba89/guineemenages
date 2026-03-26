// Contrôleur Admin pour GuinéaManager

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as adminService from '../services/admin.service';
import { AuthenticatedRequest } from '../types';
import { asyncHandler, ValidationError } from '../middlewares/errorHandler';

// Schémas de validation
const activerPlanSchema = z.object({
  plan: z.enum(['FREE', 'STANDARD', 'ENTERPRISE']),
  dureeMois: z.number().int().min(1).max(36).optional(),
});

// Obtenir les souscriptions
export const getSubscriptions = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { plan, statut, limit, offset } = req.query;

    const result = await adminService.getSubscriptions({
      plan: plan as string,
      statut: statut as string,
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  }
);

// Activer un plan
export const activerPlan = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validated = activerPlanSchema.parse(req.body);
    const { companyId } = req.params;

    const result = await adminService.activerPlan(
      companyId,
      validated.plan,
      validated.dureeMois || 1
    );

    res.json({
      success: true,
      data: result,
    });
  }
);

// Suspendre une souscription
export const suspendreSouscription = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req.params;
    const { raison } = req.body;

    const result = await adminService.suspendreSouscription(companyId, raison);

    res.json({
      success: true,
      data: result,
    });
  }
);

// Obtenir les statistiques globales
export const getStatsGlobales = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await adminService.getStatsGlobales();

    res.json({
      success: true,
      data: stats,
    });
  }
);

// Obtenir les entreprises
export const getEntreprises = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { search, plan, limit, offset } = req.query;

    const result = await adminService.getEntreprises({
      search: search as string,
      plan: plan as string,
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  }
);

// Obtenir les logs d'audit
export const getAuditLogs = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId, userId, action, limit, offset } = req.query;

    const result = await adminService.getAuditLogs({
      companyId: companyId as string,
      userId: userId as string,
      action: action as string,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  }
);

export default {
  getSubscriptions,
  activerPlan,
  suspendreSouscription,
  getStatsGlobales,
  getEntreprises,
  getAuditLogs,
};
