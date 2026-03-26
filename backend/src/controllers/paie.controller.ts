// Contrôleur Paie pour GuinéaManager

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as paieService from '../services/paie.service';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';

// Schémas de validation
const genererBulletinSchema = z.object({
  employeId: z.string().min(1, 'L\'employé est requis'),
  mois: z.number().int().min(1).max(12),
  annee: z.number().int().min(2020).max(2100),
  indemnites: z.number().int().min(0).optional(),
  primes: z.number().int().min(0).optional(),
  autresDeductions: z.number().int().min(0).optional(),
});

const payerBulletinSchema = z.object({
  modePaiement: z.enum(['CASH', 'ORANGE_MONEY', 'MTN', 'VIREMENT', 'CHEQUE']).optional(),
});

// Générer un bulletin
export const genererBulletin = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validated = genererBulletinSchema.parse(req.body);
    const { companyId, userId } = req as AuthenticatedRequest;

    const bulletin = await paieService.genererBulletin(companyId, userId, validated);

    res.status(201).json({
      success: true,
      data: bulletin,
    });
  }
);

// Valider un bulletin
export const validerBulletin = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId, userId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const bulletin = await paieService.validerBulletin(companyId, userId, id);

    res.json({
      success: true,
      data: bulletin,
    });
  }
);

// Payer un bulletin
export const payerBulletin = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validated = payerBulletinSchema.parse(req.body);
    const { companyId, userId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const bulletin = await paieService.payerBulletin(
      companyId,
      userId,
      id,
      validated.modePaiement
    );

    res.json({
      success: true,
      data: bulletin,
    });
  }
);

// Obtenir un bulletin
export const getBulletin = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const bulletin = await paieService.getBulletin(companyId, id);

    res.json({
      success: true,
      data: bulletin,
    });
  }
);

// Historique d'un employé
export const getHistoriqueEmploye = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { employeId } = req.params;

    const bulletins = await paieService.getHistoriqueEmploye(companyId, employeId);

    res.json({
      success: true,
      data: bulletins,
    });
  }
);

// Bulletins d'une période
export const listBulletinsPeriode = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { mois, annee } = req.query;

    const bulletins = await paieService.listBulletinsPeriode(
      companyId,
      parseInt(mois as string) || new Date().getMonth() + 1,
      parseInt(annee as string) || new Date().getFullYear()
    );

    res.json({
      success: true,
      data: bulletins,
    });
  }
);

// Générer les bulletins en masse
export const genererBulletinsMasse = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId, userId } = req as AuthenticatedRequest;
    const { mois, annee } = req.body;

    const result = await paieService.genererBulletinsMasse(
      companyId,
      userId,
      mois,
      annee
    );

    res.json({
      success: true,
      data: result,
    });
  }
);

// Obtenir le PDF
export const getBulletinPdf = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const pdfBuffer = await paieService.generateBulletinPdf(companyId, id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bulletin-paie-${id}.pdf"`);
    res.send(pdfBuffer);
  }
);

// Statistiques de paie
export const getPaieStats = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { mois, annee } = req.query;

    const stats = await paieService.getPaieStats(
      companyId,
      parseInt(mois as string) || new Date().getMonth() + 1,
      parseInt(annee as string) || new Date().getFullYear()
    );

    res.json({
      success: true,
      data: stats,
    });
  }
);

export default {
  genererBulletin,
  validerBulletin,
  payerBulletin,
  getBulletin,
  getHistoriqueEmploye,
  listBulletinsPeriode,
  genererBulletinsMasse,
  getBulletinPdf,
  getPaieStats,
};
