// Stock Management Service for GuinéaManager ERP

import prisma from '../utils/prisma';
import { notifyLowStock } from './notification.service';

// Types
interface StockMovement {
  produitId: string;
  type: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT' | 'TRANSFERT';
  quantite: number;
  raison?: string;
  reference?: string;
  userId: string;
  companyId: string;
}

interface StockAlert {
  produitId: string;
  type: 'STOCK_BAS' | 'RUPTURE' | 'SURSTOCK';
  seuil: number;
  actuel: number;
}

// ============================================================
// STOCK MOVEMENTS
// ============================================================

/**
 * Record a stock movement
 */
export async function recordStockMovement(data: StockMovement): Promise<{
  success: boolean;
  nouveauStock?: number;
  alert?: StockAlert;
  error?: string;
}> {
  try {
    const produit = await prisma.produit.findFirst({
      where: {
        id: data.produitId,
        companyId: data.companyId,
      },
    });

    if (!produit) {
      return { success: false, error: 'Produit non trouvé' };
    }

    let nouveauStock = produit.stockActuel;

    switch (data.type) {
      case 'ENTREE':
        nouveauStock += data.quantite;
        break;
      case 'SORTIE':
        if (nouveauStock < data.quantite) {
          return { success: false, error: 'Stock insuffisant' };
        }
        nouveauStock -= data.quantite;
        break;
      case 'AJUSTEMENT':
        nouveauStock = data.quantite;
        break;
      case 'TRANSFERT':
        // For multi-warehouse transfers (future feature)
        nouveauStock -= data.quantite;
        break;
    }

    // Update product stock
    await prisma.produit.update({
      where: { id: data.produitId },
      data: { stockActuel: nouveauStock },
    });

    // Create movement record (using audit log for now)
    await prisma.auditLog.create({
      data: {
        action: `STOCK_${data.type}`,
        table: 'Produit',
        recordId: data.produitId,
        userId: data.userId,
        companyId: data.companyId,
        details: JSON.stringify({
          quantite: data.quantite,
          ancienStock: produit.stockActuel,
          nouveauStock,
          raison: data.raison,
          reference: data.reference,
        }),
      },
    });

    // Check for alerts
    let alert: StockAlert | undefined;
    if (nouveauStock <= produit.stockMin) {
      alert = {
        produitId: data.produitId,
        type: nouveauStock === 0 ? 'RUPTURE' : 'STOCK_BAS',
        seuil: produit.stockMin || 0,
        actuel: nouveauStock,
      };

      // Send notification for low stock
      if (alert.type === 'STOCK_BAS' || alert.type === 'RUPTURE') {
        await notifyLowStock(data.userId, {
          nom: produit.nom,
          stockActuel: nouveauStock,
          stockMin: produit.stockMin || 0,
        });
      }
    }

    // Check for overstock
    if (produit.stockMax && nouveauStock > produit.stockMax) {
      alert = {
        produitId: data.produitId,
        type: 'SURSTOCK',
        seuil: produit.stockMax,
        actuel: nouveauStock,
      };
    }

    return { success: true, nouveauStock, alert };
  } catch (error) {
    console.error('Stock movement error:', error);
    return { success: false, error: 'Erreur lors du mouvement de stock' };
  }
}

/**
 * Bulk stock entry (e.g., from purchase order)
 */
export async function bulkStockEntry(
  items: Array<{
    produitId: string;
    quantite: number;
    prixUnitaire?: number;
  }>,
  reference: string,
  userId: string,
  companyId: string
): Promise<{
  success: boolean;
  results: Array<{ produitId: string; success: boolean; alert?: StockAlert }>;
}> {
  const results = [];

  for (const item of items) {
    const result = await recordStockMovement({
      produitId: item.produitId,
      type: 'ENTREE',
      quantite: item.quantite,
      raison: 'Réception fournisseur',
      reference,
      userId,
      companyId,
    });

    results.push({
      produitId: item.produitId,
      success: result.success,
      alert: result.alert,
    });

    // Update product price if provided
    if (item.prixUnitaire) {
      await prisma.produit.update({
        where: { id: item.produitId },
        data: { prixUnitaire: item.prixUnitaire },
      });
    }
  }

  return { success: true, results };
}

// ============================================================
// STOCK ALERTS
// ============================================================

/**
 * Get all stock alerts for a company
 */
export async function getStockAlerts(companyId: string): Promise<StockAlert[]> {
  const produits = await prisma.produit.findMany({
    where: {
      companyId,
      type: 'PRODUIT',
    },
    select: {
      id: true,
      nom: true,
      stockActuel: true,
      stockMin: true,
      stockMax: true,
    },
  });

  const alerts: StockAlert[] = [];

  for (const produit of produits) {
    // Check low stock / rupture
    if (produit.stockActuel <= (produit.stockMin || 0)) {
      alerts.push({
        produitId: produit.id,
        type: produit.stockActuel === 0 ? 'RUPTURE' : 'STOCK_BAS',
        seuil: produit.stockMin || 0,
        actuel: produit.stockActuel,
      });
    }

    // Check overstock
    if (produit.stockMax && produit.stockActuel > produit.stockMax) {
      alerts.push({
        produitId: produit.id,
        type: 'SURSTOCK',
        seuil: produit.stockMax,
        actuel: produit.stockActuel,
      });
    }
  }

  return alerts;
}

