// Supplier (Fournisseur) Service for GuinéaManager ERP

import prisma from '../utils/prisma';
import logger from '../utils/logger';

// Types
interface CreateFournisseurData {
  code?: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  ninea?: string;
  contactNom?: string;
  contactTel?: string;
  notes?: string;
}

interface UpdateFournisseurData {
  code?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  ninea?: string;
  contactNom?: string;
  contactTel?: string;
  notes?: string;
  actif?: boolean;
}

interface CreateCommandeFournisseurData {
  fournisseurId: string;
  dateLivraison?: Date;
  notes?: string;
  lignes: Array<{
    produitId: string;
    description?: string;
    quantite: number;
    prixUnitaire: number;
  }>;
}

interface ReceptionCommandeData {
  lignes: Array<{
    ligneId: string;
    quantiteRecue: number;
  }>;
  notes?: string;
}

// ============================================================
// FOURNISSEUR CRUD
// ============================================================

/**
 * Get all suppliers for a company
 */
export async function getFournisseurs(
  companyId: string,
  options?: {
    actif?: boolean;
    search?: string;
    pays?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ fournisseurs: any[]; pagination: any }> {
  const { actif, search, pays, page = 1, limit = 20 } = options || {};

  const where: any = { companyId };

  if (actif !== undefined) where.actif = actif;
  if (pays) where.pays = pays;
  if (search) {
    where.OR = [
      { nom: { contains: search } },
      { code: { contains: search } },
      { email: { contains: search } },
      { telephone: { contains: search } },
    ];
  }

  const [fournisseurs, total] = await Promise.all([
    prisma.fournisseur.findMany({
      where,
      include: {
        _count: {
          select: { commandes: true },
        },
      },
      orderBy: { nom: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.fournisseur.count({ where }),
  ]);

  // Calculate stats for each supplier
  const suppliersWithStats = await Promise.all(
    fournisseurs.map(async (f) => {
      const stats = await prisma.commandeFournisseur.aggregate({
        where: { fournisseurId: f.id, statut: { not: 'ANNULE' } },
        _sum: { montantHT: true },
      });

      return {
        ...f,
        nbCommandes: f._count.commandes,
        totalAchats: stats._sum.montantHT || 0,
      };
    })
  );

  return {
    fournisseurs: suppliersWithStats,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single supplier by ID
 */
export async function getFournisseurById(
  id: string,
  companyId: string
): Promise<any | null> {
  const fournisseur = await prisma.fournisseur.findFirst({
    where: { id, companyId },
    include: {
      commandes: {
        take: 10,
        orderBy: { dateCommande: 'desc' },
        include: {
          _count: { select: { lignes: true } },
        },
      },
    },
  });

  if (!fournisseur) return null;

  // Calculate stats
  const stats = await prisma.commandeFournisseur.aggregate({
    where: { fournisseurId: id, statut: { not: 'ANNULE' } },
    _sum: { montantHT: true, montantTTC: true },
  });

  const enAttente = await prisma.commandeFournisseur.count({
    where: { fournisseurId: id, statut: 'EN_ATTENTE' },
  });

  return {
    ...fournisseur,
    totalAchats: stats._sum.montantHT || 0,
    commandesEnAttente: enAttente,
  };
}

/**
 * Create a new supplier
 */
export async function createFournisseur(
  data: CreateFournisseurData,
  companyId: string,
  userId: string
): Promise<{ success: boolean; fournisseur?: any; error?: string }> {
  try {
    // Check if code is unique
    if (data.code) {
      const existing = await prisma.fournisseur.findFirst({
        where: { code: data.code, companyId },
      });
      if (existing) {
        return { success: false, error: 'Un fournisseur avec ce code existe déjà' };
      }
    }

    const fournisseur = await prisma.fournisseur.create({
      data: {
        ...data,
        companyId,
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_FOURNISSEUR',
        table: 'Fournisseur',
        recordId: fournisseur.id,
        userId,
        companyId,
        details: JSON.stringify(data),
      },
    });

    return { success: true, fournisseur };
  } catch (error) {
    logger.error('Create fournisseur error:', error);
    return { success: false, error: 'Erreur lors de la création du fournisseur' };
  }
}

/**
 * Update a supplier
 */
export async function updateFournisseur(
  id: string,
  data: UpdateFournisseurData,
  companyId: string,
  userId: string
): Promise<{ success: boolean; fournisseur?: any; error?: string }> {
  try {
    // Check if fournisseur exists
    const existing = await prisma.fournisseur.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return { success: false, error: 'Fournisseur non trouvé' };
    }

    // Check if code is unique
    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.fournisseur.findFirst({
        where: { code: data.code, companyId },
      });
      if (duplicate) {
        return { success: false, error: 'Un fournisseur avec ce code existe déjà' };
      }
    }

    const fournisseur = await prisma.fournisseur.update({
      where: { id },
      data,
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_FOURNISSEUR',
        table: 'Fournisseur',
        recordId: id,
        userId,
        companyId,
        details: JSON.stringify(data),
      },
    });

    return { success: true, fournisseur };
  } catch (error) {
    logger.error('Update fournisseur error:', error);
    return { success: false, error: 'Erreur lors de la mise à jour du fournisseur' };
  }
}

/**
 * Delete a supplier
 */
export async function deleteFournisseur(
  id: string,
  companyId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if fournisseur exists
    const existing = await prisma.fournisseur.findFirst({
      where: { id, companyId },
      include: {
        _count: { select: { commandes: true } },
      },
    });
    if (!existing) {
      return { success: false, error: 'Fournisseur non trouvé' };
    }

    // Check if supplier has orders
    if (existing._count.commandes > 0) {
      // Soft delete - just mark as inactive
      await prisma.fournisseur.update({
        where: { id },
        data: { actif: false },
      });

      return {
        success: true,
        error: 'Fournisseur désactivé (possède des commandes)',
      };
    }

    // Hard delete
    await prisma.fournisseur.delete({ where: { id } });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_FOURNISSEUR',
        table: 'Fournisseur',
        recordId: id,
        userId,
        companyId,
      },
    });

    return { success: true };
  } catch (error) {
    logger.error('Delete fournisseur error:', error);
    return { success: false, error: 'Erreur lors de la suppression du fournisseur' };
  }
}

