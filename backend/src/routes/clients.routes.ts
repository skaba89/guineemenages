import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

const clientSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  email: z.string().email().optional().or(z.literal('')),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  pays: z.string().default('Guinée'),
  type: z.enum(['PARTICULIER', 'ENTREPRISE']).default('PARTICULIER')
});

// GET /api/clients
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { companyId: req.user!.companyId };
    
    if (search) {
      where.OR = [
        { nom: { contains: search as string } },
        { email: { contains: search as string } },
        { telephone: { contains: search as string } }
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.client.count({ where })
    ]);

    res.json({
      success: true,
      data: clients,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/clients/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const client = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId
      },
      include: {
        factures: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    res.json({ success: true, data: client });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/clients
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = clientSchema.parse(req.body);

    const client = await prisma.client.create({
      data: {
        ...data,
        email: data.email || null,
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        ville: data.ville || null,
        companyId: req.user!.companyId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Client créé avec succès',
      data: client
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors
      });
    }
    console.error('Create client error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/clients/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = clientSchema.partial().parse(req.body);

    const existingClient = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId
      }
    });

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        ...data,
        email: data.email || null,
        telephone: data.telephone || null
      }
    });

    res.json({
      success: true,
      message: 'Client mis à jour',
      data: client
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors
      });
    }
    console.error('Update client error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existingClient = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId
      }
    });

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    await prisma.client.delete({ where: { id: req.params.id } });

    res.json({
      success: true,
      message: 'Client supprimé avec succès'
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
