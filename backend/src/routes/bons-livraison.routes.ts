// Delivery Notes (Bons de Livraison) Routes for GuinéaManager ERP

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as commandeService from '../services/commande.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================================
// BONS DE LIVRAISON CRUD
// ============================================================

// GET /api/bons-livraison - Get all delivery notes
router.get('/', async (req: Request, res: Response) => {
  try {
    const { statut, commandeId, startDate, endDate, search, page, limit } = req.query;

    const result = await commandeService.getBonsLivraison(req.user!.companyId, {
      statut: statut as string,
      commandeId: commandeId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({
      success: true,
      data: result.bonsLivraison,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get bons livraison error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/bons-livraison/:id - Get single delivery note
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const bonLivraison = await commandeService.getBonLivraisonById(req.params.id, req.user!.companyId);

    if (!bonLivraison) {
      return res.status(404).json({
        success: false,
        message: 'Bon de livraison non trouvé',
      });
    }

    res.json({ success: true, data: bonLivraison });
  } catch (error) {
    console.error('Get bon livraison error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/bons-livraison/:id/sign - Sign delivery note
router.post('/:id/sign', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      signature: z.string(), // Base64 encoded signature
      nomSignataire: z.string(),
    });

    const { signature, nomSignataire } = schema.parse(req.body);

    const result = await commandeService.signBonLivraison(
      req.params.id,
      signature,
      nomSignataire,
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
      data: result.bonLivraison,
      message: 'Bon de livraison signé avec succès',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Sign bon livraison error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
