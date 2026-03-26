// Depense Service for GuinéaManager ERP

import prisma from '../utils/database';
import { CreateDepenseInput, UpdateDepenseInput, depenseFilterSchema } from '../utils/validation';
import { NotFoundError } from '../middlewares/error.middleware';
import { z } from 'zod';

/**
 * Create a new expense
 */
export const createDepense = async (
  companyId: string,
  data: CreateDepenseInput
) => {
  const depense = await prisma.depense.create({
    data: {
      ...data,
      date: data.date || new Date(),
      companyId,
    },
  });

  return depense;
};

/**
 * Get all expenses with pagination and filtering
 */
export const getDepenses = async (
  companyId: string,
  params: z.infer<typeof depenseFilterSchema>
) => {
  const { page, limit, categorie, startDate, endDate } = params;
  const skip = (page - 1) * limit;

  const where = {
    companyId,
    ...(categorie && { categorie }),
    ...(startDate &&
      endDate && {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }),
  };

  const [depenses, total] = await Promise.all([
    prisma.depense.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.depense.count({ where }),
  ]);

  return {
    data: depenses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get expense by ID
 */
export const getDepenseById = async (companyId: string, depenseId: string) => {
  const depense = await prisma.depense.findFirst({
    where: {
      id: depenseId,
      companyId,
    },
  });

  if (!depense) {
    throw new NotFoundError('Dépense non trouvée');
  }

  return depense;
};

/**
 * Update expense
 */
export const updateDepense = async (
  companyId: string,
  depenseId: string,
  data: UpdateDepenseInput
) => {
  // Verify expense exists and belongs to company
  const existingDepense = await prisma.depense.findFirst({
    where: { id: depenseId, companyId },
  });

  if (!existingDepense) {
    throw new NotFoundError('Dépense non trouvée');
  }

  const depense = await prisma.depense.update({
    where: { id: depenseId },
    data,
  });

  return depense;
};

/**
 * Delete expense
 */
export const deleteDepense = async (companyId: string, depenseId: string) => {
  // Verify expense exists and belongs to company
  const existingDepense = await prisma.depense.findFirst({
    where: { id: depenseId, companyId },
  });

  if (!existingDepense) {
    throw new NotFoundError('Dépense non trouvée');
  }

  await prisma.depense.delete({
    where: { id: depenseId },
  });

  return true;
};

/**
 * Get expense categories with totals
 */
export const getDepensesByCategorie = async (
  companyId: string,
  startDate?: Date,
  endDate?: Date
) => {
  const where = {
    companyId,
    ...(startDate &&
      endDate && {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }),
  };

  const result = await prisma.depense.groupBy({
    by: ['categorie'],
    where,
    _sum: { montant: true },
    _count: { id: true },
  });

  return result.map((item) => ({
    categorie: item.categorie || 'Non catégorisé',
    montant: item._sum.montant || 0,
    count: item._count.id,
  }));
};

/**
 * Get expense statistics
 */
export const getDepenseStats = async (
  companyId: string,
  startDate?: Date,
  endDate?: Date
) => {
  const where = {
    companyId,
    ...(startDate &&
      endDate && {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }),
  };

  const [totalDepenses, montantTotal, parCategorie, parModePaiement] =
    await Promise.all([
      prisma.depense.count({ where }),
      prisma.depense.aggregate({
        where,
        _sum: { montant: true },
      }),
      getDepensesByCategorie(companyId, startDate, endDate),
      prisma.depense.groupBy({
        by: ['modePaiement'],
        where,
        _sum: { montant: true },
      }),
    ]);

  return {
    totalDepenses,
    montantTotal: montantTotal._sum.montant || 0,
    parCategorie,
    parModePaiement: parModePaiement.map((item) => ({
      mode: item.modePaiement || 'Non spécifié',
      montant: item._sum.montant || 0,
    })),
  };
};

/**
 * Get monthly expense summary
 */
export const getDepensesMensuelles = async (
  companyId: string,
  annee: number
) => {
  const result = await prisma.$queryRaw<
    { mois: number; total: bigint }[]
  >`
    SELECT 
      CAST(strftime('%m', date) AS INTEGER) as mois,
      SUM(montant) as total
    FROM depenses
    WHERE companyId = ${companyId}
      AND strftime('%Y', date) = ${annee.toString()}
    GROUP BY mois
    ORDER BY mois
  `;

  // Create array for all 12 months
  const moisData = Array.from({ length: 12 }, (_, i) => ({
    mois: i + 1,
    total: 0,
  }));

  for (const row of result) {
    moisData[row.mois - 1].total = Number(row.total);
  }

  return moisData;
};

/**
 * Get expense categories list
 */
export const getCategories = async (companyId: string) => {
  const result = await prisma.depense.findMany({
    where: {
      companyId,
      categorie: { not: null },
    },
    select: { categorie: true },
    distinct: ['categorie'],
  });

  return result
    .filter((d) => d.categorie)
    .map((d) => d.categorie);
};

// Aliases for backward compatibility with controllers
export const getDepense = getDepenseById;
export const listDepenses = getDepenses;
export const getStatsParCategorie = getDepensesByCategorie;
export const getStatsMensuelles = getDepensesMensuelles;
export const getTotalDepenses = getDepenseStats;
