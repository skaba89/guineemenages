// Supplier (Fournisseur) Routes for GuinéaManager ERP

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as fournisseurService from '../services/fournisseur.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================================
// FOURNISSEURS CRUD
// ============================================================

// GET /api/fournisseurs - Get all suppliers
router.get('/', async (req: Request, res: Response) => {
  try {
    const { actif, search, pays, page, limit } = req.query;

    const result = await fournisseurService.getFournisseurs(req.user!.companyId, {
      actif: actif === 'true' ? true : actif === 'false' ? false : undefined,
      search: search as string,
      pays: pays as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({
      success: true,
      data: result.fournisseurs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get fournisseurs error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/fournisseurs/stats - Get supplier statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await fournisseurService.getFournisseurStats(req.user!.companyId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get fournisseur stats error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/fournisseurs/:id - Get single supplier
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const fournisseur = await fournisseurService.getFournisseurById(
      req.params.id,
      req.user!.companyId
    );

    if (!fournisseur) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé',
      });
    }

    res.json({ success: true, data: fournisseur });
  } catch (error) {
    console.error('Get fournisseur error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/fournisseurs - Create supplier
router.post('/', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      code: z.string().optional(),
      nom: z.string().min(1),
      email: z.string().email().optional().or(z.literal('')),
      telephone: z.string().optional(),
      adresse: z.string().optional(),
      ville: z.string().optional(),
      pays: z.string().optional(),
      ninea: z.string().optional(),
      contactNom: z.string().optional(),
      contactTel: z.string().optional(),
      notes: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const result = await fournisseurService.createFournisseur(
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
      data: result.fournisseur,
      message: 'Fournisseur créé avec succès',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Create fournisseur error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/fournisseurs/:id - Update supplier
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      code: z.string().optional(),
      nom: z.string().min(1).optional(),
      email: z.string().email().optional().or(z.literal('')),
      telephone: z.string().optional(),
      adresse: z.string().optional(),
      ville: z.string().optional(),
      pays: z.string().optional(),
      ninea: z.string().optional(),
      contactNom: z.string().optional(),
      contactTel: z.string().optional(),
      notes: z.string().optional(),
      actif: z.boolean().optional(),
    });

    const data = schema.parse(req.body);

    const result = await fournisseurService.updateFournisseur(
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
      data: result.fournisseur,
      message: 'Fournisseur mis à jour',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Update fournisseur error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/fournisseurs/:id - Delete supplier
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await fournisseurService.deleteFournisseur(
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
      message: 'Fournisseur supprimé',
    });
  } catch (error) {
    console.error('Delete fournisseur error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================
// PURCHASE ORDERS (COMMANDES FOURNISSEUR)
// ============================================================

// GET /api/fournisseurs/commandes - Get all purchase orders
router.get('/commandes/all', async (req: Request, res: Response) => {
  try {
    const { fournisseurId, statut, startDate, endDate, search, page, limit } = req.query;

    const result = await fournisseurService.getCommandesFournisseur(req.user!.companyId, {
      fournisseurId: fournisseurId as string,
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
    console.error('Get commandes fournisseur error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/fournisseurs/commandes/:id - Get single purchase order
router.get('/commandes/:id', async (req: Request, res: Response) => {
  try {
    const commande = await fournisseurService.getCommandeFournisseurById(
      req.params.id,
      req.user!.companyId
    );

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    res.json({ success: true, data: commande });
  } catch (error) {
    console.error('Get commande fournisseur error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/fournisseurs/commandes - Create purchase order
router.post('/commandes', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      fournisseurId: z.string(),
      dateLivraison: z.string().optional(),
      notes: z.string().optional(),
      lignes: z.array(z.object({
        produitId: z.string(),
        description: z.string().optional(),
        quantite: z.number().int().positive(),
        prixUnitaire: z.number().positive(),
      })).min(1),
    });

    const data = schema.parse(req.body);

    const result = await fournisseurService.createCommandeFournisseur(
      {
        ...data,
        dateLivraison: data.dateLivraison ? new Date(data.dateLivraison) : undefined,
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
    console.error('Create commande fournisseur error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/fournisseurs/commandes/:id/status - Update order status
router.put('/commandes/:id/status', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      statut: z.enum(['EN_ATTENTE', 'CONFIRME', 'RECU_PARTIEL', 'RECU', 'ANNULE']),
    });

    const { statut } = schema.parse(req.body);

    const result = await fournisseurService.updateCommandeFournisseurStatus(
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

// POST /api/fournisseurs/commandes/:id/reception - Receive goods
router.post('/commandes/:id/reception', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      lignes: z.array(z.object({
        ligneId: z.string(),
        quantiteRecue: z.number().int().positive(),
      })).min(1),
      notes: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const result = await fournisseurService.recevoirCommande(
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
      message: 'Réception enregistrée',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Reception commande error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/fournisseurs/commandes/:id/cancel - Cancel order
router.post('/commandes/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { raison } = req.body;

    const result = await fournisseurService.cancelCommandeFournisseur(
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
    console.error('Cancel commande error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
