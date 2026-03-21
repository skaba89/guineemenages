// Middleware de vérification des limites du plan pour GuinéaManager

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { cache, cacheKeys } from '../utils/redis';
import { AuthenticatedRequest, PLAN_LIMITS } from '../types';
import logger from '../utils/logger';

// Obtenir le nombre de factures du mois en cours
const getInvoiceCountThisMonth = async (companyId: string): Promise<number> => {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const cacheKey = cacheKeys.invoiceCount(companyId, yearMonth);

  // Vérifier le cache
  const cached = await cache.get<number>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Compter en DB
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const count = await prisma.facture.count({
    where: {
      companyId,
      createdAt: { gte: startOfMonth },
    },
  });

  // Cache pour 5 minutes
  await cache.set(cacheKey, count, 300);

  return count;
};

// Obtenir le nombre d'utilisateurs actifs
const getActiveUsersCount = async (companyId: string): Promise<number> => {
  const cached = await cache.get<number>(cacheKeys.companyUsers(companyId));
  if (cached !== null) {
    return cached;
  }

  const count = await prisma.user.count({
    where: {
      companyId,
      isActive: true,
    },
  });

  await cache.set(cacheKeys.companyUsers(companyId), count, 300);

  return count;
};

// Middleware pour vérifier la limite de factures
export const checkInvoiceLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { company } = req as AuthenticatedRequest;
    const limits = PLAN_LIMITS[company.plan as keyof typeof PLAN_LIMITS];

    // Si illimité (-1), passer
    if (limits.maxInvoices === -1) {
      return next();
    }

    const currentCount = await getInvoiceCountThisMonth(company.id);

    if (currentCount >= limits.maxInvoices) {
      res.status(403).json({
        success: false,
        error: {
          code: 'PLAN_LIMIT_REACHED',
          message: `Limite de ${limits.maxInvoices} factures/mois atteinte pour le plan ${company.plan}. Passez à un plan supérieur.`,
          details: {
            currentCount,
            limit: limits.maxInvoices,
            plan: company.plan,
          },
        },
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Check invoice limit error', error);
    next(); // En cas d'erreur, on laisse passer
  }
};

// Middleware pour vérifier la limite d'utilisateurs
export const checkUserLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { company } = req as AuthenticatedRequest;
    const limits = PLAN_LIMITS[company.plan as keyof typeof PLAN_LIMITS];

    // Si illimité (-1), passer
    if (limits.maxUsers === -1) {
      return next();
    }

    const currentCount = await getActiveUsersCount(company.id);

    if (currentCount >= limits.maxUsers) {
      res.status(403).json({
        success: false,
        error: {
          code: 'USER_LIMIT_REACHED',
          message: `Limite de ${limits.maxUsers} utilisateurs atteinte pour le plan ${company.plan}.`,
          details: {
            currentCount,
            limit: limits.maxUsers,
            plan: company.plan,
          },
        },
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Check user limit error', error);
    next();
  }
};

// Middleware pour vérifier les fonctionnalités
export const requireFeature = (feature: keyof typeof PLAN_LIMITS['FREE']['features']) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { company } = req as AuthenticatedRequest;
    const limits = PLAN_LIMITS[company.plan as keyof typeof PLAN_LIMITS];

    if (!limits.features[feature]) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FEATURE_NOT_AVAILABLE',
          message: `La fonctionnalité "${feature}" n'est pas disponible dans votre plan ${company.plan}.`,
          details: {
            feature,
            plan: company.plan,
          },
        },
      });
      return;
    }

    next();
  };
};

// Middleware combiné pour la création de facture
export const planMiddleware = {
  checkInvoiceLimit,
  checkUserLimit,
  requireFeature,
  
  // Vérifier tous les limites pour une action
  checkAllLimits: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { company } = req as AuthenticatedRequest;
      const limits = PLAN_LIMITS[company.plan as keyof typeof PLAN_LIMITS];

      const [invoiceCount, userCount] = await Promise.all([
        getInvoiceCountThisMonth(company.id),
        getActiveUsersCount(company.id),
      ]);

      const warnings: string[] = [];

      // Avertissements si proche des limites
      if (limits.maxInvoices !== -1) {
        const invoicePercentage = (invoiceCount / limits.maxInvoices) * 100;
        if (invoicePercentage >= 80) {
          warnings.push(`Vous avez utilisé ${invoiceCount}/${limits.maxInvoices} factures ce mois.`);
        }
      }

      // Ajouter les infos de limites dans la réponse
      res.locals.planLimits = {
        invoices: {
          used: invoiceCount,
          max: limits.maxInvoices,
        },
        users: {
          used: userCount,
          max: limits.maxUsers,
        },
        features: limits.features,
        warnings,
      };

      next();
    } catch (error) {
      logger.error('Check all limits error', error);
      next();
    }
  },
};

export default planMiddleware;
