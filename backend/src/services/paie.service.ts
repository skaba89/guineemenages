// Bulletin Paie Service for GuinéaManager ERP

import prisma from '../utils/database';
import { CreateBulletinPaieInput, UpdateBulletinPaieInput, calculerPaieSchema } from '../utils/validation';
import { NotFoundError, ConflictError, ValidationError } from '../middlewares/error.middleware';
import { calculatePayroll, calculateHourlyRate, STANDARD_MONTHLY_HOURS } from '../utils/payroll';
import { z } from 'zod';

/**
 * Calculate payroll for an employee
 */
export const calculerPaie = (data: z.infer<typeof calculerPaieSchema>) => {
  // Calculate hourly rate if not provided
  const tauxHoraire = data.tauxHoraire || calculateHourlyRate(data.salaireBase);

  const result = calculatePayroll({
    salaireBase: data.salaireBase,
    heuresSupplementaires: data.heuresSupplementaires,
    tauxHoraire,
    primes: data.primes,
    indemnites: data.indemnites,
    autresAvantages: data.autresAvantages,
    acomptes: data.acomptes,
    autreRetenues: data.autreRetenues,
  });

  return {
    ...result,
    tauxHoraire,
    heuresSupplementaires: data.heuresSupplementaires,
  };
};

/**
 * Create a new payslip
 */
export const createBulletinPaie = async (
  companyId: string,
  data: CreateBulletinPaieInput
) => {
  // Verify employee exists and belongs to company
  const employe = await prisma.employe.findFirst({
    where: { id: data.employeId, companyId, actif: true },
  });

  if (!employe) {
    throw new NotFoundError('Employé non trouvé ou inactif');
  }

  // Check if payslip already exists for this month/year
  const existingBulletin = await prisma.bulletinPaie.findUnique({
    where: {
      employeId_mois_annee: {
        employeId: data.employeId,
        mois: data.mois,
        annee: data.annee,
      },
    },
  });

  if (existingBulletin) {
    throw new ConflictError(
      `Un bulletin de paie existe déjà pour ${data.mois}/${data.annee}`
    );
  }

  // Calculate payroll
  const tauxHoraire = calculateHourlyRate(employe.salaireBase);
  const payroll = calculatePayroll({
    salaireBase: employe.salaireBase,
    heuresSupplementaires: data.heuresSupplementaires || 0,
    tauxHoraire,
    primes: data.primes || 0,
    indemnites: data.indemnites || 0,
    autresAvantages: data.autresAvantages || 0,
    acomptes: data.acomptes || 0,
    autreRetenues: data.autreRetenues || 0,
  });

  // Create payslip
  const bulletin = await prisma.bulletinPaie.create({
    data: {
      employeId: data.employeId,
      mois: data.mois,
      annee: data.annee,
      salaireBase: payroll.salaireBase,
      heuresSupplementaires: data.heuresSupplementaires || 0,
      montantHeuresSupp: payroll.montHeuresSupp,
      primes: payroll.primes,
      indemnites: payroll.indemnites,
      autresAvantages: payroll.autresAvantages,
      brutTotal: payroll.brutTotal,
      cnssEmploye: payroll.cnssEmploye,
      cnssEmployeur: payroll.cnssEmployeur,
      ipr: payroll.ipr,
      autreRetenues: payroll.autreRetenues,
      acomptes: payroll.acomptes,
      netAPayer: payroll.netAPayer,
      coutTotalEmployeur: payroll.coutTotalEmployeur,
      companyId,
    },
    include: {
      employe: true,
    },
  });

  return bulletin;
};

/**
 * Get all payslips with filtering
 */
