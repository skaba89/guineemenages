// Service Rapports pour GuinéaManager

import prisma from '../utils/prisma';
import { cache } from '../utils/redis';
import { requireFeature } from '../middlewares/plan';

// CA mensuel
export const getCaMensuel = async (
  companyId: string,
  annee: number = new Date().getFullYear()
) => {
  const cacheKey = `rapport:ca_mensuel:${companyId}:${annee}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const result = await prisma.$queryRaw<{ mois: number; ca: bigint; nb: bigint }[]>`
    SELECT 
      EXTRACT(MONTH FROM date)::int as mois,
      SUM(total_ttc)::bigint as ca,
      COUNT(*)::bigint as nb
    FROM "Facture"
    WHERE company_id = ${companyId}
      AND EXTRACT(YEAR FROM date) = ${annee}
      AND statut IN ('PAYEE', 'PARTIELLEMENT_PAYEE')
    GROUP BY EXTRACT(MONTH FROM date)
    ORDER BY mois
  `;

  const data = [];
  for (let i = 1; i <= 12; i++) {
    const found = result.find((r) => r.mois === i);
    data.push({
      mois: i,
      nomMois: new Date(annee, i - 1).toLocaleDateString('fr-GN', { month: 'long' }),
      ca: found ? Number(found.ca) : 0,
      nbFactures: found ? Number(found.nb) : 0,
    });
  }

  await cache.set(cacheKey, data, 3600);
  return data;
};

// Top clients
export const getTopClients = async (
  companyId: string,
  limit: number = 10,
  annee?: number
) => {
  const cacheKey = `rapport:top_clients:${companyId}:${limit}:${annee || 'all'}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const whereClause = annee
    ? prisma.$queryRaw<{ id: string; nom: string; ca: bigint; nb: bigint }[]>`
      SELECT 
        c.id,
        c.nom,
        SUM(f.total_ttc)::bigint as ca,
        COUNT(f.id)::bigint as nb
      FROM "Client" c
      JOIN "Facture" f ON c.id = f.client_id
      WHERE c.company_id = ${companyId}
        AND f.statut IN ('PAYEE', 'PARTIELLEMENT_PAYEE')
        AND EXTRACT(YEAR FROM f.date) = ${annee}
      GROUP BY c.id, c.nom
      ORDER BY ca DESC
      LIMIT ${limit}
    `
    : prisma.$queryRaw<{ id: string; nom: string; ca: bigint; nb: bigint }[]>`
      SELECT 
        c.id,
        c.nom,
        SUM(f.total_ttc)::bigint as ca,
        COUNT(f.id)::bigint as nb
      FROM "Client" c
      JOIN "Facture" f ON c.id = f.client_id
      WHERE c.company_id = ${companyId}
        AND f.statut IN ('PAYEE', 'PARTIELLEMENT_PAYEE')
      GROUP BY c.id, c.nom
      ORDER BY ca DESC
      LIMIT ${limit}
    `;

  const result = await whereClause;

  const data = result.map((r) => ({
    id: r.id,
    nom: r.nom,
    ca: Number(r.ca),
    nbFactures: Number(r.nb),
  }));

  await cache.set(cacheKey, data, 3600);
  return data;
};

