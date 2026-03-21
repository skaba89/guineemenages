// Stock Routes for GuinéaManager ERP

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as stockService from '../services/stock.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================================
// STOCK ALERTS
// ============================================================

// GET /api/stock/alerts - Get all stock alerts
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const alerts = await stockService.getStockAlerts(req.user!.companyId);
    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Get stock alerts error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/stock/low-stock - Get products with low stock
router.get('/low-stock', async (req: Request, res: Response) => {
  try {
    const produits = await stockService.getLowStockProducts(req.user!.companyId);
    res.json({ success: true, data: produits });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================
// STOCK MOVEMENTS
// ============================================================

// POST /api/stock/movement - Record a stock movement
router.post('/movement', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      produitId: z.string(),
      type: z.enum(['ENTREE', 'SORTIE', 'AJUSTEMENT', 'TRANSFERT']),
      quantite: z.number().int().positive(),
      raison: z.string().optional(),
      reference: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const result = await stockService.recordStockMovement({
      ...data,
      userId: req.user!.id,
      companyId: req.user!.companyId,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      data: {
        nouveauStock: result.nouveauStock,
        alert: result.alert,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Stock movement error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/stock/bulk-entry - Bulk stock entry
router.post('/bulk-entry', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      items: z.array(z.object({
        produitId: z.string(),
        quantite: z.number().int().positive(),
        prixUnitaire: z.number().optional(),
      })),
      reference: z.string(),
    });

    const { items, reference } = schema.parse(req.body);

    const result = await stockService.bulkStockEntry(
      items,
      reference,
      req.user!.id,
      req.user!.companyId
    );

    res.json({ success: true, data: result.results });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Bulk stock entry error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/stock/history - Get stock movement history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { produitId, type, startDate, endDate, page, limit } = req.query;

    const history = await stockService.getStockMovementHistory(
      req.user!.companyId,
      {
        produitId: produitId as string,
        type: type as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      }
    );

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Get stock history error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================
// STOCK VALUATION
// ============================================================

// GET /api/stock/valuation - Calculate stock value
router.get('/valuation', async (req: Request, res: Response) => {
  try {
    const { method } = req.query;
    const valuation = await stockService.calculateStockValue(
      req.user!.companyId,
      (method as 'FIFO' | 'LIFO' | 'AVERAGE') || 'AVERAGE'
    );

    res.json({ success: true, data: valuation });
  } catch (error) {
    console.error('Stock valuation error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================
// STOCK FORECAST
// ============================================================

// GET /api/stock/forecast/:produitId - Predict stock depletion
router.get('/forecast/:produitId', async (req: Request, res: Response) => {
  try {
    const prediction = await stockService.predictStockDepletion(
      req.params.produitId,
      req.user!.companyId
    );

    res.json({ success: true, data: prediction });
  } catch (error) {
    console.error('Stock forecast error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