export const getBulletinsPaie = async (
  companyId: string,
  params: {
    page?: number;
    limit?: number;
    mois?: number;
    annee?: number;
    employeId?: string;
    statut?: string;
  }
) => {
  const { page = 1, limit = 10, mois, annee, employeId, statut } = params;
  const skip = (page - 1) * limit;

  const where = {
    companyId,
    ...(mois && { mois }),
    ...(annee && { annee }),
    ...(employeId && { employeId }),
    ...(statut && { statut }),
  };

  const [bulletins, total] = await Promise.all([
    prisma.bulletinPaie.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ annee: 'desc' }, { mois: 'desc' }],
      include: {
        employe: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
            poste: true,
          },
        },
      },
    }),
    prisma.bulletinPaie.count({ where }),
  ]);

  return {
    data: bulletins,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get payslip by ID
 */
export const getBulletinPaieById = async (companyId: string, bulletinId: string) => {
  const bulletin = await prisma.bulletinPaie.findFirst({
    where: {
      id: bulletinId,
      companyId,
    },
    include: {
      employe: true,
    },
  });

  if (!bulletin) {
    throw new NotFoundError('Bulletin de paie non trouvé');
  }

  return bulletin;
};

/**
 * Update payslip
 */
export const updateBulletinPaie = async (
  companyId: string,
  bulletinId: string,
  data: UpdateBulletinPaieInput
) => {
  // Verify payslip exists
  const existingBulletin = await prisma.bulletinPaie.findFirst({
    where: { id: bulletinId, companyId },
    include: { employe: true },
  });

  if (!existingBulletin) {
    throw new NotFoundError('Bulletin de paie non trouvé');
  }

  // Only allow updates on draft payslips
  if (existingBulletin.statut !== 'brouillon') {
    throw new ConflictError(
      'Seuls les bulletins en brouillon peuvent être modifiés'
    );
  }

  // If amounts are being changed, recalculate
  if (
    data.heuresSupplementaires !== undefined ||
    data.primes !== undefined ||
    data.indemnites !== undefined ||
    data.autresAvantages !== undefined ||
    data.acomptes !== undefined ||
    data.autreRetenues !== undefined
  ) {
    const tauxHoraire = calculateHourlyRate(existingBulletin.salaireBase);
    const payroll = calculatePayroll({
      salaireBase: existingBulletin.salaireBase,
      heuresSupplementaires: data.heuresSupplementaires ?? existingBulletin.heuresSupplementaires,
      tauxHoraire,
      primes: data.primes ?? existingBulletin.primes,
      indemnites: data.indemnites ?? existingBulletin.indemnites,
      autresAvantages: data.autresAvantages ?? existingBulletin.autresAvantages,
      acomptes: data.acomptes ?? existingBulletin.acomptes,
      autreRetenues: data.autreRetenues ?? existingBulletin.autreRetenues,
    });

    const updatedBulletin = await prisma.bulletinPaie.update({
      where: { id: bulletinId },
      data: {
        heuresSupplementaires: data.heuresSupplementaires ?? existingBulletin.heuresSupplementaires,
        montantHeuresSupp: payroll.montHeuresSupp,
        primes: payroll.primes,
        indemnites: payroll.indemnites,
        autresAvantages: payroll.autresAvantages,
        brutTotal: payroll.brutTotal,
        cnssEmploye: payroll.cnssEmploye,
        cnssEmployeur: payroll.cnssEmployeur,
        ipr: payroll.ipr,
        autreRetenues: payroll.autreRetenues,
        acomptes: payroll.acomptes,
        netAPayer: payroll.netAPayer,
        coutTotalEmployeur: payroll.coutTotalEmployeur,
        statut: data.statut,
        datePaiement: data.datePaiement,
      },
      include: { employe: true },
    });

    return updatedBulletin;
  }

  // Simple status update
  const updatedBulletin = await prisma.bulletinPaie.update({
    where: { id: bulletinId },
    data: {
      statut: data.statut,
      datePaiement: data.datePaiement,
    },
    include: { employe: true },
  });

  return updatedBulletin;
};

/**
 * Validate and mark payslip as paid
 */
export const payerBulletinPaie = async (companyId: string, bulletinId: string) => {
  const bulletin = await prisma.bulletinPaie.findFirst({
    where: { id: bulletinId, companyId },
  });

  if (!bulletin) {
    throw new NotFoundError('Bulletin de paie non trouvé');
  }

  if (bulletin.statut === 'paye') {
    throw new ConflictError('Ce bulletin a déjà été payé');
  }

  const updatedBulletin = await prisma.bulletinPaie.update({
    where: { id: bulletinId },
    data: {
      statut: 'paye',
      datePaiement: new Date(),
    },
    include: { employe: true },
  });

  return updatedBulletin;
};

/**
 * Delete payslip (only drafts)
 */
export const deleteBulletinPaie = async (companyId: string, bulletinId: string) => {
  const bulletin = await prisma.bulletinPaie.findFirst({
    where: { id: bulletinId, companyId },
  });

  if (!bulletin) {
    throw new NotFoundError('Bulletin de paie non trouvé');
  }

  if (bulletin.statut !== 'brouillon') {
    throw new ConflictError('Seuls les bulletins en brouillon peuvent être supprimés');
  }

  await prisma.bulletinPaie.delete({
    where: { id: bulletinId },
  });

  return true;
};

/**
 * Get payroll statistics
 */
export const getPaieStats = async (companyId: string) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [
    totalBulletins,
    bulletinsPayes,
    bulletinsParStatut,
    masseSalariale,
    bulletinsMoisCourant,
  ] = await Promise.all([
    prisma.bulletinPaie.count({ where: { companyId } }),
    prisma.bulletinPaie.count({ where: { companyId, statut: 'paye' } }),
    prisma.bulletinPaie.groupBy({
      by: ['statut'],
      where: { companyId },
      _count: { id: true },
      _sum: { netAPayer: true },
    }),
    prisma.bulletinPaie.aggregate({
      where: { companyId, statut: 'paye' },
      _sum: { netAPayer: true, coutTotalEmployeur: true },
    }),
    prisma.bulletinPaie.findMany({
      where: {
        companyId,
        mois: currentMonth,
        annee: currentYear,
      },
      include: {
        employe: {
          select: { matricule: true, nom: true, prenom: true },
        },
      },
    }),
  ]);

  return {
    totalBulletins,
    bulletinsPayes,
    bulletinsParStatut: bulletinsParStatut.map((item) => ({
      statut: item.statut,
      count: item._count.id,
      montant: item._sum.netAPayer || 0,
    })),
    masseSalarialeTotale: masseSalariale._sum.netAPayer || 0,
    coutTotalEmployeur: masseSalariale._sum.coutTotalEmployeur || 0,
    bulletinsMoisCourant,
  };
};

