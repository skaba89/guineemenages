// Contrôleur Rapports pour GuinéaManager

import { Request, Response, NextFunction } from 'express';
import * as rapportService from '../services/rapport.service';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';

// CA mensuel
export const getCaMensuel = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { annee } = req.query;

    const data = await rapportService.getCaMensuel(
      companyId,
      annee ? parseInt(annee as string) : new Date().getFullYear()
    );

    res.json({
      success: true,
      data,
    });
  }
);

// Top clients
export const getTopClients = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { limit, annee } = req.query;

    const data = await rapportService.getTopClients(
      companyId,
      limit ? parseInt(limit as string) : 10,
      annee ? parseInt(annee as string) : undefined
    );

    res.json({
      success: true,
      data,
    });
  }
);

// Bilan simplifié
export const getBilanSimplifie = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { dateDebut, dateFin } = req.query;

    const data = await rapportService.getBilanSimplifie(
      companyId,
      dateDebut ? new Date(dateDebut as string) : undefined,
      dateFin ? new Date(dateFin as string) : undefined
    );

    res.json({
      success: true,
      data,
    });
  }
);

// Export
export const exportDonnees = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { type, format } = req.query;

    if (!type || !['clients', 'factures', 'produits', 'depenses'].includes(type as string)) {
      res.status(400).json({
        success: false,
        error: { message: 'Type d\'export invalide' },
      });
      return;
    }

    const data = await rapportService.exportDonnees(
      companyId,
      type as 'clients' | 'factures' | 'produits' | 'depenses',
      (format as 'json' | 'csv') || 'json'
    );

    const filename = `export-${type}-${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    }

    res.send(data);
  }
);

// Rapport des impayés
export const getRapportImpayes = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;

    const data = await rapportService.getRapportImpayes(companyId);

    res.json({
      success: true,
      data,
    });
  }
);

export default {
  getCaMensuel,
  getTopClients,
  getBilanSimplifie,
  exportDonnees,
  getRapportImpayes,
};
