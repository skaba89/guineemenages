// Quotes & Orders Service for GuinéaManager ERP

import prisma from '../utils/prisma';
import { notifyInvoiceCreated } from './notification.service';

// Types
interface CreateDevisData {
  clientId: string;
  dateValidite: Date;
  lignes: Array<{
    produitId?: string;
    description: string;
    quantite: number;
    prixUnitaire: number;
    tauxTVA?: number;
  }>;
  conditions?: string;
  notes?: string;
  companyId: string;
  userId: string;
}

interface DevisFilters {
  statut?: string;
  clientId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================
// DEVIS (QUOTES) MANAGEMENT
// ============================================================

/**
 * Generate a unique quote number
 */
async function generateDevisNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');

  // Count quotes for this month
  const count = await prisma.devis.count({
    where: {
      companyId,
      createdAt: {
        gte: new Date(year, new Date().getMonth(), 1),
        lt: new Date(year, new Date().getMonth() + 1, 1),
      },
    },
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `DEV${year}${month}-${sequence}`;
}

/**
 * Create a new quote (devis)
 */
export async function createDevis(data: CreateDevisData): Promise<{
  success: boolean;
  devis?: any;
  error?: string;
}> {
  try {
    // Verify client exists
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, companyId: data.companyId },
    });

    if (!client) {
      return { success: false, error: 'Client non trouvé' };
    }

    // Calculate totals
    let montantHT = 0;
    let montantTVA = 0;

    for (const ligne of data.lignes) {
      const ht = ligne.quantite * ligne.prixUnitaire;
      const tva = ht * ((ligne.tauxTVA || 18) / 100);
      montantHT += ht;
      montantTVA += tva;
    }

    const montantTTC = montantHT + montantTVA;

    // Generate quote number
    const numero = await generateDevisNumber(data.companyId);

    // Create quote with lines
    const devis = await prisma.devis.create({
      data: {
        numero,
        clientId: data.clientId,
        dateValidite: data.dateValidite,
        montantHT,
        montantTVA,
        montantTTC,
        conditions: data.conditions,
        notes: data.notes,
        companyId: data.companyId,
        lignes: {
          create: data.lignes.map((ligne, index) => ({
            produitId: ligne.produitId,
            description: ligne.description,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            tauxTVA: ligne.tauxTVA || 0.18,
            montantHT: ligne.quantite * ligne.prixUnitaire,
            montantTVA: ligne.quantite * ligne.prixUnitaire * ((ligne.tauxTVA || 18) / 100),
            montantTTC: ligne.quantite * ligne.prixUnitaire * (1 + (ligne.tauxTVA || 18) / 100),
          })),
        },
      },
      include: {
        lignes: true,
        client: true,
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        table: 'Devis',
        recordId: devis.id,
        userId: data.userId,
        companyId: data.companyId,
        details: JSON.stringify({ numero, montantTTC }),
      },
    });

    return { success: true, devis };
  } catch (error) {
    console.error('Create devis error:', error);
    return { success: false, error: 'Erreur lors de la création du devis' };
  }
}

/**
 * Get all quotes with filters
 */
