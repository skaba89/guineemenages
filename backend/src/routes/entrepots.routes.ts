// Warehouse (Entrepot) Routes for GuinéaManager ERP

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as entrepotService from '../services/entrepot.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================================
// ENTREPOTS CRUD
// ============================================================

// GET /api/entrepots - Get all warehouses
router.get('/', async (req: Request, res: Response) => {
  try {
    const { actif, search, page, limit } = req.query;

    const result = await entrepotService.getEntrepots(req.user!.companyId, {
      actif: actif === 'true' ? true : actif === 'false' ? false : undefined,
      search: search as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({
      success: true,
      data: result.entrepots,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get entrepots error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/entrepots/stats - Get stock summary
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await entrepotService.getStockSummary(req.user!.companyId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get stock summary error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/entrepots/:id - Get single warehouse
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const entrepot = await entrepotService.getEntrepotById(
      req.params.id,
      req.user!.companyId
    );

    if (!entrepot) {
      return res.status(404).json({
        success: false,
        message: 'Entrepôt non trouvé',
      });
    }

    res.json({ success: true, data: entrepot });
  } catch (error) {
    console.error('Get entrepot error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/entrepots - Create warehouse
router.post('/', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      nom: z.string().min(1),
      code: z.string().optional(),
      adresse: z.string().optional(),
      ville: z.string().optional(),
      responsable: z.string().optional(),
      telephone: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
    });

    const data = schema.parse(req.body);

    const result = await entrepotService.createEntrepot(
      data,
      req.user!.companyId,
      req.user!.id
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.status(201).json({
      success: true,
      data: result.entrepot,
      message: 'Entrepôt créé avec succès',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Create entrepot error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/entrepots/:id - Update warehouse
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      nom: z.string().min(1).optional(),
      code: z.string().optional(),
      adresse: z.string().optional(),
      ville: z.string().optional(),
      responsable: z.string().optional(),
      telephone: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      actif: z.boolean().optional(),
    });

    const data = schema.parse(req.body);

    const result = await entrepotService.updateEntrepot(
      req.params.id,
      data,
      req.user!.companyId,
      req.user!.id
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      data: result.entrepot,
      message: 'Entrepôt mis à jour',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Update entrepot error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================
// STOCK BY ENTREPOT
// ============================================================

// GET /api/entrepots/:id/stock - Get warehouse stock
router.get('/:id/stock', async (req: Request, res: Response) => {
  try {
    const { search, lowStock, page, limit } = req.query;

    const result = await entrepotService.getStockEntrepot(
      req.params.id,
      req.user!.companyId,
      {
        search: search as string,
        lowStock: lowStock === 'true',
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      }
    );

    res.json({
      success: true,
      data: result.stocks,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/entrepots/:id/stock/:produitId - Update stock in warehouse
router.put('/:id/stock/:produitId', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      quantite: z.number().int().min(0),
      raison: z.string().optional(),
    });

    const { quantite, raison } = schema.parse(req.body);

    const result = await entrepotService.updateStockEntrepot(
      req.params.id,
      req.params.produitId,
      quantite,
      req.user!.companyId,
      req.user!.id,
      raison
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      data: result.stock,
      message: 'Stock mis à jour',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Update stock error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================
// STOCK TRANSFERS
// ============================================================

// GET /api/entrepots/transferts - Get transfer history
router.get('/transferts/history', async (req: Request, res: Response) => {
  try {
    const { entrepotId, statut, startDate, endDate, page, limit } = req.query;

    const result = await entrepotService.getTransferts(req.user!.companyId, {
      entrepotId: entrepotId as string,
      statut: statut as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({
      success: true,
      data: result.transferts,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get transferts error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/entrepots/transferts - Create stock transfer
router.post('/transferts', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      entrepotSourceId: z.string(),
      entrepotDestId: z.string(),
      produits: z.array(z.object({
        produitId: z.string(),
        quantite: z.number().int().positive(),
        notes: z.string().optional(),
      })).min(1),
      notes: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const result = await entrepotService.transferStock(
      data,
      req.user!.companyId,
      req.user!.id
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.status(201).json({
      success: true,
      data: result.transfert,
      message: 'Transfert effectué avec succès',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Create transfert error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
