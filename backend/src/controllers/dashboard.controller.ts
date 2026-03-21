// Contrôleur Dashboard pour GuinéaManager

import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';

// Obtenir les statistiques principales
export const getStats = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;

    const stats = await dashboardService.getDashboardStats(companyId);

    res.json({
      success: true,
      data: stats,
    });
  }
);

// Obtenir les données CA mensuel
export const getCaMensuel = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const data = await dashboardService.getCaMensuelData(companyId, year);

    res.json({
      success: true,
      data,
    });
  }
);

// Obtenir les dernières factures
export const getRecentInvoices = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const limit = parseInt(req.query.limit as string) || 5;

    const invoices = await dashboardService.getRecentInvoices(companyId, limit);

    res.json({
      success: true,
      data: invoices,
    });
  }
);

// Obtenir les alertes de stock
export const getStockAlerts = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;

    const alerts = await dashboardService.getStockAlerts(companyId);

    res.json({
      success: true,
      data: alerts,
    });
  }
);

// Obtenir les factures en retard
export const getOverdueInvoices = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;

    const invoices = await dashboardService.getOverdueInvoices(companyId);

    res.json({
      success: true,
      data: invoices,
    });
  }
);

// Obtenir les top clients
export const getTopClients = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const limit = parseInt(req.query.limit as string) || 5;

    const clients = await dashboardService.getTopClients(companyId, limit);

    res.json({
      success: true,
      data: clients,
    });
  }
);

// Obtenir toutes les données du dashboard en une seule requête
export const getFullDashboard = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const [stats, caMensuel, recentInvoices, stockAlerts, overdueInvoices, topClients] = 
      await Promise.all([
        dashboardService.getDashboardStats(companyId),
        dashboardService.getCaMensuelData(companyId, year),
        dashboardService.getRecentInvoices(companyId, 5),
        dashboardService.getStockAlerts(companyId),
        dashboardService.getOverdueInvoices(companyId),
        dashboardService.getTopClients(companyId, 5),
      ]);

    res.json({
      success: true,
      data: {
        stats,
        caMensuel,
        recentInvoices,
        stockAlerts,
        overdueInvoices,
        topClients,
      },
    });
  }
);

export default {
  getStats,
  getCaMensuel,
  getRecentInvoices,
  getStockAlerts,
  getOverdueInvoices,
  getTopClients,
  getFullDashboard,
};
