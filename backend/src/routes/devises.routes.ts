// Routes API pour les Devises et Taux de Change

import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import DevisesService from '../services/devises.service';

const router = Router();

// ==================== DEVISES ====================

// Initialiser les devises (admin uniquement)
router.post('/initialiser', authMiddleware, requireRole(['ADMIN']), async (_req: Request, res: Response) => {
  try {
    await DevisesService.initialiserDevises();
    res.json({ message: 'Devises initialisées avec succès' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Lister toutes les devises
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const actifSeulement = req.query.actif !== 'false';
    const devises = await DevisesService.listerDevises(actifSeulement);
    res.json(devises);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir une devise
router.get('/:code', authMiddleware, async (req: Request, res: Response) => {
  try {
    const devise = await DevisesService.obtenirDevise(req.params.code);
    if (!devise) {
      return res.status(404).json({ error: 'Devise non trouvée' });
    }
    res.json(devise);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une devise (admin)
router.post('/', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const devise = await req.prisma.devise.create({
      data: { ...req.body, actif: true },
    });
    res.status(201).json(devise);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Mettre à jour une devise (admin)
router.put('/:code', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const devise = await req.prisma.devise.update({
      where: { code: req.params.code },
      data: req.body,
    });
    res.json(devise);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== TAUX DE CHANGE ====================

// Obtenir le taux de change actuel
router.get('/taux/:source/:cible', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { source, cible } = req.params;
    const { date } = req.query;

    const result = await DevisesService.obtenirTaux(
      source,
      cible,
      date ? new Date(date as string) : undefined
    );
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Définir un taux de change
router.post('/taux', authMiddleware, requireRole(['ADMIN', 'COMPTABLE']), async (req: Request, res: Response) => {
  try {
    const { deviseSource, deviseCible, taux, source, dateEffet } = req.body;

    const tauxChange = await DevisesService.definirTaux({
      deviseSource,
      deviseCible,
      taux,
      source,
      dateEffet: dateEffet ? new Date(dateEffet) : undefined,
    });
    res.status(201).json(tauxChange);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Historique des taux
router.get('/taux/:source/:cible/historique', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { source, cible } = req.params;
    const { dateDebut, dateFin } = req.query;

    const historique = await DevisesService.historiqueTaux(
      source,
      cible,
      dateDebut ? new Date(dateDebut as string) : undefined,
      dateFin ? new Date(dateFin as string) : undefined
    );
    res.json(historique);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Tous les taux actuels
router.get('/taux-actuels/:base?', authMiddleware, async (req: Request, res: Response) => {
  try {
    const base = req.params.base || 'EUR';
    const result = await DevisesService.tousLesTauxActuels(base);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour les taux depuis API externe
router.post('/taux/update-api', authMiddleware, requireRole(['ADMIN']), async (_req: Request, res: Response) => {
  try {
    await DevisesService.mettreAJourTauxDepuisAPI();
    res.json({ message: 'Taux de change mis à jour' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CONVERSION ====================

// Convertir un montant
router.post('/convertir', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { montant, deviseSource, deviseCible, date } = req.body;

    const result = await DevisesService.convertir(
      montant,
      deviseSource,
      deviseCible,
      date ? new Date(date) : undefined
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Enregistrer une conversion
router.post('/conversions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { montant, deviseSource, deviseCible, reference, referenceId } = req.body;

    const conversion = await DevisesService.enregistrerConversion(user.companyId, {
      montant,
      deviseSource,
      deviseCible,
      reference,
      referenceId,
    });
    res.status(201).json(conversion);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Historique des conversions
router.get('/conversions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { dateDebut, dateFin, devise } = req.query;

    const where: any = { companyId: user.companyId };
    if (dateDebut || dateFin) {
      where.dateConversion = {};
      if (dateDebut) where.dateConversion.gte = new Date(dateDebut as string);
      if (dateFin) where.dateConversion.lte = new Date(dateFin as string);
    }
    if (devise) {
      where.OR = [
        { deviseSource: devise },
        { deviseCible: devise },
      ];
    }

    const conversions = await req.prisma.conversionDevise.findMany({
      where,
      orderBy: { dateConversion: 'desc' },
      take: 100,
    });
    res.json(conversions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Taux croisé
router.get('/taux-croise/:source/:cible', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { source, cible } = req.params;
    const { pivot } = req.query;

    const result = await DevisesService.tauxCroise(
      source,
      cible,
      (pivot as string) || 'EUR'
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Obtenir les devises pour un pays
router.get('/pays/:codePays', authMiddleware, async (req: Request, res: Response) => {
  try {
    const devises = DevisesService.getDevisesPourPays(req.params.codePays);
    res.json(devises);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Formater un montant
router.post('/formater', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { montant, devise } = req.body;
    const formate = DevisesService.formaterMontant(montant, devise);
    res.json({ formate });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
