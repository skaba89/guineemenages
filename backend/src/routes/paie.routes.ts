import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware } from '../middlewares/auth.middleware';
import { calculerPaieComplete, calculerMasseSalariale } from '../utils/payroll';

const router = Router();
router.use(authMiddleware);

// GET /api/paie/bulletins
router.get('/bulletins', async (req: Request, res: Response) => {
  try {
    const { mois, annee, employeId, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { companyId: req.user!.companyId };
    if (mois) where.mois = Number(mois);
    if (annee) where.annee = Number(annee);
    if (employeId) where.employeId = employeId;

    const [bulletins, total] = await Promise.all([
      prisma.bulletinPaie.findMany({
        where,
        include: { employe: true },
        orderBy: [{ annee: 'desc' }, { mois: 'desc' }],
        skip,
        take: Number(limit)
      }),
      prisma.bulletinPaie.count({ where })
    ]);

    res.json({
      success: true,
      data: bulletins,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    console.error('Get bulletins error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/paie/calculer
router.post('/calculer', async (req: Request, res: Response) => {
  try {
    const {
      salaireBase,
      heuresSupplementaires,
      tauxHoraire,
      primes,
      indemnites,
      autresAvantages,
      acomptes,
      autresRetenues
    } = req.body;

    // All amounts are expected in centimes
    const resultat = calculerPaieComplete({
      salaireBase: salaireBase * 100, // Convert to centimes
      heuresSupplementaires: heuresSupplementaires || 0,
      tauxHoraire: (tauxHoraire || 0) * 100,
      primes: (primes || 0) * 100,
      indemnites: (indemnites || 0) * 100,
      autresAvantages: (autresAvantages || 0) * 100,
      acomptes: (acomptes || 0) * 100,
      autresRetenues: (autresRetenues || 0) * 100
    });

    res.json({
      success: true,
      data: {
        ...resultat,
        // Convert back to GNF for display
        brutTotalGNF: Math.round(resultat.brutTotal / 100),
        cnssEmployeGNF: Math.round(resultat.cnssEmploye / 100),
        cnssEmployeurGNF: Math.round(resultat.cnssEmployeur / 100),
        iprGNF: Math.round(resultat.ipr / 100),
        netAPayerGNF: Math.round(resultat.netAPayer / 100),
        coutTotalEmployeurGNF: Math.round(resultat.coutTotalEmployeur / 100)
      }
    });
  } catch (error) {
    console.error('Calcul paie error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/paie/bulletins
router.post('/bulletins', async (req: Request, res: Response) => {
  try {
    const {
      employeId,
      mois,
      annee,
      heuresSupplementaires,
      tauxHoraire,
      primes,
      indemnites,
      autresAvantages,
      acomptes,
      autresRetenues
    } = req.body;

    // Check employee exists
    const employe = await prisma.employe.findFirst({
      where: { id: employeId, companyId: req.user!.companyId }
    });

    if (!employe) {
      return res.status(404).json({ success: false, message: 'Employé non trouvé' });
    }

    // Check if bulletin already exists
    const existing = await prisma.bulletinPaie.findUnique({
      where: { employeId_mois_annee: { employeId, mois, annee } }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Un bulletin existe déjà pour ce mois' });
    }

    // Calculate payroll
    const calcul = calculerPaieComplete({
      salaireBase: employe.salaireBase,
      heuresSupplementaires: heuresSupplementaires || 0,
      tauxHoraire: tauxHoraire || 0,
      primes: primes || 0,
      indemnites: indemnites || 0,
      autresAvantages: autresAvantages || 0,
      acomptes: acomptes || 0,
      autresRetenues: autresRetenues || 0
    });

    const bulletin = await prisma.bulletinPaie.create({
      data: {
        employeId,
        mois,
        annee,
        salaireBase: employe.salaireBase,
        heuresSupplementaires: heuresSupplementaires || 0,
        montantHeuresSupp: calcul.brutTotal - employe.salaireBase - (primes || 0) - (indemnites || 0),
        primes: primes || 0,
        indemnites: indemnites || 0,
        autresAvantages: autresAvantages || 0,
        brutTotal: calcul.brutTotal,
        cnssEmploye: calcul.cnssEmploye,
        cnssEmployeur: calcul.cnssEmployeur,
        ipr: calcul.ipr,
        autresRetenues: autresRetenues || 0,
        acomptes: acomptes || 0,
        netAPayer: calcul.netAPayer,
        coutTotalEmployeur: calcul.coutTotalEmployeur,
        statut: 'BROUILLON',
        companyId: req.user!.companyId
      },
      include: { employe: true }
    });

    res.status(201).json({ success: true, message: 'Bulletin créé', data: bulletin });
  } catch (error) {
    console.error('Create bulletin error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/paie/bulletins/:id/valider
router.put('/bulletins/:id/valider', async (req: Request, res: Response) => {
  try {
    const bulletin = await prisma.bulletinPaie.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!bulletin) {
      return res.status(404).json({ success: false, message: 'Bulletin non trouvé' });
    }

    const updated = await prisma.bulletinPaie.update({
      where: { id: req.params.id },
      data: { statut: 'VALIDE' }
    });

    res.json({ success: true, message: 'Bulletin validé', data: updated });
  } catch (error) {
    console.error('Validate bulletin error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/paie/bulletins/:id/payer
router.put('/bulletins/:id/payer', async (req: Request, res: Response) => {
  try {
    const bulletin = await prisma.bulletinPaie.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!bulletin) {
      return res.status(404).json({ success: false, message: 'Bulletin non trouvé' });
    }

    const updated = await prisma.bulletinPaie.update({
      where: { id: req.params.id },
      data: { statut: 'PAYE', datePaiement: new Date() }
    });

    res.json({ success: true, message: 'Bulletin marqué comme payé', data: updated });
  } catch (error) {
    console.error('Pay bulletin error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/paie/masse-salariale
router.get('/masse-salariale', async (req: Request, res: Response) => {
  try {
    const { mois, annee } = req.query;

    const bulletins = await prisma.bulletinPaie.findMany({
      where: {
        companyId: req.user!.companyId,
        mois: mois ? Number(mois) : undefined,
        annee: annee ? Number(annee) : undefined,
        statut: 'PAYE'
      }
    });

    const masse = calculerMasseSalariale(bulletins);

    res.json({
      success: true,
      data: {
        totalNetGNF: Math.round(masse.totalNet / 100),
        totalCoutEmployeurGNF: Math.round(masse.totalCoutEmployeur / 100),
        nombreBulletins: bulletins.length
      }
    });
  } catch (error) {
    console.error('Get masse salariale error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
