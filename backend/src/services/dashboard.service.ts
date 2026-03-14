// Dashboard Service for GuinéaManager ERP

import prisma from '../utils/database';
import { DashboardStats, MonthlyStats } from '../types';

/**
 * Get main dashboard statistics
 */
export const getDashboardStats = async (companyId: string): Promise<DashboardStats> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Get revenues (paid invoices)
  const revenus = await prisma.facture.aggregate({
    where: {
      companyId,
      statut: 'payee',
      dateEmission: { gte: startOfYear },
    },
    _sum: { montantTTC: true },
  });

  // Get pending invoices
  const facturesEnAttente = await prisma.facture.count({
    where: {
      companyId,
      statut: 'envoyee',
    },
  });

  // Get paid invoices count
  const facturesPayees = await prisma.facture.count({
    where: {
      companyId,
      statut: 'payee',
    },
  });

  // Get total expenses
  const depenses = await prisma.depense.aggregate({
    where: {
      companyId,
      date: { gte: startOfYear },
    },
    _sum: { montant: true },
  });

  // Get client count
  const nombreClients = await prisma.client.count({
    where: { companyId },
  });

  // Get active employee count
  const nombreEmployes = await prisma.employe.count({
    where: { companyId, actif: true },
  });

  // Get pending payroll for current month
  const salairesAPayer = await prisma.bulletinPaie.aggregate({
    where: {
      companyId,
      mois: now.getMonth() + 1,
      annee: now.getFullYear(),
      statut: { in: ['brouillon', 'valide'] },
    },
    _sum: { netAPayer: true },
  });

  // Calculate net profit
  const chiffreAffaires = revenus._sum.montantTTC || 0;
  const depensesTotales = depenses._sum.montant || 0;
  const beneficeNet = chiffreAffaires - depensesTotales;

  return {
    chiffreAffaires,
    facturesEnAttente,
    facturesPayees,
    depensesTotales,
    nombreClients,
    nombreEmployes,
    salairesAPayer: salairesAPayer._sum.netAPayer || 0,
    beneficeNet,
  };
};

/**
 * Get monthly statistics for charts
 */
export const getMonthlyStats = async (
  companyId: string,
  annee: number
): Promise<MonthlyStats[]> => {
  const startOfYear = new Date(annee, 0, 1);
  const endOfYear = new Date(annee, 11, 31, 23, 59, 59);

  // Get monthly revenues
  const factures = await prisma.facture.findMany({
    where: {
      companyId,
      statut: 'payee',
      dateEmission: {
        gte: startOfYear,
        lte: endOfYear,
      },
    },
    select: {
      dateEmission: true,
      montantTTC: true,
    },
  });

  // Get monthly expenses
  const depenses = await prisma.depense.findMany({
    where: {
      companyId,
      date: {
        gte: startOfYear,
        lte: endOfYear,
      },
    },
    select: {
      date: true,
      montant: true,
    },
  });

  // Aggregate by month
  const monthlyData: Map<number, { revenus: number; depenses: number }> = new Map();

  // Initialize all months
  for (let i = 1; i <= 12; i++) {
    monthlyData.set(i, { revenus: 0, depenses: 0 });
  }

  // Sum revenues by month
  for (const facture of factures) {
    const mois = facture.dateEmission.getMonth() + 1;
    const data = monthlyData.get(mois)!;
    data.revenus += facture.montantTTC;
  }

  // Sum expenses by month
  for (const depense of depenses) {
    const mois = depense.date.getMonth() + 1;
    const data = monthlyData.get(mois)!;
    data.depenses += depense.montant;
  }

  // Convert to array and calculate profit
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const result: MonthlyStats[] = [];
  for (let i = 1; i <= 12; i++) {
    const data = monthlyData.get(i)!;
    result.push({
      mois: monthNames[i - 1],
      revenus: data.revenus,
      depenses: data.depenses,
      benefice: data.revenus - data.depenses,
    });
  }

  return result;
};

/**
 * Get invoice status summary
 */
export const getFactureSummary = async (companyId: string) => {
  const summary = await prisma.facture.groupBy({
    by: ['statut'],
    where: { companyId },
    _count: { id: true },
    _sum: { montantTTC: true },
  });

  return summary.map((item) => ({
    statut: item.statut,
    count: item._count.id,
    montant: item._sum.montantTTC || 0,
  }));
};

/**
 * Get top clients by revenue
 */
export const getTopClients = async (companyId: string, limit: number = 5) => {
  const clients = await prisma.client.findMany({
    where: { companyId },
    orderBy: { totalAchats: 'desc' },
    take: limit,
    select: {
      id: true,
      nom: true,
      email: true,
      totalAchats: true,
    },
  });

  return clients;
};

