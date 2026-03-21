// Facture Service for GuinéaManager ERP

import prisma from '../utils/database';
import { CreateFactureInput, UpdateFactureInput, factureFilterSchema } from '../utils/validation';
import { NotFoundError, ConflictError, ValidationError } from '../middlewares/error.middleware';
import { z } from 'zod';

/**
 * Generate invoice number
 */
export const generateInvoiceNumber = async (companyId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `FAC-${year}-`;

  const lastInvoice = await prisma.facture.findFirst({
    where: {
      companyId,
      numero: { startsWith: prefix },
    },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  });

  let sequence = 1;
  if (lastInvoice) {
    const lastNumber = lastInvoice.numero.split('-')[2];
    sequence = parseInt(lastNumber, 10) + 1;
  }

  return `${prefix}${sequence.toString().padStart(6, '0')}`;
};

/**
 * Calculate invoice totals from lines
 */
const calculateInvoiceTotals = (lignes: CreateFactureInput['lignes']) => {
  let montantHT = 0;
  let montantTVA = 0;

  for (const ligne of lignes) {
    const ht = Math.round(ligne.quantite * ligne.prixUnitaire);
    const tva = Math.round(ht * (ligne.tauxTVA || 0) / 100);
    montantHT += ht;
    montantTVA += tva;
  }

  return {
    montantHT,
    montantTVA,
    montantTTC: montantHT + montantTVA,
  };
};

/**
 * Create a new invoice
 */
export const createFacture = async (
  companyId: string,
  data: CreateFactureInput
) => {
  // Verify client exists and belongs to company
  const client = await prisma.client.findFirst({
    where: { id: data.clientId, companyId },
  });

  if (!client) {
    throw new NotFoundError('Client non trouvé');
  }

  // Generate invoice number
  const numero = await generateInvoiceNumber(companyId);

  // Calculate totals
  const totals = calculateInvoiceTotals(data.lignes);

  // Create invoice with lines
  const facture = await prisma.facture.create({
    data: {
      numero,
      clientId: data.clientId,
      dateEmission: data.dateEmission || new Date(),
      dateEcheance: data.dateEcheance,
      montantHT: totals.montantHT,
      montantTVA: totals.montantTVA,
      montantTTC: totals.montantTTC,
      modePaiement: data.modePaiement,
      notes: data.notes,
      companyId,
      lignes: {
        create: data.lignes.map((ligne) => ({
          produitId: ligne.produitId,
          description: ligne.description,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
          tauxTVA: ligne.tauxTVA || 0,
          montantHT: Math.round(ligne.quantite * ligne.prixUnitaire),
          montantTVA: Math.round(
            ligne.quantite * ligne.prixUnitaire * ((ligne.tauxTVA || 0) / 100)
          ),
          montantTTC: Math.round(
            ligne.quantite * ligne.prixUnitaire * (1 + (ligne.tauxTVA || 0) / 100)
          ),
        })),
      },
    },
    include: {
      client: true,
      lignes: {
        include: {
          produit: true,
        },
      },
    },
  });

  return facture;
};

/**
 * Get all invoices with pagination and filtering
 */
