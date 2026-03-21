import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

const employeSchema = z.object({
  matricule: z.string().min(1, 'Matricule requis'),
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prénom requis'),
  email: z.string().email().optional().or(z.literal('')),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  dateNaissance: z.string().optional(),
  dateEmbauche: z.string(),
  poste: z.string().min(1, 'Poste requis'),
  departement: z.string().optional(),
  salaireBase: z.number().int().min(0),
  typeContrat: z.enum(['CDI', 'CDD', 'APPRENTISSAGE', 'STAGE']).default('CDI')
});

// GET /api/employes
router.get('/', async (req: Request, res: Response) => {
  try {
    const { departement, actif, search, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { companyId: req.user!.companyId };
    if (departement) where.departement = departement;
    if (actif !== undefined) where.actif = actif === 'true';
    if (search) {
      where.OR = [
        { nom: { contains: search as string } },
        { prenom: { contains: search as string } },
        { matricule: { contains: search as string } }
      ];
    }

    const [employes, total] = await Promise.all([
      prisma.employe.findMany({
        where,
        orderBy: [{ departement: 'asc' }, { nom: 'asc' }],
        skip,
        take: Number(limit)
      }),
      prisma.employe.count({ where })
    ]);

    res.json({
      success: true,
      data: employes,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    console.error('Get employes error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/employes/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const employe = await prisma.employe.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: { bulletins: { orderBy: { createdAt: 'desc' }, take: 12 } }
    });

    if (!employe) {
      return res.status(404).json({ success: false, message: 'Employé non trouvé' });
    }

    res.json({ success: true, data: employe });
  } catch (error) {
    console.error('Get employe error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/employes
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = employeSchema.parse(req.body);

    // Check matricule unique
    const existing = await prisma.employe.findFirst({
      where: { matricule: data.matricule, companyId: req.user!.companyId }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Ce matricule existe déjà' });
    }

    const employe = await prisma.employe.create({
      data: {
        ...data,
        email: data.email || null,
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,
        dateEmbauche: new Date(data.dateEmbauche),
        departement: data.departement || null,
        companyId: req.user!.companyId
      }
    });

    res.status(201).json({ success: true, message: 'Employé créé', data: employe });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    console.error('Create employe error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/employes/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = employeSchema.partial().parse(req.body);

    const existing = await prisma.employe.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Employé non trouvé' });
    }

    const employe = await prisma.employe.update({
      where: { id: req.params.id },
      data: {
        ...data,
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
        dateEmbauche: data.dateEmbauche ? new Date(data.dateEmbauche) : undefined
      }
    });

    res.json({ success: true, message: 'Employé mis à jour', data: employe });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    console.error('Update employe error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/employes/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.employe.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Employé non trouvé' });
    }

    // Soft delete
    await prisma.employe.update({
      where: { id: req.params.id },
      data: { actif: false, dateDepart: new Date() }
    });

    res.json({ success: true, message: 'Employé désactivé' });
  } catch (error) {
    console.error('Delete employe error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
