// Client Orders (Commandes) Routes for GuinéaManager ERP

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as commandeService from '../services/commande.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================================
// COMMANDES CLIENTS CRUD
// ============================================================

// GET /api/commandes - Get all client orders
router.get('/', async (req: Request, res: Response) => {
  try {
    const { clientId, statut, startDate, endDate, search, page, limit } = req.query;

    const result = await commandeService.getCommandesClient(req.user!.companyId, {
      clientId: clientId as string,
      statut: statut as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({
      success: true,
      data: result.commandes,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get commandes error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/commandes/stats - Get order statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await commandeService.getCommandeClientStats(req.user!.companyId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get commandes stats error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/commandes/:id - Get single order
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const commande = await commandeService.getCommandeClientById(req.params.id, req.user!.companyId);

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    res.json({ success: true, data: commande });
  } catch (error) {
    console.error('Get commande error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/commandes - Create new order
router.post('/', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      clientId: z.string(),
      dateLivraison: z.string().transform((val) => new Date(val)).optional(),
      adresseLivraison: z.string().optional(),
      notes: z.string().optional(),
      devisId: z.string().optional(),
      lignes: z.array(z.object({
        produitId: z.string().optional(),
        description: z.string(),
        quantite: z.number().int().positive(),
        prixUnitaire: z.number().positive(),
        tauxTVA: z.number().optional(),
      })).min(1),
    });

    const data = schema.parse(req.body);

    const result = await commandeService.createCommandeClient(
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
      data: result.commande,
      message: 'Commande créée avec succès',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Create commande error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/commandes/:id - Update order
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      dateLivraison: z.string().transform((val) => new Date(val)).optional(),
      adresseLivraison: z.string().optional(),
      notes: z.string().optional(),
      statut: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const result = await commandeService.updateCommandeClient(
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
      data: result.commande,
      message: 'Commande mise à jour',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Update commande error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/commandes/:id/status - Update order status
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      statut: z.enum(['EN_ATTENTE', 'CONFIRME', 'EN_PREPARATION', 'EXPEDIE', 'LIVRE', 'ANNULE']),
    });

    const { statut } = schema.parse(req.body);

    const result = await commandeService.updateCommandeClientStatus(
      req.params.id,
      statut,
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
      data: result.commande,
      message: 'Statut mis à jour',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Update commande status error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/commandes/:id/cancel - Cancel order
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      raison: z.string().optional(),
    });

    const { raison } = schema.parse(req.body);

    const result = await commandeService.cancelCommandeClient(
      req.params.id,
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
      message: 'Commande annulée',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Cancel commande error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/commandes/:id/livraison - Create delivery note from order
router.post('/:id/livraison', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      adresse: z.string().optional(),
      notes: z.string().optional(),
      lignes: z.array(z.object({
        produitId: z.string().optional(),
        description: z.string(),
        quantite: z.number().int().positive(),
      })).min(1),
    });

    const data = schema.parse(req.body);

    const result = await commandeService.createBonLivraison(
      {
        commandeId: req.params.id,
        ...data,
      },
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
      data: result.bonLivraison,
      message: 'Bon de livraison créé avec succès',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Create bon livraison error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/commandes/:id/facture - Convert order to invoice
router.post('/:id/facture', async (req: Request, res: Response) => {
  try {
    const result = await commandeService.convertirEnFacture(
      req.params.id,
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
      data: result.facture,
      message: 'Commande convertie en facture avec succès',
    });
  } catch (error) {
    console.error('Convert to facture error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