export const getFactures = async (
  companyId: string,
  params: z.infer<typeof factureFilterSchema>
) => {
  const { page, limit, statut, clientId, startDate, endDate } = params;
  const skip = (page - 1) * limit;

  const where = {
    companyId,
    ...(statut && { statut }),
    ...(clientId && { clientId }),
    ...(startDate &&
      endDate && {
        dateEmission: {
          gte: startDate,
          lte: endDate,
        },
      }),
  };

  const [factures, total] = await Promise.all([
    prisma.facture.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { id: true, nom: true, email: true },
        },
        _count: {
          select: { lignes: true },
        },
      },
    }),
    prisma.facture.count({ where }),
  ]);

  return {
    data: factures,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get invoice by ID
 */
export const getFactureById = async (companyId: string, factureId: string) => {
  const facture = await prisma.facture.findFirst({
    where: {
      id: factureId,
      companyId,
    },
    include: {
      client: true,
      lignes: {
        include: {
          produit: true,
        },
      },
    },
  });

  if (!facture) {
    throw new NotFoundError('Facture non trouvée');
  }

  return facture;
};

/**
 * Update invoice
 */
export const updateFacture = async (
  companyId: string,
  factureId: string,
  data: UpdateFactureInput
) => {
  // Verify invoice exists and belongs to company
  const existingFacture = await prisma.facture.findFirst({
    where: { id: factureId, companyId },
    include: { lignes: true },
  });

  if (!existingFacture) {
    throw new NotFoundError('Facture non trouvée');
  }

  // Only allow updates on draft invoices
  if (existingFacture.statut !== 'brouillon') {
    throw new ConflictError(
      'Seules les factures en brouillon peuvent être modifiées'
    );
  }

  // Prepare update data
  const updateData: any = {
    ...(data.clientId && { clientId: data.clientId }),
    ...(data.dateEmission && { dateEmission: data.dateEmission }),
    ...(data.dateEcheance && { dateEcheance: data.dateEcheance }),
    ...(data.modePaiement && { modePaiement: data.modePaiement }),
    ...(data.notes !== undefined && { notes: data.notes }),
    ...(data.statut && { statut: data.statut }),
  };

  // If lines are provided, recalculate and update
  if (data.lignes && data.lignes.length > 0) {
    const totals = calculateInvoiceTotals(data.lignes);
    updateData.montantHT = totals.montantHT;
    updateData.montantTVA = totals.montantTVA;
    updateData.montantTTC = totals.montantTTC;

    // Delete existing lines and create new ones
    await prisma.ligneFacture.deleteMany({
      where: { factureId },
    });

    updateData.lignes = {
      create: data.lignes.map((ligne) => ({
        produitId: ligne.produitId,
        description: ligne.description,
        quantite: ligne.quantite,
        prixUnitaire: ligne.prixUnitaire,
        tauxTVA: ligne.tauxTVA || 0,
        montantHT: Math.round(ligne.quantite * ligne.prixUnitaire),
        montantTVA: Math.round(
          ligne.quantite * ligne.prixUnitaire * ((ligne.tauxTVA || 0) / 100)
        ),
        montantTTC: Math.round(
          ligne.quantite * ligne.prixUnitaire * (1 + (ligne.tauxTVA || 0) / 100)
        ),
      })),
    };
  }

  const facture = await prisma.facture.update({
    where: { id: factureId },
    data: updateData,
    include: {
      client: true,
      lignes: {
        include: {
          produit: true,
        },
      },
    },
  });

  return facture;
};

/**
 * Update invoice status
 */
export const updateFactureStatut = async (
  companyId: string,
  factureId: string,
  statut: string
) => {
  const facture = await prisma.facture.findFirst({
    where: { id: factureId, companyId },
  });

  if (!facture) {
    throw new NotFoundError('Facture non trouvée');
  }

  // Validate status transition
  const validTransitions: Record<string, string[]> = {
    brouillon: ['envoyee', 'annulee'],
    envoyee: ['payee', 'annulee'],
    payee: [],
    annulee: [],
  };

  if (!validTransitions[facture.statut]?.includes(statut)) {
    throw new ValidationError(
      `Transition de statut invalide: ${facture.statut} -> ${statut}`
    );
  }

  const updatedFacture = await prisma.facture.update({
    where: { id: factureId },
    data: { statut },
  });

  // Update client total purchases if invoice is paid
  if (statut === 'payee') {
    await prisma.client.update({
      where: { id: facture.clientId },
      data: {
        totalAchats: {
          increment: facture.montantTTC,
        },
      },
    });
  }

  return updatedFacture;
};

/**
 * Delete invoice (only drafts)
 */
export const deleteFacture = async (companyId: string, factureId: string) => {
  const facture = await prisma.facture.findFirst({
    where: { id: factureId, companyId },
  });

  if (!facture) {
    throw new NotFoundError('Facture non trouvée');
  }

  if (facture.statut !== 'brouillon') {
    throw new ConflictError('Seules les factures en brouillon peuvent être supprimées');
  }

  await prisma.facture.delete({
    where: { id: factureId },
  });

  return true;
};

/**
 * Get invoice statistics
 */
export const getFactureStats = async (companyId: string) => {
  const [totalFactures, facturesByStatut, montantTotal, facturesEnRetard] =
    await Promise.all([
      prisma.facture.count({ where: { companyId } }),
      prisma.facture.groupBy({
        by: ['statut'],
        where: { companyId },
        _count: { id: true },
        _sum: { montantTTC: true },
      }),
      prisma.facture.aggregate({
        where: { companyId, statut: 'payee' },
        _sum: { montantTTC: true },
      }),
      prisma.facture.count({
        where: {
          companyId,
          statut: 'envoyee',
          dateEcheance: { lt: new Date() },
        },
      }),
    ]);

  return {
    totalFactures,
    facturesByStatut: facturesByStatut.map((item) => ({
      statut: item.statut,
      count: item._count.id,
      montant: item._sum.montantTTC || 0,
    })),
    montantTotalPaye: facturesEnRetard,
    chiffreAffaires: montantTotal._sum.montantTTC || 0,
    facturesEnRetard,
  };
};