export async function getDevis(companyId: string, filters?: DevisFilters): Promise<{
  devis: any[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> {
  const { statut, clientId, startDate, endDate, search, page = 1, limit = 20 } = filters || {};

  const where: any = { companyId };

  if (statut) where.statut = statut;
  if (clientId) where.clientId = clientId;
  if (startDate || endDate) {
    where.dateEmission = {};
    if (startDate) where.dateEmission.gte = startDate;
    if (endDate) where.dateEmission.lte = endDate;
  }
  if (search) {
    where.OR = [
      { numero: { contains: search } },
      { client: { nom: { contains: search } } },
    ];
  }

  const [devis, total] = await Promise.all([
    prisma.devis.findMany({
      where,
      include: {
        client: { select: { id: true, nom: true, email: true } },
        lignes: { select: { id: true, description: true, montantTTC: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.devis.count({ where }),
  ]);

  return {
    devis,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single quote by ID
 */
export async function getDevisById(id: string, companyId: string): Promise<any | null> {
  return prisma.devis.findFirst({
    where: { id, companyId },
    include: {
      client: true,
      lignes: {
        include: {
          produit: { select: { id: true, nom: true, reference: true } },
        },
      },
    },
  });
}

/**
 * Update quote status
 */
export async function updateDevisStatus(
  id: string,
  statut: 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE' | 'EXPIRE',
  companyId: string,
  userId: string
): Promise<{ success: boolean; devis?: any; error?: string }> {
  try {
    const devis = await prisma.devis.findFirst({
      where: { id, companyId },
    });

    if (!devis) {
      return { success: false, error: 'Devis non trouvé' };
    }

    const updated = await prisma.devis.update({
      where: { id },
      data: { statut },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_STATUS',
        table: 'Devis',
        recordId: id,
        userId,
        companyId,
        details: JSON.stringify({ numero: devis.numero, nouveauStatut: statut }),
      },
    });

    return { success: true, devis: updated };
  } catch (error) {
    console.error('Update devis status error:', error);
    return { success: false, error: 'Erreur lors de la mise à jour' };
  }
}

/**
 * Convert quote to invoice
 */
export async function convertDevisToFacture(
  devisId: string,
  companyId: string,
  userId: string
): Promise<{ success: boolean; facture?: any; error?: string }> {
  try {
    const devis = await prisma.devis.findFirst({
      where: { id: devisId, companyId },
      include: {
        client: true,
        lignes: true,
      },
    });

    if (!devis) {
      return { success: false, error: 'Devis non trouvé' };
    }

    if (devis.statut !== 'ACCEPTE' && devis.statut !== 'ENVOYE') {
      return { success: false, error: 'Le devis doit être accepté ou envoyé pour être converti' };
    }

    // Generate invoice number
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await prisma.facture.count({
      where: {
        companyId,
        createdAt: {
          gte: new Date(year, new Date().getMonth(), 1),
          lt: new Date(year, new Date().getMonth() + 1, 1),
        },
      },
    });
    const numero = `FAC${year}${month}-${String(count + 1).padStart(4, '0')}`;

    // Create invoice
    const facture = await prisma.facture.create({
      data: {
        numero,
        clientId: devis.clientId,
        dateEmission: new Date(),
        dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        montantHT: devis.montantHT,
        montantTVA: devis.montantTVA,
        montantTTC: devis.montantTTC,
        statut: 'BROUILLON',
        notes: devis.notes,
        conditions: devis.conditions,
        companyId,
        lignes: {
          create: devis.lignes.map((ligne) => ({
            produitId: ligne.produitId,
            description: ligne.description,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            tauxTVA: ligne.tauxTVA,
            montantHT: ligne.montantHT,
            montantTVA: ligne.montantTVA,
            montantTTC: ligne.montantTTC,
          })),
        },
      },
      include: {
        lignes: true,
        client: true,
      },
    });

    // Update quote with invoice reference
    await prisma.devis.update({
      where: { id: devisId },
      data: {
        statut: 'ACCEPTE',
        factureId: facture.id,
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'CONVERT_TO_FACTURE',
        table: 'Devis',
        recordId: devisId,
        userId,
        companyId,
        details: JSON.stringify({
          devisNumero: devis.numero,
          factureNumero: numero,
        }),
      },
    });

    return { success: true, facture };
  } catch (error) {
    console.error('Convert devis to facture error:', error);
    return { success: false, error: 'Erreur lors de la conversion' };
  }
}

/**
 * Delete a quote
 */
export async function deleteDevis(
  id: string,
  companyId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const devis = await prisma.devis.findFirst({
      where: { id, companyId },
    });

    if (!devis) {
      return { success: false, error: 'Devis non trouvé' };
    }

    if (devis.statut === 'ACCEPTE' && devis.factureId) {
      return { success: false, error: 'Ce devis a déjà été converti en facture' };
    }

    // Delete quote lines first
    await prisma.ligneDevis.deleteMany({
      where: { devisId: id },
    });

    // Delete quote
    await prisma.devis.delete({
      where: { id },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        table: 'Devis',
        recordId: id,
        userId,
        companyId,
        details: JSON.stringify({ numero: devis.numero }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Delete devis error:', error);
    return { success: false, error: 'Erreur lors de la suppression' };
  }
}

/**
 * Get quote statistics
 */
export async function getDevisStats(companyId: string): Promise<{
  total: number;
  byStatut: Record<string, number>;
  montantTotal: number;
  tauxConversion: number;
}> {
  const [total, byStatut, acceptes, montantTotal] = await Promise.all([
    prisma.devis.count({ where: { companyId } }),
    prisma.devis.groupBy({
      by: ['statut'],
      where: { companyId },
      _count: { id: true },
    }),
    prisma.devis.count({
      where: { companyId, statut: 'ACCEPTE' },
    }),
    prisma.devis.aggregate({
      where: { companyId },
      _sum: { montantTTC: true },
    }),
  ]);

  const statutCounts: Record<string, number> = {};
  byStatut.forEach((item) => {
    statutCounts[item.statut] = item._count.id;
  });

  return {
    total,
    byStatut: statutCounts,
    montantTotal: montantTotal._sum.montantTTC || 0,
    tauxConversion: total > 0 ? (acceptes / total) * 100 : 0,
  };
}

/**
 * Check for expired quotes and update status
 */
export async function checkExpiredDevis(companyId: string): Promise<number> {
  const result = await prisma.devis.updateMany({
    where: {
      companyId,
      statut: { in: ['BROUILLON', 'ENVOYE'] },
      dateValidite: { lt: new Date() },
    },
    data: {
      statut: 'EXPIRE',
    },
  });

  return result.count;
}

export default {
  createDevis,
  getDevis,
  getDevisById,
  updateDevisStatus,
  convertDevisToFacture,
  deleteDevis,
  getDevisStats,
  checkExpiredDevis,
};
