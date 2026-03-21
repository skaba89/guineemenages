// Routes API pour la Comptabilité OHADA

import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import ComptabiliteService from '../services/comptabilite.service';

const router = Router();

// Initialiser le plan comptable OHADA (admin uniquement)
router.post('/initialiser', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    await ComptabiliteService.initialiserPlanComptable();
    res.json({ message: 'Plan comptable OHADA initialisé avec succès' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir le plan comptable
router.get('/plan-comptable', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const planComptable = await req.prisma.planComptableOHADA.findMany({
      where: { actif: true },
      orderBy: { numero: 'asc' },
    });
    res.json(planComptable);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== EXERCICES ====================

// Lister les exercices comptables
router.get('/exercices', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const exercices = await req.prisma.exerciceComptable.findMany({
      where: { companyId: user.companyId },
      orderBy: { annee: 'desc' },
    });
    res.json(exercices);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un exercice comptable
router.post('/exercices', authMiddleware, requireRole(['ADMIN', 'COMPTABLE']), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { annee, dateDebut, dateFin } = req.body;

    const exercice = await ComptabiliteService.creerExercice(
      user.companyId,
      annee,
      new Date(dateDebut),
      new Date(dateFin)
    );
    res.status(201).json(exercice);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Obtenir un exercice
router.get('/exercices/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const exercice = await req.prisma.exerciceComptable.findFirst({
      where: { id: req.params.id, companyId: user.companyId },
      include: {
        journaux: { where: { actif: true } },
        _count: { select: { journaux: true } },
      },
    });
    if (!exercice) {
      return res.status(404).json({ error: 'Exercice non trouvé' });
    }
    res.json(exercice);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Clôturer un exercice
router.post('/exercices/:id/cloturer', authMiddleware, requireRole(['ADMIN', 'COMPTABLE']), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const result = await ComptabiliteService.cloturerExercice(
      user.companyId,
      req.params.id,
      user.id
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== JOURNAUX ====================

// Lister les journaux
router.get('/journaux', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const journaux = await req.prisma.journalComptable.findMany({
      where: { companyId: user.companyId, actif: true },
      orderBy: { code: 'asc' },
    });
    res.json(journaux);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ÉCRITURES ====================

// Enregistrer une écriture comptable
router.post('/ecritures', authMiddleware, requireRole(['ADMIN', 'COMPTABLE']), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { journalCode, exerciceId, dateEcriture, lignes, reference, sourceType, sourceId } = req.body;

    const ecritures = await ComptabiliteService.enregistrerEcriture({
      companyId: user.companyId,
      journalCode,
      exerciceId,
      dateEcriture: new Date(dateEcriture),
      lignes,
      reference,
      sourceType,
      sourceId,
    });
    res.status(201).json(ecritures);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Lister les écritures
router.get('/ecritures', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { journalId, exerciceId, dateDebut, dateFin, compte } = req.query;

    const where: any = { companyId: user.companyId };
    if (journalId) where.journalId = journalId;
    if (exerciceId) where.exerciceId = exerciceId;
    if (compte) where.compteNumero = { startsWith: compte };
    if (dateDebut || dateFin) {
      where.dateEcriture = {};
      if (dateDebut) where.dateEcriture.gte = new Date(dateDebut as string);
      if (dateFin) where.dateEcriture.lte = new Date(dateFin as string);
    }

    const ecritures = await req.prisma.ecritureComptable.findMany({
      where,
      orderBy: [{ dateEcriture: 'desc' }, { numeroPiece: 'asc' }],
      take: 500,
    });
    res.json(ecritures);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== GRAND LIVRE ====================

router.get('/grand-livre', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { exerciceId, compteDebut, compteFin, dateDebut, dateFin } = req.query;

    const grandLivre = await ComptabiliteService.getGrandLivre(
      user.companyId,
      exerciceId as string,
      compteDebut as string,
      compteFin as string,
      dateDebut ? new Date(dateDebut as string) : undefined,
      dateFin ? new Date(dateFin as string) : undefined
    );
    res.json(grandLivre);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== BALANCE ====================

router.get('/balance', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { exerciceId, periode } = req.query;

    const balance = await ComptabiliteService.getBalance(
      user.companyId,
      exerciceId as string,
      periode as string
    );
    res.json(balance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== BILAN ====================

router.get('/bilan', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { exerciceId } = req.query;

    const bilan = await ComptabiliteService.genererBilan(
      user.companyId,
      exerciceId as string
    );
    res.json(bilan);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COMPTE DE RÉSULTAT ====================

router.get('/compte-resultat', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { exerciceId } = req.query;

    const compteResultat = await ComptabiliteService.genererCompteResultat(
      user.companyId,
      exerciceId as string
    );
    res.json(compteResultat);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== LETTRAGE ====================

// Lettrer des écritures
router.post('/lettrage', authMiddleware, requireRole(['ADMIN', 'COMPTABLE']), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { ecritureIds, code } = req.body;

    const codeLettrage = code || `L${Date.now().toString(36).toUpperCase()}`;

    await req.prisma.ecritureComptable.updateMany({
      where: {
        id: { in: ecritureIds },
        companyId: user.companyId,
      },
      data: {
        lettrage: codeLettrage,
        dateLettrage: new Date(),
      },
    });

    res.json({ message: 'Lettrage effectué', code: codeLettrage });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