/**
 * Generate payslips for all active employees for a given month
 */
export const generateBulletinsMois = async (
  companyId: string,
  mois: number,
  annee: number
) => {
  // Get all active employees
  const employes = await prisma.employe.findMany({
    where: { companyId, actif: true },
  });

  if (employes.length === 0) {
    throw new ValidationError('Aucun employé actif trouvé');
  }

  const results: { employe: string; bulletin?: any; error?: string }[] = [];

  for (const employe of employes) {
    try {
      // Check if bulletin already exists
      const existing = await prisma.bulletinPaie.findUnique({
        where: {
          employeId_mois_annee: {
            employeId: employe.id,
            mois,
            annee,
          },
        },
      });

      if (existing) {
        results.push({
          employe: `${employe.nom} ${employe.prenom}`,
          error: 'Bulletin déjà existant',
        });
        continue;
      }

      // Calculate payroll
      const tauxHoraire = calculateHourlyRate(employe.salaireBase);
      const payroll = calculatePayroll({
        salaireBase: employe.salaireBase,
        heuresSupplementaires: 0,
        tauxHoraire,
        primes: 0,
        indemnites: 0,
        autresAvantages: 0,
        acomptes: 0,
        autreRetenues: 0,
      });

      // Create bulletin
      const bulletin = await prisma.bulletinPaie.create({
        data: {
          employeId: employe.id,
          mois,
          annee,
          salaireBase: payroll.salaireBase,
          heuresSupplementaires: 0,
          montantHeuresSupp: payroll.montHeuresSupp,
          primes: payroll.primes,
          indemnites: payroll.indemnites,
          autresAvantages: payroll.autresAvantages,
          brutTotal: payroll.brutTotal,
          cnssEmploye: payroll.cnssEmploye,
          cnssEmployeur: payroll.cnssEmployeur,
          ipr: payroll.ipr,
          autreRetenues: payroll.autreRetenues,
          acomptes: payroll.acomptes,
          netAPayer: payroll.netAPayer,
          coutTotalEmployeur: payroll.coutTotalEmployeur,
          companyId,
        },
      });

      results.push({
        employe: `${employe.nom} ${employe.prenom}`,
        bulletin,
      });
    } catch (error: any) {
      results.push({
        employe: `${employe.nom} ${employe.prenom}`,
        error: error.message,
      });
    }
  }

  return results;
};
