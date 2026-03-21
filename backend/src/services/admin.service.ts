// Service Admin pour GuinéaManager

import prisma from '../utils/prisma';
import { cache } from '../utils/redis';
import { NotFoundError, ConflictError } from '../middlewares/errorHandler';

// Obtenir toutes les souscriptions
export const getSubscriptions = async (options?: {
  plan?: string;
  statut?: string;
  limit?: number;
  offset?: number;
}) => {
  const { plan, statut, limit = 20, offset = 0 } = options || {};

  const where = {
    ...(plan && { plan: plan as any }),
    ...(statut && { statut }),
  };

  const [total, subscriptions] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
  ]);

  return {
    data: subscriptions,
    total,
    limit,
    offset,
  };
};

// Activer un plan pour une entreprise
export const activerPlan = async (
  companyId: string,
  plan: 'FREE' | 'STANDARD' | 'ENTERPRISE',
  dureeMois: number = 1
) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { subscription: true },
  });

  if (!company) {
    throw new NotFoundError('Entreprise');
  }

  // Définir les limites selon le plan
  const planLimits = {
    FREE: { maxUsers: 1, maxInvoices: 50 },
    STANDARD: { maxUsers: 5, maxInvoices: -1 },
    ENTERPRISE: { maxUsers: -1, maxInvoices: -1 },
  };

  const limits = planLimits[plan];
  const dateDebut = new Date();
  const dateFin = new Date();
  dateFin.setMonth(dateFin.getMonth() + dureeMois);

  const result = await prisma.$transaction(async (tx) => {
    // Mettre à jour l'entreprise
    const updatedCompany = await tx.company.update({
      where: { id: companyId },
      data: {
        plan,
        maxUsers: limits.maxUsers,
        maxInvoices: limits.maxInvoices,
      },
    });

    // Mettre à jour ou créer la souscription
    let subscription;
    if (company.subscription) {
      subscription = await tx.subscription.update({
        where: { companyId },
        data: {
          plan,
          dateDebut,
          dateFin,
          statut: 'ACTIF',
        },
      });
    } else {
      subscription = await tx.subscription.create({
        data: {
          companyId,
          plan,
          dateDebut,
          dateFin,
          statut: 'ACTIF',
        },
      });
    }

    return { company: updatedCompany, subscription };
  });

  // Invalider le cache
  await cache.delete(`company:${companyId}`);

  return result;
};

// Suspendre une souscription
export const suspendreSouscription = async (companyId: string, raison?: string) => {
  const subscription = await prisma.subscription.findUnique({
    where: { companyId },
  });

  if (!subscription) {
    throw new NotFoundError('Souscription');
  }

  const result = await prisma.$transaction(async (tx) => {
    // Suspendre la souscription
    const updatedSub = await tx.subscription.update({
      where: { companyId },
      data: {
        statut: 'SUSPENDU',
      },
    });

    // Passer l'entreprise en plan FREE
    await tx.company.update({
      where: { id: companyId },
      data: {
        plan: 'FREE',
        maxUsers: 1,
        maxInvoices: 50,
      },
    });

    return updatedSub;
  });

  await cache.delete(`company:${companyId}`);

  return result;
};

// Obtenir les statistiques globales
export const getStatsGlobales = async () => {
  const [
    totalEntreprises,
    totalUsers,
    entreprisesParPlan,
    facturesCeMois,
    caTotalCeMois,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.company.groupBy({
      by: ['plan'],
      _count: true,
    }),
    prisma.facture.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.facture.aggregate({
      where: {
        statut: { in: ['PAYEE', 'PARTIELLEMENT_PAYEE'] },
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { totalTtc: true },
    }),
  ]);

  return {
    totalEntreprises,
    totalUsers,
    entreprisesParPlan: entreprisesParPlan.map((p) => ({
      plan: p.plan,
      count: p._count,
    })),
    facturesCeMois,
    caTotalCeMois: caTotalCeMois._sum.totalTtc || 0,
  };
};

// Obtenir les entreprises
export const getEntreprises = async (options?: {
  search?: string;
  plan?: string;
  limit?: number;
  offset?: number;
}) => {
  const { search, plan, limit = 20, offset = 0 } = options || {};

  const where = {
    ...(plan && { plan: plan as any }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { rccm: { contains: search, mode: 'insensitive' as const } },
        { nif: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [total, entreprises] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      include: {
        subscription: true,
        _count: { users: true },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
  ]);

  return {
    data: entreprises,
    total,
    limit,
    offset,
  };
};

// Obtenir les logs d'audit
export const getAuditLogs = async (options?: {
  companyId?: string;
  userId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) => {
  const { companyId, userId, action, limit = 50, offset = 0 } = options || {};

  const where = {
    ...(companyId && { companyId }),
    ...(userId && { userId }),
    ...(action && { action }),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
  ]);

  return {
    data: logs,
    total,
    limit,
    offset,
  };
};

export default {
  getSubscriptions,
  activerPlan,
  suspendreSouscription,
  getStatsGlobales,
  getEntreprises,
  getAuditLogs,
};