/**
 * Get recent activities
 */
export const getRecentActivities = async (companyId: string, limit: number = 10) => {
  const [recentFactures, recentDepenses, recentBulletins] = await Promise.all([
    prisma.facture.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        numero: true,
        montantTTC: true,
        statut: true,
        createdAt: true,
        client: { select: { nom: true } },
      },
    }),
    prisma.depense.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        description: true,
        montant: true,
        categorie: true,
        createdAt: true,
      },
    }),
    prisma.bulletinPaie.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        mois: true,
        annee: true,
        netAPayer: true,
        statut: true,
        createdAt: true,
        employe: { select: { nom: true, prenom: true } },
      },
    }),
  ]);

  // Combine and sort by date
  const activities = [
    ...recentFactures.map((f) => ({
      type: 'facture' as const,
      id: f.id,
      description: `Facture ${f.numero} - ${f.client.nom}`,
      montant: f.montantTTC,
      statut: f.statut,
      date: f.createdAt,
    })),
    ...recentDepenses.map((d) => ({
      type: 'depense' as const,
      id: d.id,
      description: d.description,
      montant: d.montant,
      categorie: d.categorie,
      date: d.createdAt,
    })),
    ...recentBulletins.map((b) => ({
      type: 'paie' as const,
      id: b.id,
      description: `Paie ${b.mois}/${b.annee} - ${b.employe.nom} ${b.employe.prenom}`,
      montant: b.netAPayer,
      statut: b.statut,
      date: b.createdAt,
    })),
  ];

  return activities
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
};

/**
 * Get financial overview for the current year
 */
export const getFinancialOverview = async (companyId: string) => {
  const now = new Date();
  const currentYear = now.getFullYear();

  const [revenusAnnee, depensesAnnee, salairesAnnee] = await Promise.all([
    prisma.facture.aggregate({
      where: {
        companyId,
        statut: 'payee',
        dateEmission: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31, 23, 59, 59),
        },
      },
      _sum: { montantTTC: true },
    }),
    prisma.depense.aggregate({
      where: {
        companyId,
        date: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31, 23, 59, 59),
        },
      },
      _sum: { montant: true },
    }),
    prisma.bulletinPaie.aggregate({
      where: {
        companyId,
        statut: 'paye',
        annee: currentYear,
      },
      _sum: { netAPayer: true, coutTotalEmployeur: true },
    }),
  ]);

  const chiffreAffaires = revenusAnnee._sum.montantTTC || 0;
  const totalDepenses = depensesAnnee._sum.montant || 0;
  const totalSalaires = salairesAnnee._sum.netAPayer || 0;
  const coutEmployeur = salairesAnnee._sum.coutTotalEmployeur || 0;

  return {
    annee: currentYear,
    chiffreAffaires,
    totalDepenses,
    totalSalaires,
    coutEmployeur,
    beneficeBrut: chiffreAffaires - totalDepenses,
    beneficeNet: chiffreAffaires - totalDepenses - coutEmployeur,
    tauxMarge:
      chiffreAffaires > 0
        ? ((chiffreAffaires - totalDepenses) / chiffreAffaires) * 100
        : 0,
  };
};

/**
 * Get alerts and notifications
 */
export const getAlerts = async (companyId: string) => {
  const now = new Date();
  const alerts: { type: string; message: string; severity: 'info' | 'warning' | 'error' }[] = [];

  // Check for overdue invoices
  const facturesEnRetard = await prisma.facture.count({
    where: {
      companyId,
      statut: 'envoyee',
      dateEcheance: { lt: now },
    },
  });

  if (facturesEnRetard > 0) {
    alerts.push({
      type: 'factures',
      message: `${facturesEnRetard} facture(s) en retard de paiement`,
      severity: 'warning',
    });
  }

  // Check for low stock products
  const produitsStockBas = await prisma.produit.count({
    where: {
      companyId,
      actif: true,
      stockActuel: { lte: prisma.produit.fields.stockMin },
    },
  });

  if (produitsStockBas > 0) {
    alerts.push({
      type: 'stock',
      message: `${produitsStockBas} produit(s) avec un stock bas`,
      severity: 'warning',
    });
  }

  // Check for unpaid payroll
  const bulletinsNonPayes = await prisma.bulletinPaie.count({
    where: {
      companyId,
      mois: now.getMonth() + 1,
      annee: now.getFullYear(),
      statut: { in: ['brouillon', 'valide'] },
    },
  });

  if (bulletinsNonPayes > 0) {
    alerts.push({
      type: 'paie',
      message: `${bulletinsNonPayes} bulletin(s) de paie en attente`,
      severity: 'info',
    });
  }

  return alerts;
};