/**
 * Get products with low stock
 */
export async function getLowStockProducts(companyId: string): Promise<any[]> {
  const produits = await prisma.produit.findMany({
    where: {
      companyId,
      type: 'PRODUIT',
      stockMin: { gt: 0 },
    },
    select: {
      id: true,
      nom: true,
      reference: true,
      stockActuel: true,
      stockMin: true,
      prixUnitaire: true,
      categorie: true,
    },
  });

  return produits.filter(p => p.stockActuel <= (p.stockMin || 0));
}

/**
 * Get stock movement history
 */
export async function getStockMovementHistory(
  companyId: string,
  options?: {
    produitId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }
): Promise<any[]> {
  const { produitId, type, startDate, endDate, page = 1, limit = 20 } = options || {};

  const where: any = {
    companyId,
    table: 'Produit',
    action: { contains: 'STOCK_' },
  };

  if (produitId) where.recordId = produitId;
  if (type) where.action = `STOCK_${type}`;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Enrich with product info
  const enrichedLogs = await Promise.all(
    logs.map(async (log) => {
      const produit = await prisma.produit.findUnique({
        where: { id: log.recordId },
        select: { nom: true, reference: true },
      });

      return {
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
        produit,
      };
    })
  );

  return enrichedLogs;
}

// ============================================================
// STOCK VALUATION
// ============================================================

/**
 * Calculate stock value (FIFO, LIFO, or average)
 */
export async function calculateStockValue(
  companyId: string,
  method: 'FIFO' | 'LIFO' | 'AVERAGE' = 'AVERAGE'
): Promise<{
  totalValue: number;
  totalItems: number;
  byCategory: Record<string, { value: number; count: number }>;
}> {
  const produits = await prisma.produit.findMany({
    where: {
      companyId,
      type: 'PRODUIT',
      stockActuel: { gt: 0 },
    },
    select: {
      id: true,
      nom: true,
      stockActuel: true,
      prixUnitaire: true,
      categorie: true,
    },
  });

  let totalValue = 0;
  let totalItems = 0;
  const byCategory: Record<string, { value: number; count: number }> = {};

  for (const produit of produits) {
    const value = produit.stockActuel * produit.prixUnitaire;
    totalValue += value;
    totalItems += produit.stockActuel;

    const category = produit.categorie || 'Non catégorisé';
    if (!byCategory[category]) {
      byCategory[category] = { value: 0, count: 0 };
    }
    byCategory[category].value += value;
    byCategory[category].count += produit.stockActuel;
  }

  return { totalValue, totalItems, byCategory };
}

// ============================================================
// STOCK FORECAST
// ============================================================

/**
 * Predict when stock will run out based on sales history
 */
export async function predictStockDepletion(
  produitId: string,
  companyId: string
): Promise<{
  joursRestants: number | null;
  consommationMoyenneJour: number;
  confiance: 'LOW' | 'MEDIUM' | 'HIGH';
}> {
  // Get last 30 days of sales for this product
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const lignesFactures = await prisma.ligneFacture.findMany({
    where: {
      produitId,
      facture: {
        companyId,
        statut: { in: ['PAYEE', 'ENVOYEE'] },
        dateEmission: { gte: thirtyDaysAgo },
      },
    },
    select: {
      quantite: true,
      facture: {
        select: { dateEmission: true },
      },
    },
  });

  if (lignesFactures.length < 5) {
    return {
      joursRestants: null,
      consommationMoyenneJour: 0,
      confiance: 'LOW',
    };
  }

  const totalQuantite = lignesFactures.reduce((sum, l) => sum + l.quantite, 0);
  const consommationMoyenneJour = totalQuantite / 30;

  if (consommationMoyenneJour === 0) {
    return {
      joursRestants: null,
      consommationMoyenneJour: 0,
      confiance: 'LOW',
    };
  }

  const produit = await prisma.produit.findUnique({
    where: { id: produitId },
    select: { stockActuel: true },
  });

  const joursRestants = Math.floor((produit?.stockActuel || 0) / consommationMoyenneJour);

  return {
    joursRestants,
    consommationMoyenneJour,
    confiance: lignesFactures.length > 15 ? 'HIGH' : 'MEDIUM',
  };
}

export default {
  recordStockMovement,
  bulkStockEntry,
  getStockAlerts,
  getLowStockProducts,
  getStockMovementHistory,
  calculateStockValue,
  predictStockDepletion,
};
