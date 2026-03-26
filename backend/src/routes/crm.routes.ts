// Routes API pour le CRM

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth';
import CRMService from '../services/crm.service';

const router = Router();

// ==================== PROSPECTS ====================

// Lister les prospects
router.get('/prospects', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { statut, source, assigneA, recherche, page, limit } = req.query;

    const result = await CRMService.listerProspects(
      user.companyId,
      {
        statut: statut as string,
        source: source as string,
        assigneA: assigneA as string,
        recherche: recherche as string,
      },
      page && limit ? { page: Number(page), limit: Number(limit) } : undefined
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un prospect
router.post('/prospects', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const prospect = await CRMService.creerProspect(user.companyId, req.body);
    res.status(201).json(prospect);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Obtenir un prospect
router.get('/prospects/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const prospect = await req.prisma.prospect.findFirst({
      where: { id: req.params.id, companyId: user.companyId },
      include: {
        opportunites: { orderBy: { createdAt: 'desc' } },
        activites: { orderBy: { dateDebut: 'desc' }, take: 20 },
      },
    });
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect non trouvé' });
    }
    res.json(prospect);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour un prospect
router.put('/prospects/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const prospect = await req.prisma.prospect.update({
      where: { id: req.params.id, companyId: user.companyId },
      data: req.body,
    });
    res.json(prospect);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Mettre à jour le statut d'un prospect
router.patch('/prospects/:id/statut', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { statut, notes } = req.body;
    const prospect = await CRMService.mettreAJourStatutProspect(
      req.params.id,
      user.companyId,
      statut,
      notes
    );
    res.json(prospect);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Calculer le score d'un prospect
router.post('/prospects/:id/score', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const score = await CRMService.calculerScoreProspect(req.params.id, user.companyId);
    res.json({ score });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Convertir un prospect en client
router.post('/prospects/:id/convertir', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const client = await CRMService.convertirEnClient(req.params.id, user.companyId);
    res.status(201).json(client);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Supprimer un prospect
router.delete('/prospects/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    await req.prisma.prospect.delete({
      where: { id: req.params.id, companyId: user.companyId },
    });
    res.json({ message: 'Prospect supprimé' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== OPPORTUNITÉS ====================

// Lister les opportunités
router.get('/opportunites', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { statut, etape, prospectId, page, limit } = req.query;

    const result = await CRMService.listerOpportunites(
      user.companyId,
      {
        statut: statut as string,
        etape: etape as string,
        prospectId: prospectId as string,
      },
      page && limit ? { page: Number(page), limit: Number(limit) } : undefined
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une opportunité
router.post('/opportunites', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const opportunite = await CRMService.creerOpportunite(user.companyId, req.body);
    res.status(201).json(opportunite);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Obtenir une opportunité
router.get('/opportunites/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const opportunite = await req.prisma.opportunite.findFirst({
      where: { id: req.params.id, companyId: user.companyId },
      include: {
        prospect: true,
        devis: true,
        activites: { orderBy: { dateDebut: 'desc' } },
      },
    });
    if (!opportunite) {
      return res.status(404).json({ error: 'Opportunité non trouvée' });
    }
    res.json(opportunite);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour une opportunité
router.put('/opportunites/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const opportunite = await req.prisma.opportunite.update({
      where: { id: req.params.id, companyId: user.companyId },
      data: req.body,
    });
    res.json(opportunite);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Changer l'étape d'une opportunité
router.patch('/opportunites/:id/etape', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { etape, probabilite } = req.body;
    const opportunite = await CRMService.mettreAJourEtape(
      req.params.id,
      user.companyId,
      etape,
      probabilite
    );
    res.json(opportunite);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Gagner une opportunité
router.post('/opportunites/:id/gagner', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const client = await CRMService.gagnerOpportunite(req.params.id, user.companyId);
    res.json({ message: 'Opportunité gagnée', client });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Perdre une opportunité
router.post('/opportunites/:id/perdre', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { raison, concurrent } = req.body;
    const opportunite = await CRMService.perdreOpportunite(
      req.params.id,
      user.companyId,
      raison,
      concurrent
    );
    res.json(opportunite);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Supprimer une opportunité
router.delete('/opportunites/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    await req.prisma.opportunite.delete({
      where: { id: req.params.id, companyId: user.companyId },
    });
    res.json({ message: 'Opportunité supprimée' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== ACTIVITÉS ====================

// Lister les activités
router.get('/activites', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { type, statut, prospectId, opportuniteId, assigneA, dateDebut, dateFin, page, limit } = req.query;

    const result = await CRMService.listerActivites(
      user.companyId,
      {
        type: type as string,
        statut: statut as string,
        prospectId: prospectId as string,
        opportuniteId: opportuniteId as string,
        assigneA: assigneA as string,
        dateDebut: dateDebut ? new Date(dateDebut as string) : undefined,
        dateFin: dateFin ? new Date(dateFin as string) : undefined,
      },
      page && limit ? { page: Number(page), limit: Number(limit) } : undefined
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une activité
router.post('/activites', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const activite = await CRMService.creerActivite(user.companyId, {
      ...req.body,
      creePar: user.id,
    });
    res.status(201).json(activite);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Obtenir une activité
router.get('/activites/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const activite = await req.prisma.activiteCRM.findFirst({
      where: { id: req.params.id, companyId: user.companyId },
      include: {
        prospect: { select: { id: true, nom: true, entreprise: true } },
        opportunite: { select: { id: true, nom: true } },
      },
    });
    if (!activite) {
      return res.status(404).json({ error: 'Activité non trouvée' });
    }
    res.json(activite);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour une activité
router.put('/activites/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const activite = await req.prisma.activiteCRM.update({
      where: { id: req.params.id, companyId: user.companyId },
      data: req.body,
    });
    res.json(activite);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Terminer une activité
router.post('/activites/:id/terminer', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { resultat } = req.body;
    const activite = await CRMService.terminerActivite(req.params.id, user.companyId, resultat);
    res.json(activite);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Supprimer une activité
router.delete('/activites/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    await req.prisma.activiteCRM.delete({
      where: { id: req.params.id, companyId: user.companyId },
    });
    res.json({ message: 'Activité supprimée' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== PIPELINE ====================

// Obtenir les stats du pipeline
router.get('/pipeline/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const stats = await CRMService.getPipelineStats(user.companyId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Lister les pipelines
router.get('/pipelines', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const pipelines = await req.prisma.pipelineVente.findMany({
      where: { companyId: user.companyId },
      include: { etapes: { orderBy: { ordre: 'asc' } } },
    });
    res.json(pipelines);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un pipeline
router.post('/pipelines', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { nom, description, etapes } = req.body;

    const pipeline = await req.prisma.pipelineVente.create({
      data: {
        companyId: user.companyId,
        nom,
        description,
        etapes: etapes ? {
          create: etapes.map((e: any, i: number) => ({
            nom: e.nom,
            description: e.description,
            probabilite: e.probabilite || 0,
            couleur: e.couleur,
            ordre: i + 1,
          })),
        } : undefined,
      },
      include: { etapes: true },
    });
    res.status(201).json(pipeline);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Créer le pipeline par défaut
router.post('/pipelines/default', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const pipeline = await CRMService.creerPipelineDefaut(user.companyId);
    res.status(201).json(pipeline);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== DASHBOARD ====================

router.get('/dashboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const dashboard = await CRMService.getDashboard(user.companyId);
    res.json(dashboard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
