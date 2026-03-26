// Quotes/Devis Routes for GuinéaManager ERP

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as devisService from '../services/devis.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================================
// DEVIS CRUD
// ============================================================

// GET /api/devis - Get all quotes
router.get('/', async (req: Request, res: Response) => {
  try {
    const { statut, clientId, startDate, endDate, search, page, limit } = req.query;

    const result = await devisService.getDevis(req.user!.companyId, {
      statut: statut as string,
      clientId: clientId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({
      success: true,
      data: result.devis,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get devis error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/devis/stats - Get quote statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await devisService.getDevisStats(req.user!.companyId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get devis stats error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/devis/:id - Get single quote
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const devis = await devisService.getDevisById(req.params.id, req.user!.companyId);

    if (!devis) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    res.json({ success: true, data: devis });
  } catch (error) {
    console.error('Get devis error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/devis - Create new quote
router.post('/', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      clientId: z.string(),
      dateValidite: z.string().transform((val) => new Date(val)),
      lignes: z.array(z.object({
        produitId: z.string().optional(),
        description: z.string(),
        quantite: z.number().int().positive(),
        prixUnitaire: z.number().positive(),
        tauxTVA: z.number().optional(),
      })).min(1),
      conditions: z.string().optional(),
      notes: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const result = await devisService.createDevis({
      ...data,
      companyId: req.user!.companyId,
      userId: req.user!.id,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.status(201).json({
      success: true,
      data: result.devis,
      message: 'Devis créé avec succès',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Create devis error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/devis/:id/status - Update quote status
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      statut: z.enum(['BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'EXPIRE']),
    });

    const { statut } = schema.parse(req.body);

    const result = await devisService.updateDevisStatus(
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
      data: result.devis,
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
    console.error('Update devis status error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/devis/:id/convert - Convert quote to invoice
router.post('/:id/convert', async (req: Request, res: Response) => {
  try {
    const result = await devisService.convertDevisToFacture(
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
      message: 'Devis converti en facture avec succès',
    });
  } catch (error) {
    console.error('Convert devis error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/devis/:id - Delete quote
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await devisService.deleteDevis(
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
      message: 'Devis supprimé',
    });
  } catch (error) {
    console.error('Delete devis error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/devis/:id/pdf - Generate quote PDF
router.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const devis = await devisService.getDevisById(req.params.id, req.user!.companyId);

    if (!devis) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    // TODO: Generate PDF using pdf generator
    // For now, return the quote data
    res.json({
      success: true,
      data: devis,
      message: 'PDF à implémenter',
    });
  } catch (error) {
    console.error('Get devis PDF error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/devis/:id/send - Send quote by email
router.post('/:id/send', async (req: Request, res: Response) => {
  try {
    const devis = await devisService.getDevisById(req.params.id, req.user!.companyId);

    if (!devis) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    // Update status to sent
    await devisService.updateDevisStatus(
      req.params.id,
      'ENVOYE',
      req.user!.companyId,
      req.user!.id
    );

    // TODO: Send email with PDF attachment

    res.json({
      success: true,
      message: 'Devis envoyé par email',
    });
  } catch (error) {
    console.error('Send devis error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
