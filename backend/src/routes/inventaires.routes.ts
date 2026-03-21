// Inventory Count (Inventaire) Routes for GuinéaManager ERP

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================================
// INVENTAIRES CRUD
// ============================================================

// GET /api/inventaires - Get all inventory counts
router.get('/', async (req: Request, res: Response) => {
  try {
    const { statut, entrepotId, startDate, endDate, page, limit } = req.query;

    const where: any = { companyId: req.user!.companyId };

    if (statut) where.statut = statut;
    if (entrepotId) where.entrepotId = entrepotId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;

    const [inventaires, total] = await Promise.all([
      prisma.inventaire.findMany({
        where,
        include: {
          lignes: {
            include: {
              produit: {
                select: { id: true, nom: true, reference: true },
              },
            },
          },
          _count: { select: { lignes: true } },
        },
        orderBy: { date: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.inventaire.count({ where }),
    ]);

    res.json({
      success: true,
      data: inventaires,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get inventaires error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/inventaires/:id - Get single inventory count
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const inventaire = await prisma.inventaire.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
      },
      include: {
        lignes: {
          include: {
            produit: {
              select: {
                id: true,
                nom: true,
                reference: true,
                unite: true,
                stockActuel: true,
                stockMin: true,
              },
            },
          },
        },
      },
    });

    if (!inventaire) {
      return res.status(404).json({
        success: false,
        message: 'Inventaire non trouvé',
      });
    }

    // Calculate summary
    const summary = {
      totalProduits: inventaire.lignes.length,
      totalEcartPositif: inventaire.lignes
        .filter((l) => l.ecart > 0)
        .reduce((sum, l) => sum + l.ecart, 0),
      totalEcartNegatif: inventaire.lignes
        .filter((l) => l.ecart < 0)
        .reduce((sum, l) => sum + Math.abs(l.ecart), 0),
      produitsAvecEcart: inventaire.lignes.filter((l) => l.ecart !== 0).length,
    };

    res.json({
      success: true,
      data: { ...inventaire, summary },
    });
  } catch (error) {
    console.error('Get inventaire error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/inventaires - Create inventory count
router.post('/', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      entrepotId: z.string().optional(),
      notes: z.string().optional(),
      produits: z.array(z.string()).optional(), // Product IDs to include
    });

    const data = schema.parse(req.body);

    // Generate inventory number
    const count = await prisma.inventaire.count({
      where: { companyId: req.user!.companyId },
    });
    const numero = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Get products to include
    let produits = [];
    if (data.produits && data.produits.length > 0) {
      produits = await prisma.produit.findMany({
        where: {
          id: { in: data.produits },
          companyId: req.user!.companyId,
        },
      });
    } else {
      // Include all products
      produits = await prisma.produit.findMany({
        where: {
          companyId: req.user!.companyId,
          type: 'PRODUIT',
        },
      });
    }

    // Create inventory with lines
    const inventaire = await prisma.inventaire.create({
      data: {
        numero,
        entrepotId: data.entrepotId,
        notes: data.notes,
        companyId: req.user!.companyId,
        lignes: {
          create: produits.map((p) => ({
            produitId: p.id,
            stockTheorique: p.stockActuel,
            stockReel: p.stockActuel, // Initialize with theoretical stock
            ecart: 0,
          })),
        },
      },
      include: {
        lignes: {
          include: {
            produit: true,
          },
        },
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_INVENTAIRE',
        table: 'Inventaire',
        recordId: inventaire.id,
        userId: req.user!.id,
        companyId: req.user!.companyId,
        details: JSON.stringify({ numero, nbProduits: produits.length }),
      },
    });

    res.status(201).json({
      success: true,
      data: inventaire,
      message: 'Inventaire créé avec succès',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Create inventaire error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/inventaires/:id/ligne/:ligneId - Update inventory line
router.put('/:id/ligne/:ligneId', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      stockReel: z.number().int().min(0),
      notes: z.string().optional(),
    });

    const { stockReel, notes } = schema.parse(req.body);

    // Verify inventory exists and is in progress
    const inventaire = await prisma.inventaire.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
      },
    });

    if (!inventaire) {
      return res.status(404).json({
        success: false,
        message: 'Inventaire non trouvé',
      });
    }

    if (inventaire.statut !== 'EN_COURS') {
      return res.status(400).json({
        success: false,
        message: 'Cet inventaire n\'est plus en cours',
      });
    }

    // Get line
    const ligne = await prisma.ligneInventaire.findFirst({
      where: {
        id: req.params.ligneId,
        inventaireId: req.params.id,
      },
    });

    if (!ligne) {
      return res.status(404).json({
        success: false,
        message: 'Ligne d\'inventaire non trouvée',
      });
    }

    // Update line
    const updatedLigne = await prisma.ligneInventaire.update({
      where: { id: req.params.ligneId },
      data: {
        stockReel,
        ecart: stockReel - ligne.stockTheorique,
        notes,
      },
      include: {
        produit: true,
      },
    });

    res.json({
      success: true,
      data: updatedLigne,
      message: 'Ligne mise à jour',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Update ligne inventaire error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/inventaires/:id/finalize - Finalize inventory count
router.put('/:id/finalize', async (req: Request, res: Response) => {
  try {
    // Verify inventory exists and is in progress
    const inventaire = await prisma.inventaire.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
      },
      include: {
        lignes: true,
      },
    });

    if (!inventaire) {
      return res.status(404).json({
        success: false,
        message: 'Inventaire non trouvé',
      });
    }

    if (inventaire.statut !== 'EN_COURS') {
      return res.status(400).json({
        success: false,
        message: 'Cet inventaire n\'est plus en cours',
      });
    }

    // Update product stocks based on inventory
    for (const ligne of inventaire.lignes) {
      if (ligne.ecart !== 0) {
        await prisma.produit.update({
          where: { id: ligne.produitId },
          data: {
            stockActuel: ligne.stockReel,
          },
        });

        // Log stock adjustment
        await prisma.auditLog.create({
          data: {
            action: 'AJUSTEMENT_INVENTAIRE',
            table: 'Produit',
            recordId: ligne.produitId,
            userId: req.user!.id,
            companyId: req.user!.companyId,
            details: JSON.stringify({
              inventaireId: inventaire.id,
              inventaireNumero: inventaire.numero,
              stockTheorique: ligne.stockTheorique,
              stockReel: ligne.stockReel,
              ecart: ligne.ecart,
            }),
          },
        });
      }
    }

    // Update inventory status
    const updatedInventaire = await prisma.inventaire.update({
      where: { id: req.params.id },
      data: { statut: 'TERMINE' },
      include: {
        lignes: {
          include: {
            produit: true,
          },
        },
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'FINALIZE_INVENTAIRE',
        table: 'Inventaire',
        recordId: inventaire.id,
        userId: req.user!.id,
        companyId: req.user!.companyId,
        details: JSON.stringify({ numero: inventaire.numero }),
      },
    });

    res.json({
      success: true,
      data: updatedInventaire,
      message: 'Inventaire finalisé avec succès',
    });
  } catch (error) {
    console.error('Finalize inventaire error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/inventaires/:id/cancel - Cancel inventory count
router.put('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { raison } = req.body;

    // Verify inventory exists and is in progress
    const inventaire = await prisma.inventaire.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
      },
    });

    if (!inventaire) {
      return res.status(404).json({
        success: false,
        message: 'Inventaire non trouvé',
      });
    }

    if (inventaire.statut !== 'EN_COURS') {
      return res.status(400).json({
        success: false,
        message: 'Cet inventaire ne peut pas être annulé',
      });
    }

    // Update inventory status
    await prisma.inventaire.update({
      where: { id: req.params.id },
      data: {
        statut: 'ANNULE',
        notes: raison ? `${inventaire.notes || ''}\nRaison annulation: ${raison}` : inventaire.notes,
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'CANCEL_INVENTAIRE',
        table: 'Inventaire',
        recordId: inventaire.id,
        userId: req.user!.id,
        companyId: req.user!.companyId,
        details: JSON.stringify({ numero: inventaire.numero, raison }),
      },
    });

    res.json({
      success: true,
      message: 'Inventaire annulé',
    });
  } catch (error) {
    console.error('Cancel inventaire error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/inventaires/stats - Get inventory statistics
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const [enCours, termines, annules] = await Promise.all([
      prisma.inventaire.count({
        where: { companyId: req.user!.companyId, statut: 'EN_COURS' },
      }),
      prisma.inventaire.count({
        where: { companyId: req.user!.companyId, statut: 'TERMINE' },
      }),
      prisma.inventaire.count({
        where: { companyId: req.user!.companyId, statut: 'ANNULE' },
      }),
    ]);

    // Get last inventory date
    const lastInventaire = await prisma.inventaire.findFirst({
      where: {
        companyId: req.user!.companyId,
        statut: 'TERMINE',
      },
      orderBy: { date: 'desc' },
      select: { date: true, numero: true },
    });

    res.json({
      success: true,
      data: {
        enCours,
        termines,
        annules,
        dernierInventaire: lastInventaire,
      },
    });
  } catch (error) {
    console.error('Get inventaire stats error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
