// Warehouse (Entrepot) Service for GuinéaManager ERP

import prisma from '../utils/prisma';
import logger from '../utils/logger';

// Types
interface CreateEntrepotData {
  nom: string;
  code?: string;
  adresse?: string;
  ville?: string;
  responsable?: string;
  telephone?: string;
  email?: string;
}

interface UpdateEntrepotData {
  nom?: string;
  code?: string;
  adresse?: string;
  ville?: string;
  responsable?: string;
  telephone?: string;
  email?: string;
  actif?: boolean;
}

interface StockTransferData {
  entrepotSourceId: string;
  entrepotDestId: string;
  produits: Array<{
    produitId: string;
    quantite: number;
    notes?: string;
  }>;
  notes?: string;
}

// ============================================================
// ENTREPOT CRUD
// ============================================================

/**
 * Get all warehouses for a company
 */
export async function getEntrepots(
  companyId: string,
  options?: {
    actif?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ entrepots: any[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
  const { actif, search, page = 1, limit = 20 } = options || {};

  const where: any = { companyId };

  if (actif !== undefined) where.actif = actif;
  if (search) {
    where.OR = [
      { nom: { contains: search } },
      { code: { contains: search } },
      { ville: { contains: search } },
    ];
  }

  const [entrepots, total] = await Promise.all([
    prisma.entrepot.findMany({
      where,
      include: {
        _count: {
          select: { stocks: true },
        },
      },
      orderBy: { nom: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.entrepot.count({ where }),
  ]);

  return {
    entrepots: entrepots.map((e) => ({
      ...e,
      nbProduits: e._count.stocks,
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single warehouse by ID
 */
export async function getEntrepotById(
  id: string,
  companyId: string
): Promise<any | null> {
  const entrepot = await prisma.entrepot.findFirst({
    where: { id, companyId },
    include: {
      stocks: {
        include: {
          produit: {
            select: {
              id: true,
              nom: true,
              reference: true,
              unite: true,
              prixUnitaire: true,
            },
          },
        },
      },
    },
  });

  if (!entrepot) return null;

  // Calculate totals
  const totalProduits = entrepot.stocks.length;
  const totalQuantite = entrepot.stocks.reduce((sum, s) => sum + s.quantite, 0);
  const valeurTotale = entrepot.stocks.reduce(
    (sum, s) => sum + s.quantite * (s.produit?.prixUnitaire || 0),
    0
  );

  return {
    ...entrepot,
    totalProduits,
    totalQuantite,
    valeurTotale,
  };
}

/**
 * Create a new warehouse
 */
export async function createEntrepot(
  data: CreateEntrepotData,
  companyId: string,
  userId: string
): Promise<{ success: boolean; entrepot?: any; error?: string }> {
  try {
    // Check if code is unique
    if (data.code) {
      const existing = await prisma.entrepot.findFirst({
        where: { code: data.code, companyId },
      });
      if (existing) {
        return { success: false, error: 'Un entrepôt avec ce code existe déjà' };
      }
    }

    const entrepot = await prisma.entrepot.create({
      data: {
        ...data,
        companyId,
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_ENTREPOT',
        table: 'Entrepot',
        recordId: entrepot.id,
        userId,
        companyId,
        details: JSON.stringify(data),
      },
    });

    return { success: true, entrepot };
  } catch (error) {
    logger.error('Create entrepot error:', error);
    return { success: false, error: 'Erreur lors de la création de l\'entrepôt' };
  }
}

/**
 * Update a warehouse
 */
export async function updateEntrepot(
  id: string,
  data: UpdateEntrepotData,
  companyId: string,
  userId: string
): Promise<{ success: boolean; entrepot?: any; error?: string }> {
  try {
    // Check if entrepot exists
    const existing = await prisma.entrepot.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return { success: false, error: 'Entrepôt non trouvé' };
    }

    // Check if code is unique
    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.entrepot.findFirst({
        where: { code: data.code, companyId },
      });
      if (duplicate) {
        return { success: false, error: 'Un entrepôt avec ce code existe déjà' };
      }
    }

    const entrepot = await prisma.entrepot.update({
      where: { id },
      data,
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_ENTREPOT',
        table: 'Entrepot',
        recordId: id,
        userId,
        companyId,
        details: JSON.stringify(data),
      },
    });

    return { success: true, entrepot };
  } catch (error) {
    logger.error('Update entrepot error:', error);
    return { success: false, error: 'Erreur lors de la mise à jour de l\'entrepôt' };
  }
}

/**
 * Delete a warehouse
 */
export async function deleteEntrepot(
  id: string,
  companyId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if entrepot exists
    const existing = await prisma.entrepot.findFirst({
      where: { id, companyId },
      include: {
        _count: { select: { stocks: true } },
      },
    });
    if (!existing) {
      return { success: false, error: 'Entrepôt non trouvé' };
    }

    // Check if warehouse has stock
    if (existing._count.stocks > 0) {
      return {
        success: false,
        error: 'Impossible de supprimer un entrepôt contenant du stock. Transférez d\'abord le stock.',
      };
    }

    // Delete
    await prisma.entrepot.delete({ where: { id } });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_ENTREPOT',
        table: 'Entrepot',
        recordId: id,
        userId,
        companyId,
      },
    });

    return { success: true };
  } catch (error) {
    logger.error('Delete entrepot error:', error);
    return { success: false, error: 'Erreur lors de la suppression de l\'entrepôt' };
  }
}

// ============================================================
// STOCK MANAGEMENT BY WAREHOUSE
// ============================================================

/**
 * Get stock for a warehouse
 */
export async function getStockEntrepot(
  entrepotId: string,
  companyId: string,
  options?: {
    search?: string;
    lowStock?: boolean;
    page?: number;
    limit?: number;
  }
): Promise<{ stocks: any[]; pagination: any }> {
  const { search, lowStock, page = 1, limit = 50 } = options || {};

  // Verify entrepot belongs to company
  const entrepot = await prisma.entrepot.findFirst({
    where: { id: entrepotId, companyId },
  });
  if (!entrepot) {
    return { stocks: [], pagination: { total: 0, page, limit, totalPages: 0 } };
  }

  const where: any = { entrepotId };

  if (search) {
    where.produit = {
      OR: [
        { nom: { contains: search } },
        { reference: { contains: search } },
      ],
    };
  }

  const stocks = await prisma.stockEntrepot.findMany({
    where,
    include: {
      produit: {
        select: {
          id: true,
          nom: true,
          reference: true,
          unite: true,
          prixUnitaire: true,
          stockMin: true,
          stockMax: true,
        },
      },
    },
    orderBy: { produit: { nom: 'asc' } },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Filter low stock if requested
  let filteredStocks = stocks;
  if (lowStock) {
    filteredStocks = stocks.filter(
      (s) => s.quantite <= (s.quantiteMin || s.produit?.stockMin || 0)
    );
  }

  const total = await prisma.stockEntrepot.count({ where });

  return {
    stocks: filteredStocks,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update stock in a warehouse
 */
export async function updateStockEntrepot(
  entrepotId: string,
  produitId: string,
  quantite: number,
  companyId: string,
  userId: string,
  raison?: string
): Promise<{ success: boolean; stock?: any; error?: string }> {
  try {
    // Verify entrepot belongs to company
    const entrepot = await prisma.entrepot.findFirst({
      where: { id: entrepotId, companyId },
    });
    if (!entrepot) {
      return { success: false, error: 'Entrepôt non trouvé' };
    }

    // Find or create stock entry
    let stock = await prisma.stockEntrepot.findUnique({
      where: {
        entrepotId_produitId: { entrepotId, produitId },
      },
    });

    const oldQuantite = stock?.quantite || 0;

    if (stock) {
      stock = await prisma.stockEntrepot.update({
        where: { id: stock.id },
        data: { quantite },
        include: { produit: true },
      });
    } else {
      stock = await prisma.stockEntrepot.create({
        data: {
          entrepotId,
          produitId,
          quantite,
          companyId,
        },
        include: { produit: true },
      });
    }

    // Update global product stock
    await updateGlobalProductStock(produitId, companyId);

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_STOCK_ENTREPOT',
        table: 'StockEntrepot',
        recordId: stock.id,
        userId,
        companyId,
        details: JSON.stringify({
          entrepotId,
          produitId,
          ancienneQuantite: oldQuantite,
          nouvelleQuantite: quantite,
          raison,
        }),
      },
    });

    return { success: true, stock };
  } catch (error) {
    logger.error('Update stock entrepot error:', error);
    return { success: false, error: 'Erreur lors de la mise à jour du stock' };
  }
}

/**
 * Transfer stock between warehouses
 */
export async function transferStock(
  data: StockTransferData,
  companyId: string,
  userId: string
): Promise<{ success: boolean; transfert?: any; error?: string }> {
  try {
    // Verify warehouses exist
    const [source, dest] = await Promise.all([
      prisma.entrepot.findFirst({
        where: { id: data.entrepotSourceId, companyId },
      }),
      prisma.entrepot.findFirst({
        where: { id: data.entrepotDestId, companyId },
      }),
    ]);

    if (!source) {
      return { success: false, error: 'Entrepôt source non trouvé' };
    }
    if (!dest) {
      return { success: false, error: 'Entrepôt destination non trouvé' };
    }
    if (source.id === dest.id) {
      return { success: false, error: 'L\'entrepôt source et destination doivent être différents' };
    }

    // Generate transfer number
    const transfertCount = await prisma.transfertStock.count({
      where: { companyId },
    });
    const numero = `TRF-${String(transfertCount + 1).padStart(5, '0')}`;

    // Create transfert with lignes
    const transfert = await prisma.transfertStock.create({
      data: {
        numero,
        entrepotSourceId: data.entrepotSourceId,
        entrepotDestId: data.entrepotDestId,
        notes: data.notes,
        companyId,
        statut: 'EN_COURS',
        lignes: {
          create: data.produits.map((p) => ({
            produitId: p.produitId,
            quantite: p.quantite,
            notes: p.notes,
          })),
        },
      },
      include: {
        lignes: { include: { produit: true } },
      },
    });

    // Process stock transfer
    for (const ligne of data.produits) {
      // Check source stock
      const sourceStock = await prisma.stockEntrepot.findUnique({
        where: {
          entrepotId_produitId: {
            entrepotId: data.entrepotSourceId,
            produitId: ligne.produitId,
          },
        },
      });

      if (!sourceStock || sourceStock.quantite < ligne.quantite) {
        // Rollback transfert
        await prisma.transfertStock.delete({ where: { id: transfert.id } });
        return {
          success: false,
          error: `Stock insuffisant pour le produit ${ligne.produitId}`,
        };
      }

      // Decrease source stock
      await prisma.stockEntrepot.update({
        where: { id: sourceStock.id },
        data: { quantite: sourceStock.quantite - ligne.quantite },
      });

      // Increase dest stock
      const destStock = await prisma.stockEntrepot.findUnique({
        where: {
          entrepotId_produitId: {
            entrepotId: data.entrepotDestId,
            produitId: ligne.produitId,
          },
        },
      });

      if (destStock) {
        await prisma.stockEntrepot.update({
          where: { id: destStock.id },
          data: { quantite: destStock.quantite + ligne.quantite },
        });
      } else {
        await prisma.stockEntrepot.create({
          data: {
            entrepotId: data.entrepotDestId,
            produitId: ligne.produitId,
            quantite: ligne.quantite,
            companyId,
          },
        });
      }

      // Update global product stock
      await updateGlobalProductStock(ligne.produitId, companyId);
    }

    // Update transfert status
    const completedTransfert = await prisma.transfertStock.update({
      where: { id: transfert.id },
      data: { statut: 'TERMINE' },
      include: {
        entrepotSource: true,
        entrepotDest: true,
        lignes: { include: { produit: true } },
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'TRANSFER_STOCK',
        table: 'TransfertStock',
        recordId: transfert.id,
        userId,
        companyId,
        details: JSON.stringify(data),
      },
    });

    return { success: true, transfert: completedTransfert };
  } catch (error) {
    logger.error('Transfer stock error:', error);
    return { success: false, error: 'Erreur lors du transfert de stock' };
  }
}

/**
 * Get transfert history
 */
export async function getTransferts(
  companyId: string,
  options?: {
    entrepotId?: string;
    statut?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }
): Promise<{ transferts: any[]; pagination: any }> {
  const { entrepotId, statut, startDate, endDate, page = 1, limit = 20 } = options || {};

  const where: any = { companyId };

  if (entrepotId) {
    where.OR = [
      { entrepotSourceId: entrepotId },
      { entrepotDestId: entrepotId },
    ];
  }
  if (statut) where.statut = statut;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  const [transferts, total] = await Promise.all([
    prisma.transfertStock.findMany({
      where,
      include: {
        entrepotSource: { select: { id: true, nom: true, code: true } },
        entrepotDest: { select: { id: true, nom: true, code: true } },
        lignes: {
          include: {
            produit: { select: { id: true, nom: true, reference: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transfertStock.count({ where }),
  ]);

  return {
    transferts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Update global product stock (sum of all warehouses)
 */
async function updateGlobalProductStock(
  produitId: string,
  companyId: string
): Promise<void> {
  const stocks = await prisma.stockEntrepot.findMany({
    where: { produitId },
    select: { quantite: true },
  });

  const totalStock = stocks.reduce((sum, s) => sum + s.quantite, 0);

  await prisma.produit.update({
    where: { id: produitId },
    data: { stockActuel: totalStock },
  });
}

/**
 * Get stock summary across all warehouses
 */
export async function getStockSummary(
  companyId: string
): Promise<{
  totalEntrepots: number;
  totalProduits: number;
  totalValeur: number;
  lowStockProducts: number;
}> {
  const [totalEntrepots, stocks] = await Promise.all([
    prisma.entrepot.count({ where: { companyId, actif: true } }),
    prisma.stockEntrepot.findMany({
      where: { companyId },
      include: {
        produit: { select: { prixUnitaire: true, stockMin: true } },
      },
    }),
  ]);

  const uniqueProduits = new Set(stocks.map((s) => s.produitId));
  const totalValeur = stocks.reduce(
    (sum, s) => sum + s.quantite * (s.produit?.prixUnitaire || 0),
    0
  );
  const lowStockProducts = stocks.filter(
    (s) => s.quantite <= (s.quantiteMin || s.produit?.stockMin || 0)
  ).length;

  return {
    totalEntrepots,
    totalProduits: uniqueProduits.size,
    totalValeur,
    lowStockProducts,
  };
}

/**
 * Create a new warehouse (alias for createEntrepot)
 */
export async function createEntrepotWithCheck(
  data: CreateEntrepotData,
  companyId: string,
  userId: string
): Promise<{ success: boolean; entrepot?: any; error?: string }> {
  return createEntrepot(data, companyId, userId);
}

/**
 * Update a warehouse (alias with check)
 */
export async function updateEntrepotWithCheck(
  id: string,
  data: UpdateEntrepotData,
  companyId: string,
  userId: string
): Promise<{ success: boolean; entrepot?: any; error?: string }> {
  return updateEntrepot(id, data, companyId, userId);
}

export default {
  getEntrepots,
  getEntrepotById,
  createEntrepot,
  createEntrepotWithCheck,
  updateEntrepot,
  updateEntrepotWithCheck,
  deleteEntrepot,
  getStockEntrepot,
  updateStockEntrepot,
  transferStock,
  getTransferts,
  getStockSummary,
};
