// Orders/Sales (Commande Client) Service for GuinéaManager ERP

import prisma from '../utils/prisma';
import logger from '../utils/logger';

// Types
interface CreateCommandeClientData {
  clientId: string;
  dateLivraison?: Date;
  adresseLivraison?: string;
  notes?: string;
  devisId?: string;
  lignes: Array<{
    produitId?: string;
    description: string;
    quantite: number;
    prixUnitaire: number;
    tauxTVA?: number;
  }>;
}

interface UpdateCommandeClientData {
  dateLivraison?: Date;
  adresseLivraison?: string;
  notes?: string;
  statut?: string;
}

interface CreateBonLivraisonData {
  commandeId: string;
  adresse?: string;
  notes?: string;
  lignes: Array<{
    produitId?: string;
    description: string;
    quantite: number;
  }>;
}

// ============================================================
// COMMANDE CLIENT CRUD
// ============================================================

/**
 * Get all client orders
 */
export async function getCommandesClient(
  companyId: string,
  options?: {
    clientId?: string;
    statut?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ commandes: any[]; pagination: any }> {
  const { clientId, statut, startDate, endDate, search, page = 1, limit = 20 } = options || {};

  const where: any = { companyId };

  if (clientId) where.clientId = clientId;
  if (statut) where.statut = statut;
  if (startDate || endDate) {
    where.dateCommande = {};
    if (startDate) where.dateCommande.gte = startDate;
    if (endDate) where.dateCommande.lte = endDate;
  }
  if (search) {
    where.OR = [
      { numero: { contains: search } },
      { client: { nom: { contains: search } } },
    ];
  }

  const [commandes, total] = await Promise.all([
    prisma.commandeClient.findMany({
      where,
      include: {
        client: {
          select: { id: true, nom: true, email: true, telephone: true },
        },
        _count: { select: { lignes: true } },
        bonLivraison: { select: { id: true, numero: true, statut: true } },
      },
      orderBy: { dateCommande: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.commandeClient.count({ where }),
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
 * Get a single order by ID
 */
export async function getCommandeClientById(
  id: string,
  companyId: string
): Promise<any | null> {
  return prisma.commandeClient.findFirst({
    where: { id, companyId },
    include: {
      client: true,
      lignes: {
        include: {
          produit: {
            select: { id: true, nom: true, reference: true, unite: true, prixUnitaire: true },
          },
        },
      },
      bonLivraison: {
        include: {
          lignes: true,
        },
      },
    },
  });
}

/**
 * Create a new order
 */
export async function createCommandeClient(
  data: CreateCommandeClientData,
  companyId: string,
  userId: string
): Promise<{ success: boolean; commande?: any; error?: string }> {
  try {
    // Verify client exists
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, companyId },
    });
    if (!client) {
      return { success: false, error: 'Client non trouvé' };
    }

    // Generate order number
    const count = await prisma.commandeClient.count({ where: { companyId } });
    const numero = `CMD-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Calculate totals
    let montantHT = 0;
    let montantTVA = 0;
    const lignes = data.lignes.map((l) => {
      const ligneHT = l.quantite * l.prixUnitaire;
      const tva = l.tauxTVA ?? 0.18;
      const ligneTVA = Math.round(ligneHT * tva);
      montantHT += ligneHT;
      montantTVA += ligneTVA;
      return {
        ...l,
        montantHT: ligneHT,
        montantTVA: ligneTVA,
        montantTTC: ligneHT + ligneTVA,
        tauxTVA: tva,
      };
    });

    const montantTTC = montantHT + montantTVA;

    // Create commande
    const commande = await prisma.commandeClient.create({
      data: {
        numero,
        clientId: data.clientId,
        dateLivraison: data.dateLivraison,
        adresseLivraison: data.adresseLivraison,
        notes: data.notes,
        devisId: data.devisId,
        montantHT,
        montantTVA,
        montantTTC,
        companyId,
        lignes: {
          create: lignes.map((l) => ({
            produitId: l.produitId,
            description: l.description,
            quantite: l.quantite,
            quantiteLivree: 0,
            prixUnitaire: l.prixUnitaire,
            tauxTVA: l.tauxTVA,
            montantHT: l.montantHT,
            montantTVA: l.montantTVA,
            montantTTC: l.montantTTC,
          })),
        },
      },
      include: {
        client: true,
        lignes: { include: { produit: true } },
      },
    });

    // Update client total
    await prisma.client.update({
      where: { id: data.clientId },
      data: {
        totalAchats: { increment: montantTTC },
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_COMMANDE_CLIENT',
        table: 'CommandeClient',
        recordId: commande.id,
        userId,
        companyId,
        details: JSON.stringify({ numero, clientId: data.clientId, montantTTC }),
      },
    });

    return { success: true, commande };
  } catch (error) {
    logger.error('Create commande client error:', error);
    return { success: false, error: 'Erreur lors de la création de la commande' };
  }
}

/**
 * Update an order
 */
export async function updateCommandeClient(
  id: string,
  data: UpdateCommandeClientData,
  companyId: string,
  userId: string
): Promise<{ success: boolean; commande?: any; error?: string }> {
  try {
    const existing = await prisma.commandeClient.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return { success: false, error: 'Commande non trouvée' };
    }

    // Cannot update if already delivered
    if (existing.statut === 'LIVRE' || existing.statut === 'ANNULE') {
      return { success: false, error: 'Impossible de modifier cette commande' };
    }

    const commande = await prisma.commandeClient.update({
      where: { id },
      data,
      include: {
        client: true,
        lignes: { include: { produit: true } },
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_COMMANDE_CLIENT',
        table: 'CommandeClient',
        recordId: id,
        userId,
        companyId,
        details: JSON.stringify(data),
      },
    });

    return { success: true, commande };
  } catch (error) {
    logger.error('Update commande client error:', error);
    return { success: false, error: 'Erreur lors de la mise à jour' };
  }
}

/**
 * Update order status
 */
export async function updateCommandeClientStatus(
  id: string,
  statut: string,
  companyId: string,
  userId: string
): Promise<{ success: boolean; commande?: any; error?: string }> {
  try {
    const existing = await prisma.commandeClient.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return { success: false, error: 'Commande non trouvée' };
    }

    const commande = await prisma.commandeClient.update({
      where: { id },
      data: { statut },
      include: {
        client: true,
        lignes: { include: { produit: true } },
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_COMMANDE_STATUS',
        table: 'CommandeClient',
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
 * Cancel an order
 */
export async function cancelCommandeClient(
  id: string,
  companyId: string,
  userId: string,
  raison?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const commande = await prisma.commandeClient.findFirst({
      where: { id, companyId },
    });
    if (!commande) {
      return { success: false, error: 'Commande non trouvée' };
    }

    if (commande.statut === 'LIVRE') {
      return { success: false, error: 'Impossible d\'annuler une commande déjà livrée' };
    }

    await prisma.$transaction([
      prisma.commandeClient.update({
        where: { id },
        data: { statut: 'ANNULE' },
      }),
      // Reverse client total
      prisma.client.update({
        where: { id: commande.clientId },
        data: {
          totalAchats: { decrement: commande.montantTTC },
        },
      }),
    ]);

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'CANCEL_COMMANDE_CLIENT',
        table: 'CommandeClient',
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
// BON DE LIVRAISON
// ============================================================

/**
 * Create a delivery note
 */
export async function createBonLivraison(
  data: CreateBonLivraisonData,
  companyId: string,
  userId: string
): Promise<{ success: boolean; bonLivraison?: any; error?: string }> {
  try {
    const commande = await prisma.commandeClient.findFirst({
      where: { id: data.commandeId, companyId },
      include: { lignes: true, client: true },
    });
    if (!commande) {
      return { success: false, error: 'Commande non trouvée' };
    }

    // Check if delivery note already exists
    const existingBL = await prisma.bonLivraison.findFirst({
      where: { commandeId: data.commandeId },
    });
    if (existingBL) {
      return { success: false, error: 'Un bon de livraison existe déjà pour cette commande' };
    }

    // Generate delivery note number
    const count = await prisma.bonLivraison.count({ where: { companyId } });
    const numero = `BL-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Create delivery note
    const bonLivraison = await prisma.bonLivraison.create({
      data: {
        numero,
        commandeId: data.commandeId,
        adresse: data.adresse || commande.adresseLivraison || commande.client?.adresse,
        notes: data.notes,
        companyId,
        lignes: {
          create: data.lignes.map((l) => ({
            produitId: l.produitId,
            description: l.description,
            quantite: l.quantite,
          })),
        },
      },
      include: {
        commande: {
          include: { client: true },
        },
        lignes: true,
      },
    });

    // Update order lines with delivered quantities
    for (const ligneData of data.lignes) {
      const commandeLigne = commande.lignes.find(
        (l) => l.produitId === ligneData.produitId
      );
      if (commandeLigne) {
        await prisma.ligneCommandeClient.update({
          where: { id: commandeLigne.id },
          data: {
            quantiteLivree: { increment: ligneData.quantite },
          },
        });

        // Update product stock
        if (ligneData.produitId) {
          await prisma.produit.update({
            where: { id: ligneData.produitId },
            data: {
              stockActuel: { decrement: ligneData.quantite },
            },
          });

          // Log stock movement
          await prisma.auditLog.create({
            data: {
              action: 'STOCK_SORTIE_LIVRAISON',
              table: 'Produit',
              recordId: ligneData.produitId,
              userId,
              companyId,
              details: JSON.stringify({
                commandeId: data.commandeId,
                bonLivraisonId: bonLivraison.id,
                quantite: ligneData.quantite,
              }),
            },
          });
        }
      }
    }

    // Check if all lines are delivered
    const updatedLignes = await prisma.ligneCommandeClient.findMany({
      where: { commandeId: data.commandeId },
    });
    const allDelivered = updatedLignes.every((l) => l.quantiteLivree >= l.quantite);

    // Update order status
    const newStatut = allDelivered ? 'LIVRE' : 'EXPEDIE';
    await prisma.commandeClient.update({
      where: { id: data.commandeId },
      data: {
        statut: newStatut,
        dateLivraison: allDelivered ? new Date() : undefined,
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_BON_LIVRAISON',
        table: 'BonLivraison',
        recordId: bonLivraison.id,
        userId,
        companyId,
        details: JSON.stringify({ numero, commandeId: data.commandeId }),
      },
    });

    return { success: true, bonLivraison };
  } catch (error) {
    logger.error('Create bon livraison error:', error);
    return { success: false, error: 'Erreur lors de la création du bon de livraison' };
  }
}

/**
 * Get all delivery notes
 */
export async function getBonsLivraison(
  companyId: string,
  options?: {
    statut?: string;
    commandeId?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ bonsLivraison: any[]; pagination: any }> {
  const { statut, commandeId, startDate, endDate, search, page = 1, limit = 20 } = options || {};

  const where: any = { companyId };

  if (statut) where.statut = statut;
  if (commandeId) where.commandeId = commandeId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }
  if (search) {
    where.OR = [
      { numero: { contains: search } },
      { nomSignataire: { contains: search } },
    ];
  }

  const [bonsLivraison, total] = await Promise.all([
    prisma.bonLivraison.findMany({
      where,
      include: {
        commande: {
          include: {
            client: { select: { id: true, nom: true, email: true, telephone: true } },
          },
        },
        lignes: {
          include: {
            produit: { select: { id: true, nom: true, reference: true, unite: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bonLivraison.count({ where }),
  ]);

  return {
    bonsLivraison,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get delivery note by ID
 */
export async function getBonLivraisonById(
  id: string,
  companyId: string
): Promise<any | null> {
  return prisma.bonLivraison.findFirst({
    where: { id, companyId },
    include: {
      commande: {
        include: {
          client: true,
          lignes: { include: { produit: true } },
        },
      },
      lignes: {
        include: {
          produit: { select: { id: true, nom: true, reference: true, unite: true } },
        },
      },
    },
  });
}

/**
 * Sign a delivery note
 */
export async function signBonLivraison(
  id: string,
  signature: string,
  nomSignataire: string,
  companyId: string,
  userId: string
): Promise<{ success: boolean; bonLivraison?: any; error?: string }> {
  try {
    const bonLivraison = await prisma.bonLivraison.findFirst({
      where: { id, companyId },
      include: { commande: true },
    });
    if (!bonLivraison) {
      return { success: false, error: 'Bon de livraison non trouvé' };
    }

    const updated = await prisma.bonLivraison.update({
      where: { id },
      data: {
        signature,
        nomSignataire,
        statut: 'LIVRE',
      },
      include: {
        commande: { include: { client: true } },
        lignes: true,
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'SIGN_BON_LIVRAISON',
        table: 'BonLivraison',
        recordId: id,
        userId,
        companyId,
        details: JSON.stringify({ nomSignataire }),
      },
    });

    return { success: true, bonLivraison: updated };
  } catch (error) {
    logger.error('Sign bon livraison error:', error);
    return { success: false, error: 'Erreur lors de la signature' };
  }
}

// ============================================================
// CONVERT TO INVOICE
// ============================================================

/**
 * Convert order to invoice
 */
export async function convertirEnFacture(
  commandeId: string,
  companyId: string,
  userId: string
): Promise<{ success: boolean; facture?: any; error?: string }> {
  try {
    const commande = await prisma.commandeClient.findFirst({
      where: { id: commandeId, companyId },
      include: {
        client: true,
        lignes: { include: { produit: true } },
      },
    });
    if (!commande) {
      return { success: false, error: 'Commande non trouvée' };
    }

    // Check if already converted
    if (commande.factureId) {
      return { success: false, error: 'Cette commande a déjà été facturée' };
    }

    // Generate invoice number
    const factureCount = await prisma.facture.count({ where: { companyId } });
    const factureNumero = `FAC-${new Date().getFullYear()}-${String(factureCount + 1).padStart(5, '0')}`;

    // Calculate due date (30 days)
    const dateEcheance = new Date();
    dateEcheance.setDate(dateEcheance.getDate() + 30);

    // Create invoice
    const facture = await prisma.facture.create({
      data: {
        numero: factureNumero,
        clientId: commande.clientId,
        dateEmission: new Date(),
        dateEcheance,
        montantHT: commande.montantHT,
        montantTVA: commande.montantTVA,
        montantTTC: commande.montantTTC,
        statut: 'BROUILLON',
        notes: `Facture générée depuis la commande ${commande.numero}`,
        companyId,
        lignes: {
          create: commande.lignes.map((l) => ({
            produitId: l.produitId,
            description: l.description,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            tauxTVA: l.tauxTVA,
            montantHT: l.montantHT,
            montantTVA: l.montantTVA,
            montantTTC: l.montantTTC,
          })),
        },
      },
      include: {
        client: true,
        lignes: { include: { produit: true } },
      },
    });

    // Link invoice to order
    await prisma.commandeClient.update({
      where: { id: commandeId },
      data: { factureId: facture.id },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'CONVERT_COMMANDE_TO_FACTURE',
        table: 'Facture',
        recordId: facture.id,
        userId,
        companyId,
        details: JSON.stringify({
          commandeId,
          commandeNumero: commande.numero,
          factureNumero,
        }),
      },
    });

    return { success: true, facture };
  } catch (error) {
    logger.error('Convert to facture error:', error);
    return { success: false, error: 'Erreur lors de la conversion en facture' };
  }
}

// ============================================================
// STATISTICS
// ============================================================

/**
 * Get order statistics
 */
export async function getCommandeClientStats(
  companyId: string
): Promise<{
  totalCommandes: number;
  commandesEnCours: number;
  commandesLivrees: number;
  montantEnCours: number;
  montantTotal: number;
}> {
  const [total, enCours, livrees, statsEnCours, statsTotal] = await Promise.all([
    prisma.commandeClient.count({ where: { companyId } }),
    prisma.commandeClient.count({
      where: { companyId, statut: { in: ['EN_ATTENTE', 'CONFIRME', 'EN_PREPARATION', 'EXPEDIE'] } },
    }),
    prisma.commandeClient.count({ where: { companyId, statut: 'LIVRE' } }),
    prisma.commandeClient.aggregate({
      where: { companyId, statut: { in: ['EN_ATTENTE', 'CONFIRME', 'EN_PREPARATION', 'EXPEDIE'] } },
      _sum: { montantTTC: true },
    }),
    prisma.commandeClient.aggregate({
      where: { companyId, statut: { not: 'ANNULE' } },
      _sum: { montantTTC: true },
    }),
  ]);

  return {
    totalCommandes: total,
    commandesEnCours: enCours,
    commandesLivrees: livrees,
    montantEnCours: statsEnCours._sum.montantTTC || 0,
    montantTotal: statsTotal._sum.montantTTC || 0,
  };
}

export default {
  getCommandesClient,
  getCommandeClientById,
  createCommandeClient,
  updateCommandeClient,
  updateCommandeClientStatus,
  cancelCommandeClient,
  createBonLivraison,
  getBonLivraisonById,
  signBonLivraison,
  convertirEnFacture,
  getCommandeClientStats,
};