// Bilan simplifié
export const getBilanSimplifie = async (
  companyId: string,
  dateDebut?: Date,
  dateFin?: Date
) => {
  const start = dateDebut || new Date(new Date().getFullYear(), 0, 1);
  const end = dateFin || new Date();

  const [
    caTotal,
    depensesTotal,
    creances,
    dettesFournisseurs,
    stockValeur,
    masseSalariale,
  ] = await Promise.all([
    // CA total
    prisma.facture.aggregate({
      where: {
        companyId,
        statut: { in: ['PAYEE', 'PARTIELLEMENT_PAYEE'] },
        date: { gte: start, lte: end },
      },
      _sum: { totalTtc: true },
    }),

    // Dépenses totales
    prisma.depense.aggregate({
      where: {
        companyId,
        date: { gte: start, lte: end },
      },
      _sum: { montant: true },
    }),

    // Créances clients
    prisma.client.aggregate({
      where: { companyId },
      _sum: { soldeDu: true },
    }),

    // Dettes fournisseurs
    prisma.fournisseur.aggregate({
      where: { companyId },
      _sum: { soldeDu: true },
    }),

    // Valeur du stock
    prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COALESCE(SUM(stock_actuel * prix_achat), 0)::bigint as total
      FROM "Produit"
      WHERE company_id = ${companyId}
    `,

    // Masse salariale (bulletins payés)
    prisma.bulletinPaie.aggregate({
      where: {
        employe: { companyId },
        statut: 'PAYE',
        datePaiement: { gte: start, lte: end },
      },
      _sum: { salaireNet: true },
    }),
  ]);

  const ca = caTotal._sum.totalTtc || 0;
  const depenses = depensesTotal._sum.montant || 0;
  const salaires = masseSalariale._sum.salaireNet || 0;

  const resultatNet = ca - depenses - salaires;

  return {
    periode: {
      debut: start,
      fin: end,
    },
    produits: {
      chiffreAffaires: ca,
    },
    charges: {
      depenses,
      salaires,
      totalCharges: depenses + salaires,
    },
    resultatNet,
    actif: {
      creancesClients: creances._sum.soldeDu || 0,
      stock: Number(stockValeur[0]?.total || 0),
    },
    passif: {
      dettesFournisseurs: dettesFournisseurs._sum.soldeDu || 0,
    },
    rentabilite: ca > 0 ? ((resultatNet / ca) * 100).toFixed(2) : '0',
  };
};

// Export des données
export const exportDonnees = async (
  companyId: string,
  type: 'clients' | 'factures' | 'produits' | 'depenses',
  format: 'json' | 'csv'
) => {
  let data: any[];

  switch (type) {
    case 'clients':
      data = await prisma.client.findMany({
        where: { companyId },
        orderBy: { nom: 'asc' },
      });
      break;
    case 'factures':
      data = await prisma.facture.findMany({
        where: { companyId },
        include: {
          client: { select: { nom: true } },
          lignes: true,
        },
        orderBy: { date: 'desc' },
      });
      break;
    case 'produits':
      data = await prisma.produit.findMany({
        where: { companyId },
        orderBy: { nom: 'asc' },
      });
      break;
    case 'depenses':
      data = await prisma.depense.findMany({
        where: { companyId },
        include: {
          fournisseur: { select: { nom: true } },
        },
        orderBy: { date: 'desc' },
      });
      break;
    default:
      data = [];
  }

  if (format === 'csv') {
    return convertToCsv(data, type);
  }

  return JSON.stringify(data, null, 2);
};

// Convertir en CSV
const convertToCsv = (data: any[], type: string): string => {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]).filter(
    (key) => typeof data[0][key] !== 'object'
  );

  const rows = data.map((item) =>
    headers
      .map((header) => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return String(value);
      })
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
};

// Rapport des impayés
export const getRapportImpayes = async (companyId: string) => {
  const factures = await prisma.facture.findMany({
    where: {
      companyId,
      statut: { in: ['ENVOYEE', 'PARTIELLEMENT_PAYEE'] },
    },
    include: {
      client: {
        select: { nom: true, telephone: true, email: true },
      },
    },
    orderBy: { date: 'asc' },
  });

  const now = new Date();
  const impayes = factures.map((f) => {
    const reste = f.totalTtc - f.montantPaye;
    const echeance = f.echeance ? new Date(f.echeance) : null;
    const joursRetard = echeance
      ? Math.max(0, Math.floor((now.getTime() - echeance.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      id: f.id,
      numero: f.numero,
      client: f.client,
      montantTotal: f.totalTtc,
      montantPaye: f.montantPaye,
      reste,
      date: f.date,
      echeance: f.echeance,
      joursRetard,
      statut: joursRetard > 30 ? 'CRITIQUE' : joursRetard > 0 ? 'EN_RETARD' : 'A_JOUR',
    };
  });

  const totalImpayes = impayes.reduce((sum, i) => sum + i.reste, 0);
  const parClient = impayes.reduce((acc, i) => {
    const clientId = i.client.nom;
    if (!acc[clientId]) {
      acc[clientId] = { client: i.client, montant: 0, factures: 0 };
    }
    acc[clientId].montant += i.reste;
    acc[clientId].factures++;
    return acc;
  }, {} as Record<string, { client: any; montant: number; factures: number }>);

  return {
    factures: impayes,
    totalImpayes,
    nbFactures: impayes.length,
    parClient: Object.values(parClient).sort((a, b) => b.montant - a.montant),
    critiques: impayes.filter((i) => i.statut === 'CRITIQUE').length,
  };
};

export default {
  getCaMensuel,
  getTopClients,
  getBilanSimplifie,
  exportDonnees,
  getRapportImpayes,
};
