// Contrôleur Dashboard pour GuinéaManager

import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';

// Obtenir les statistiques principales
export const getStats = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.companyId!;

    const stats = await dashboardService.getDashboardStats(companyId);

    res.json({
      success: true,
      data: stats,
    });
  }
);

// Obtenir les données mensuelles
export const getMonthlyStats = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.companyId!;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const data = await dashboardService.getMonthlyStats(companyId, year);

    res.json({
      success: true,
      data,
    });
  }
);

// Obtenir le résumé des factures
export const getFactureSummary = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.companyId!;

    const summary = await dashboardService.getFactureSummary(companyId);

    res.json({
      success: true,
      data: summary,
    });
  }
);

// Obtenir les top clients
export const getTopClients = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.companyId!;
    const limit = parseInt(req.query.limit as string) || 5;

    const clients = await dashboardService.getTopClients(companyId, limit);

    res.json({
      success: true,
      data: clients,
    });
  }
);

// Obtenir les activités récentes
export const getRecentActivities = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.companyId!;
    const limit = parseInt(req.query.limit as string) || 10;

    const activities = await dashboardService.getRecentActivities(companyId, limit);

    res.json({
      success: true,
      data: activities,
    });
  }
);

// Obtenir l'aperçu financier
export const getFinancialOverview = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.companyId!;

    const overview = await dashboardService.getFinancialOverview(companyId);

    res.json({
      success: true,
      data: overview,
    });
  }
);

// Obtenir les alertes
export const getAlerts = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.companyId!;

    const alerts = await dashboardService.getAlerts(companyId);

    res.json({
      success: true,
      data: alerts,
    });
  }
);

// Obtenir toutes les données du dashboard en une seule requête
export const getFullDashboard = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.companyId!;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const [stats, monthlyStats, factureSummary, topClients, recentActivities, financialOverview, alerts] = 
      await Promise.all([
        dashboardService.getDashboardStats(companyId),
        dashboardService.getMonthlyStats(companyId, year),
        dashboardService.getFactureSummary(companyId),
        dashboardService.getTopClients(companyId, 5),
        dashboardService.getRecentActivities(companyId, 10),
        dashboardService.getFinancialOverview(companyId),
        dashboardService.getAlerts(companyId),
      ]);

    res.json({
      success: true,
      data: {
        stats,
        monthlyStats,
        factureSummary,
        topClients,
        recentActivities,
        financialOverview,
        alerts,
      },
    });
  }
);

export default {
  getStats,
  getMonthlyStats,
  getFactureSummary,
  getTopClients,
  getRecentActivities,
  getFinancialOverview,
  getAlerts,
  getFullDashboard,
};
