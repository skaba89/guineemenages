// Middleware d'authentification JWT pour GuinéaManager

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import prisma from '../utils/prisma';
import { cache, cacheKeys } from '../utils/redis';
import { AuthenticatedRequest, CompanyInfo } from '../types';
import logger from '../utils/logger';

// Middleware principal d'authentification
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Token d\'authentification requis',
        },
      });
      return;
    }

    const token = authHeader.substring(7);

    // Vérifier le token
    const payload = verifyAccessToken(token);
    
    if (!payload) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token invalide ou expiré',
        },
      });
      return;
    }

    // Récupérer l'utilisateur (avec cache)
    const userId = payload.id || payload.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token invalide',
        },
      });
      return;
    }

    const userCacheKey = cacheKeys.user(userId);
    let user = await cache.get<{
      id: string;
      email: string;
      role: string;
      companyId: string;
      actif: boolean;
    }>(userCacheKey);

    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          companyId: true,
          actif: true,
        },
      });

      if (user) {
        await cache.set(userCacheKey, user, 300); // 5 minutes
      }
    }

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Utilisateur non trouvé',
        },
      });
      return;
    }

    if (!user.actif) {
      res.status(403).json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'Compte utilisateur désactivé',
        },
      });
      return;
    }

    // Récupérer l'entreprise (avec cache)
    const companyCacheKey = cacheKeys.company(user.companyId);
    let company = await cache.get<CompanyInfo>(companyCacheKey);

    if (!company) {
      const dbCompany = await prisma.company.findUnique({
        where: { id: user.companyId },
        select: {
          id: true,
          nom: true,
          devise: true,
          planId: true,
          planAbonnement: {
            select: {
              id: true,
              nom: true,
              maxEmployes: true,
              maxUtilisateurs: true,
              maxClients: true,
              maxFacturesMois: true,
            },
          },
        },
      });

      if (dbCompany) {
        company = {
          id: dbCompany.id,
          nom: dbCompany.nom,
          plan: dbCompany.planId || 'FREE',
          devise: dbCompany.devise,
          planAbonnement: dbCompany.planAbonnement,
        };
        await cache.set(companyCacheKey, company, 300);
      }
    }

    if (!company) {
      res.status(401).json({
        success: false,
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Entreprise non trouvée',
        },
      });
      return;
    }

    // Injecter dans la requête
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      nom: '',
      prenom: '',
      role: user.role,
      companyId: user.companyId,
      actif: user.actif,
    };
    (req as AuthenticatedRequest).company = company;
    (req as AuthenticatedRequest).userId = user.id;
    (req as AuthenticatedRequest).companyId = user.companyId;
    (req as AuthenticatedRequest).userRole = user.role as any;

    next();
  } catch (error) {
    logger.error('Auth middleware error', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Erreur d\'authentification',
      },
    });
  }
};

// Middleware optionnel (n'échoue pas si pas de token)
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    if (!payload) {
      return next();
    }

    const userId = payload.id || payload.userId;
    if (!userId) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
        actif: true,
      },
    });

    if (user && user.actif) {
      const dbCompany = await prisma.company.findUnique({
        where: { id: user.companyId },
        select: {
          id: true,
          nom: true,
          devise: true,
          planId: true,
          planAbonnement: {
            select: {
              id: true,
              nom: true,
              maxEmployes: true,
              maxUtilisateurs: true,
              maxClients: true,
              maxFacturesMois: true,
            },
          },
        },
      });

      if (dbCompany) {
        const company: CompanyInfo = {
          id: dbCompany.id,
          nom: dbCompany.nom,
          plan: dbCompany.planId || 'FREE',
          devise: dbCompany.devise,
          planAbonnement: dbCompany.planAbonnement,
        };
        
        (req as AuthenticatedRequest).user = {
          id: user.id,
          email: user.email,
          nom: '',
          prenom: '',
          role: user.role,
          companyId: user.companyId,
          actif: user.actif,
        };
        (req as AuthenticatedRequest).company = company;
        (req as AuthenticatedRequest).userId = user.id;
        (req as AuthenticatedRequest).companyId = user.companyId;
        (req as AuthenticatedRequest).userRole = user.role as any;
      }
    }

    next();
  } catch {
    next();
  }
};

// Middleware pour vérifier les rôles
export const requireRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = (req as AuthenticatedRequest).userRole;

    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Accès non autorisé pour ce rôle',
        },
      });
      return;
    }

    next();
  };
};

// Alias pour requireRoles (single role)
export const requireRole = (role: string) => requireRoles(role);

// Middleware pour propriétaire uniquement
export const requireOwner = requireRoles('OWNER');

// Middleware pour admin ou propriétaire
export const requireAdmin = requireRoles('OWNER', 'ADMIN');

// Middleware pour comptable ou supérieur
export const requireAccountant = requireRoles('OWNER', 'ADMIN', 'ACCOUNTANT', 'COMPTABLE');

export default authMiddleware;
