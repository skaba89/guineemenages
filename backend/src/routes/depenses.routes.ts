import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

const depenseSchema = z.object({
  description: z.string().min(1, 'Description requise'),
  montant: z.number().int().min(0),
  categorie: z.string().min(1, 'Catégorie requise'),
  date: z.string(),
  modePaiement: z.enum(['ESPECES', 'VIREMENT', 'ORANGE_MONEY', 'MTN_MONEY', 'CHEQUE', 'CARTE']),
  notes: z.string().optional()
});

// GET /api/depenses
router.get('/', async (req: Request, res: Response) => {
  try {
    const { categorie, mois, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { companyId: req.user!.companyId };
    if (categorie) where.categorie = categorie;
    if (mois) {
      const [year, month] = (mois as string).split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      where.date = { gte: startDate, lte: endDate };
    }

    const [depenses, total] = await Promise.all([
      prisma.depense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.depense.count({ where })
    ]);

    res.json({
      success: true,
      data: depenses,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    console.error('Get depenses error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/depenses
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = depenseSchema.parse(req.body);

    const depense = await prisma.depense.create({
      data: {
        ...data,
        date: new Date(data.date),
        notes: data.notes || null,
        companyId: req.user!.companyId
      }
    });

    res.status(201).json({ success: true, message: 'Dépense enregistrée', data: depense });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    console.error('Create depense error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/depenses/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = depenseSchema.partial().parse(req.body);

    const existing = await prisma.depense.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Dépense non trouvée' });
    }

    const depense = await prisma.depense.update({
      where: { id: req.params.id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined
      }
    });

    res.json({ success: true, message: 'Dépense mise à jour', data: depense });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    console.error('Update depense error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/depenses/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.depense.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Dépense non trouvée' });
    }

    await prisma.depense.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'Dépense supprimée' });
  } catch (error) {
    console.error('Delete depense error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