// ============================================================
// PURCHASE ORDERS (COMMANDES FOURNISSEUR)
// ============================================================

/**
 * Get all purchase orders
 */
export async function getCommandesFournisseur(
  companyId: string,
  options?: {
    fournisseurId?: string;
    statut?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ commandes: any[]; pagination: any }> {
  const { fournisseurId, statut, startDate, endDate, search, page = 1, limit = 20 } = options || {};

  const where: any = { companyId };

  if (fournisseurId) where.fournisseurId = fournisseurId;
  if (statut) where.statut = statut;
  if (startDate || endDate) {
    where.dateCommande = {};
    if (startDate) where.dateCommande.gte = startDate;
    if (endDate) where.dateCommande.lte = endDate;
  }
  if (search) {
    where.OR = [
      { numero: { contains: search } },
      { fournisseur: { nom: { contains: search } } },
    ];
  }

  const [commandes, total] = await Promise.all([
    prisma.commandeFournisseur.findMany({
      where,
      include: {
        fournisseur: {
          select: { id: true, nom: true, code: true, telephone: true, email: true },
        },
        _count: { select: { lignes: true } },
      },
      orderBy: { dateCommande: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.commandeFournisseur.count({ where }),
  ]);

  return {
    commandes,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single purchase order by ID
 */
export async function getCommandeFournisseurById(
  id: string,
  companyId: string
): Promise<any | null> {
  return prisma.commandeFournisseur.findFirst({
    where: { id, companyId },
    include: {
      fournisseur: true,
      lignes: {
        include: {
          produit: {
            select: { id: true, nom: true, reference: true, unite: true, prixUnitaire: true },
          },
        },
      },
    },
  });
}

/**
 * Create a new purchase order
 */
export async function createCommandeFournisseur(
  data: CreateCommandeFournisseurData,
  companyId: string,
  userId: string
): Promise<{ success: boolean; commande?: any; error?: string }> {
  try {
    // Verify fournisseur exists
    const fournisseur = await prisma.fournisseur.findFirst({
      where: { id: data.fournisseurId, companyId },
    });
    if (!fournisseur) {
      return { success: false, error: 'Fournisseur non trouvé' };
    }

    // Generate order number
    const count = await prisma.commandeFournisseur.count({ where: { companyId } });
    const numero = `CF-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Calculate totals
    let montantHT = 0;
    const lignes = data.lignes.map((l) => {
      const ligneHT = l.quantite * l.prixUnitaire;
      montantHT += ligneHT;
      return {
        ...l,
        montantHT: ligneHT,
      };
    });

    const montantTVA = 0; // Purchase orders usually don't include TVA calculation
    const montantTTC = montantHT + montantTVA;

    // Create commande
    const commande = await prisma.commandeFournisseur.create({
      data: {
        numero,
        fournisseurId: data.fournisseurId,
        dateLivraison: data.dateLivraison,
        notes: data.notes,
        montantHT,
        montantTVA,
        montantTTC,
        companyId,
        lignes: {
          create: lignes.map((l) => ({
            produitId: l.produitId,
            description: l.description,
            quantite: l.quantite,
            quantiteRecue: 0,
            prixUnitaire: l.prixUnitaire,
            montantHT: l.montantHT,
            recu: false,
          })),
        },
      },
      include: {
        fournisseur: true,
        lignes: { include: { produit: true } },
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_COMMANDE_FOURNISSEUR',
        table: 'CommandeFournisseur',
        recordId: commande.id,
        userId,
        companyId,
        details: JSON.stringify({ numero, fournisseurId: data.fournisseurId, montantHT }),
      },
    });

    return { success: true, commande };
  } catch (error) {
    logger.error('Create commande fournisseur error:', error);
    return { success: false, error: 'Erreur lors de la création de la commande' };
  }
}

/**
 * Update purchase order status
 */
export async function updateCommandeFournisseurStatus(
  id: string,
  statut: string,
  companyId: string,
  userId: string
): Promise<{ success: boolean; commande?: any; error?: string }> {
  try {
    const existing = await prisma.commandeFournisseur.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return { success: false, error: 'Commande non trouvée' };
    }

    const commande = await prisma.commandeFournisseur.update({
      where: { id },
      data: { statut },
      include: {
        fournisseur: true,
        lignes: { include: { produit: true } },
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_COMMANDE_FOURNISSEUR_STATUS',
        table: 'CommandeFournisseur',
        recordId: id,
        userId,
        companyId,
        details: JSON.stringify({ ancienStatut: existing.statut, nouveauStatut: statut }),
      },
    });

    return { success: true, commande };
  } catch (error) {
    logger.error('Update commande status error:', error);
    return { success: false, error: 'Erreur lors de la mise à jour du statut' };
  }
}

/**
 * Receive goods from purchase order
 */
export async function recevoirCommande(
  commandeId: string,
  data: ReceptionCommandeData,
  companyId: string,
  userId: string
): Promise<{ success: boolean; commande?: any; error?: string }> {
  try {
    const commande = await prisma.commandeFournisseur.findFirst({
      where: { id: commandeId, companyId },
      include: { lignes: true },
    });
    if (!commande) {
      return { success: false, error: 'Commande non trouvée' };
    }

    // Update each line
    for (const ligneData of data.lignes) {
      const ligne = commande.lignes.find((l) => l.id === ligneData.ligneId);
      if (!ligne) continue;

      const newQuantiteRecue = ligne.quantiteRecue + ligneData.quantiteRecue;
      const recu = newQuantiteRecue >= ligne.quantite;

      await prisma.ligneCommandeFournisseur.update({
        where: { id: ligne.id },
        data: {
          quantiteRecue: newQuantiteRecue,
          recu,
          dateReception: recu ? new Date() : null,
        },
      });

      // Update product stock
      if (ligneData.quantiteRecue > 0) {
        await prisma.produit.update({
          where: { id: ligne.produitId },
          data: {
            stockActuel: {
              increment: ligneData.quantiteRecue,
            },
          },
        });

        // Log stock movement
        await prisma.auditLog.create({
          data: {
            action: 'STOCK_ENTREE_RECEPTION',
            table: 'Produit',
            recordId: ligne.produitId,
            userId,
            companyId,
            details: JSON.stringify({
              commandeId,
              quantite: ligneData.quantiteRecue,
              reference: commande.numero,
            }),
          },
        });
      }
    }

    // Check if all lines are received
    const updatedLignes = await prisma.ligneCommandeFournisseur.findMany({
      where: { commandeId },
    });
    const allReceived = updatedLignes.every((l) => l.recu);
    const partialReceived = updatedLignes.some((l) => l.quantiteRecue > 0);

    let newStatut = commande.statut;
    if (allReceived) {
      newStatut = 'RECU';
    } else if (partialReceived) {
      newStatut = 'RECU_PARTIEL';
    }

    // Update commande
    const updatedCommande = await prisma.commandeFournisseur.update({
      where: { id: commandeId },
      data: {
        statut: newStatut,
        dateLivraison: allReceived ? new Date() : undefined,
      },
      include: {
        fournisseur: true,
        lignes: { include: { produit: true } },
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'RECEPTION_COMMANDE_FOURNISSEUR',
        table: 'CommandeFournisseur',
        recordId: commandeId,
        userId,
        companyId,
        details: JSON.stringify(data),
      },
    });

    return { success: true, commande: updatedCommande };
  } catch (error) {
    logger.error('Reception commande error:', error);
    return { success: false, error: 'Erreur lors de la réception' };
  }
}

/**
 * Cancel a purchase order
 */
export async function cancelCommandeFournisseur(
  id: string,
  companyId: string,
  userId: string,
  raison?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const commande = await prisma.commandeFournisseur.findFirst({
      where: { id, companyId },
      include: { lignes: true },
    });
    if (!commande) {
      return { success: false, error: 'Commande non trouvée' };
    }

    if (commande.statut === 'RECU') {
      return { success: false, error: 'Impossible d\'annuler une commande déjà reçue' };
    }

    // If partially received, reverse the stock
    if (commande.statut === 'RECU_PARTIEL') {
      for (const ligne of commande.lignes) {
        if (ligne.quantiteRecue > 0) {
          await prisma.produit.update({
            where: { id: ligne.produitId },
            data: {
              stockActuel: {
                decrement: ligne.quantiteRecue,
              },
            },
          });
        }
      }
    }

    await prisma.commandeFournisseur.update({
      where: { id },
      data: { statut: 'ANNULE' },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'CANCEL_COMMANDE_FOURNISSEUR',
        table: 'CommandeFournisseur',
        recordId: id,
        userId,
        companyId,
        details: JSON.stringify({ raison }),
      },
    });

    return { success: true };
  } catch (error) {
    logger.error('Cancel commande error:', error);
    return { success: false, error: 'Erreur lors de l\'annulation' };
  }
}

// ============================================================
// STATISTICS
// ============================================================

/**
 * Get supplier statistics
 */
export async function getFournisseurStats(
  companyId: string
): Promise<{
  totalFournisseurs: number;
  commandesEnCours: number;
  montantEnCours: number;
  montantTotalAchats: number;
}> {
  const [totalFournisseurs, commandesEnCours, stats] = await Promise.all([
    prisma.fournisseur.count({ where: { companyId, actif: true } }),
    prisma.commandeFournisseur.count({
      where: { companyId, statut: { in: ['EN_ATTENTE', 'CONFIRME', 'RECU_PARTIEL'] } },
    }),
    prisma.commandeFournisseur.aggregate({
      where: {
        companyId,
        statut: { in: ['EN_ATTENTE', 'CONFIRME', 'RECU_PARTIEL'] },
      },
      _sum: { montantHT: true },
    }),
    prisma.commandeFournisseur.aggregate({
      where: { companyId, statut: { not: 'ANNULE' } },
      _sum: { montantHT: true },
    }),
  ]);

  return {
    totalFournisseurs,
    commandesEnCours,
    montantEnCours: stats._sum.montantHT || 0,
    montantTotalAchats: (await prisma.commandeFournisseur.aggregate({
      where: { companyId, statut: { not: 'ANNULE' } },
      _sum: { montantHT: true },
    }))._sum.montantHT || 0,
  };
}

export default {
  getFournisseurs,
  getFournisseurById,
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
  getCommandesFournisseur,
  getCommandeFournisseurById,
  createCommandeFournisseur,
  updateCommandeFournisseurStatus,
  recevoirCommande,
  cancelCommandeFournisseur,
  getFournisseurStats,
};
