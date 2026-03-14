import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

const produitSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  prixUnitaire: z.number().int().min(0),
  unite: z.string().default('Unité'),
  stockActuel: z.number().int().min(0).default(0),
  stockMin: z.number().int().min(0).default(0),
  categorie: z.string().optional(),
  actif: z.boolean().default(true)
});

// GET /api/produits
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, categorie, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { companyId: req.user!.companyId };
    
    if (search) {
      where.OR = [
        { nom: { contains: search as string } },
        { description: { contains: search as string } }
      ];
    }
    if (categorie) {
      where.categorie = categorie;
    }

    const [produits, total] = await Promise.all([
      prisma.produit.findMany({
        where,
        orderBy: [{ categorie: 'asc' }, { nom: 'asc' }],
        skip,
        take: Number(limit)
      }),
      prisma.produit.count({ where })
    ]);

    res.json({
      success: true,
      data: produits,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get produits error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/produits/stock-bas
router.get('/stock-bas', async (req: Request, res: Response) => {
  try {
    const produits = await prisma.$queryRaw`
      SELECT * FROM Produit 
      WHERE companyId = ${req.user!.companyId} 
      AND stockActuel <= stockMin
      AND actif = 1
      ORDER BY stockActuel ASC
    `;

    res.json({ success: true, data: produits });
  } catch (error) {
    console.error('Get stock bas error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/produits/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const produit = await prisma.produit.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId
      }
    });

    if (!produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    res.json({ success: true, data: produit });
  } catch (error) {
    console.error('Get produit error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/produits
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = produitSchema.parse(req.body);

    const produit = await prisma.produit.create({
      data: {
        ...data,
        description: data.description || null,
        categorie: data.categorie || null,
        companyId: req.user!.companyId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      data: produit
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors
      });
    }
    console.error('Create produit error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/produits/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = produitSchema.partial().parse(req.body);

    const existing = await prisma.produit.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    const produit = await prisma.produit.update({
      where: { id: req.params.id },
      data
    });

    res.json({ success: true, message: 'Produit mis à jour', data: produit });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    console.error('Update produit error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/produits/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.produit.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    await prisma.produit.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'Produit supprimé' });
  } catch (error) {
    console.error('Delete produit error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
