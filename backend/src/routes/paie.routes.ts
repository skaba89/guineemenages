import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware } from '../middlewares/auth.middleware';
import { calculerPaieComplete, calculerMasseSalariale, formaterMontant } from '../utils/payroll-multi';
import { getConfigPays, getConfigParDefaut, LISTE_PAYS } from '../config/countries';

const router = Router();
router.use(authMiddleware);

// GET /api/paie/config-pays - Obtenir la configuration fiscale du pays
router.get('/config-pays', async (req: Request, res: Response) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId }
    });

    const codePays = company?.codePays || 'GN';
    const config = getConfigPays(codePays) || getConfigParDefaut();

    res.json({
      success: true,
      data: {
        pays: config.nom,
        codePays: config.code,
        devise: config.symboleDevise,
        cotisations: {
          organisme: config.cotisations.organisme,
          tauxEmploye: config.cotisations.tauxEmploye,
          tauxEmployeur: config.cotisations.tauxEmployeur,
          plafond: config.cotisations.plafond
        },
        impotRevenu: {
          nom: config.impotRevenu.nom,
          tranches: config.impotRevenu.tranches.map(t => ({
            max: t.max === Infinity ? null : t.max,
            taux: t.taux
          })),
          abattement: config.impotRevenu.abattement
        },
        taxesAdditionnelles: config.taxesAdditionnelles,
        tvaDefaut: config.tvaDefaut,
        mobileMoney: config.mobileMoney
      }
    });
  } catch (error) {
    console.error('Get config pays error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/paie/pays-supportes - Liste des pays supportés
router.get('/pays-supportes', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: LISTE_PAYS
    });
  } catch (error) {
    console.error('Get pays supportés error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

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
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId }
    });

    const codePays = company?.codePays || 'GN';
    const config = getConfigPays(codePays) || getConfigParDefaut();

    const {
      salaireBase,
      heuresSupplementaires,
      tauxHoraire,
      primes,
      indemnites,
      autresAvantages,
      acomptes,
      autresRetenues,
      nombreParts
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
      autresRetenues: (autresRetenues || 0) * 100,
      nombreParts: nombreParts || 1
    }, codePays);

    res.json({
      success: true,
      data: {
        ...resultat,
        // Convert back to currency units for display
        brutTotalDisplay: Math.round(resultat.brutTotal / 100),
        cotisationEmployeDisplay: Math.round(resultat.cotisationEmploye / 100),
        cotisationEmployeurDisplay: Math.round(resultat.cotisationEmployeur / 100),
        impotRevenuDisplay: Math.round(resultat.impotRevenu / 100),
        netAPayerDisplay: Math.round(resultat.netAPayer / 100),
        coutTotalEmployeurDisplay: Math.round(resultat.coutTotalEmployeur / 100),
        devise: config.symboleDevise,
        pays: config.nom,
        organismeSocial: config.cotisations.organisme,
        nomImpot: config.impotRevenu.nom
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
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId }
    });

    const codePays = company?.codePays || 'GN';

    const {
      employeId,
      mois,
      annee,
      heuresSupplementaires,
      tauxHoraireSupp,
      primes,
      primesDetail,
      indemnites,
      indemnitesDetail,
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

    // Calculate payroll using multi-country calculator
    const calcul = calculerPaieComplete({
      salaireBase: employe.salaireBase,
      heuresSupplementaires: heuresSupplementaires || 0,
      tauxHoraire: tauxHoraireSupp || 0,
      primes: primes || 0,
      indemnites: indemnites || 0,
      autresAvantages: autresAvantages || 0,
      acomptes: acomptes || 0,
      autresRetenues: autresRetenues || 0,
      nombreParts: employe.nombrePartsFiscales || 1
    }, codePays);

    const bulletin = await prisma.bulletinPaie.create({
      data: {
        employeId,
        mois,
        annee,
        periodePaiement: getPeriodePaiement(mois, annee),
        salaireBase: employe.salaireBase,
        heuresSupplementaires: heuresSupplementaires || 0,
        tauxHoraireSupp: tauxHoraireSupp || 0,
        montantHeuresSupp: calcul.montantHeuresSupp,
        primes: primes || 0,
        primesDetail: primesDetail ? JSON.stringify(primesDetail) : null,
        indemnites: indemnites || 0,
        indemnitesDetail: indemnitesDetail ? JSON.stringify(indemnitesDetail) : null,
        autresAvantages: autresAvantages || 0,
        brutTotal: calcul.brutTotal,
        baseCNSS: calcul.baseCNSS,
        cnssEmploye: calcul.cotisationEmploye,
        cnssEmployeur: calcul.cotisationEmployeur,
        baseImposable: calcul.baseImposable,
        ipr: calcul.impotRevenu,
        autresRetenues: autresRetenues || 0,
        acomptes: acomptes || 0,
        totalRetenues: calcul.totalRetenues,
        netAPayer: calcul.netAPayer,
        netImposable: calcul.baseImposable - calcul.impotRevenu,
        coutTotalEmployeur: calcul.coutTotalEmployeur,
        taxesAdditionnelles: calcul.taxesAdditionnelles.length > 0 
          ? JSON.stringify(calcul.taxesAdditionnelles) 
          : null,
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
    const { modePaiement, referencePaiement } = req.body;
    
    const bulletin = await prisma.bulletinPaie.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!bulletin) {
      return res.status(404).json({ success: false, message: 'Bulletin non trouvé' });
    }

    const updated = await prisma.bulletinPaie.update({
      where: { id: req.params.id },
      data: { 
        statut: 'PAYE', 
        datePaiement: new Date(),
        modePaiement: modePaiement || 'VIREMENT',
        referencePaiement: referencePaiement || null
      }
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
        totalBrut: Math.round(masse.totalBrut / 100),
        totalCotisationsEmploye: Math.round(masse.totalCotisationsEmploye / 100),
        totalCotisationsEmployeur: Math.round(masse.totalCotisationsEmployeur / 100),
        totalImpots: Math.round(masse.totalImpots / 100),
        totalNet: Math.round(masse.totalNet / 100),
        totalCoutEmployeur: Math.round(masse.totalCoutEmployeur / 100),
        nombreBulletins: bulletins.length,
        nombreEmployes: masse.nombreEmployes
      }
    });
  } catch (error) {
    console.error('Get masse salariale error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/paie/rapport-cotisations - Rapport des cotisations sociales
router.get('/rapport-cotisations', async (req: Request, res: Response) => {
  try {
    const { mois, annee } = req.query;

    if (!mois || !annee) {
      return res.status(400).json({ success: false, message: 'Mois et année requis' });
    }

    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId }
    });

    const codePays = company?.codePays || 'GN';
    const config = getConfigPays(codePays) || getConfigParDefaut();

    const bulletins = await prisma.bulletinPaie.findMany({
      where: {
        companyId: req.user!.companyId,
        mois: Number(mois),
        annee: Number(annee),
        statut: { in: ['VALIDE', 'PAYE'] }
      },
      include: { employe: true }
    });

    const details = bulletins.map(b => ({
      matricule: b.employe.matricule,
      nom: `${b.employe.prenom} ${b.employe.nom}`,
      brut: b.brutTotal,
      cotisationEmploye: b.cnssEmploye,
      cotisationEmployeur: b.cnssEmployeur,
      total: b.cnssEmploye + b.cnssEmployeur
    }));

    const totaux = {
      totalBrut: details.reduce((sum, d) => sum + d.brut, 0),
      totalCotisationEmploye: details.reduce((sum, d) => sum + d.cotisationEmploye, 0),
      totalCotisationEmployeur: details.reduce((sum, d) => sum + d.cotisationEmployeur, 0),
      totalGeneral: details.reduce((sum, d) => sum + d.total, 0)
    };

    res.json({
      success: true,
      data: {
        periode: getPeriodePaiement(Number(mois), Number(annee)),
        organisme: config.cotisations.organisme,
        pays: config.nom,
        devise: config.symboleDevise,
        details,
        totaux
      }
    });
  } catch (error) {
    console.error('Get rapport cotisations error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/paie/rapport-imposition - Rapport d'imposition
router.get('/rapport-imposition', async (req: Request, res: Response) => {
  try {
    const { annee } = req.query;

    if (!annee) {
      return res.status(400).json({ success: false, message: 'Année requise' });
    }

    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId }
    });

    const codePays = company?.codePays || 'GN';
    const config = getConfigPays(codePays) || getConfigParDefaut();

    const bulletins = await prisma.bulletinPaie.findMany({
      where: {
        companyId: req.user!.companyId,
        annee: Number(annee),
        statut: { in: ['VALIDE', 'PAYE'] }
      },
      include: { employe: true }
    });

    // Grouper par employé
    const parEmploye = new Map<string, any>();
    
    bulletins.forEach(b => {
      const key = b.employeId;
      if (!parEmploye.has(key)) {
        parEmploye.set(key, {
          matricule: b.employe.matricule,
          nom: `${b.employe.prenom} ${b.employe.nom}`,
          brutAnnuel: 0,
          baseImposable: 0,
          impot: 0
        });
      }
      const emp = parEmploye.get(key);
      emp.brutAnnuel += b.brutTotal;
      emp.baseImposable += b.baseImposable;
      emp.impot += b.ipr;
    });

    const details = Array.from(parEmploye.values());

    res.json({
      success: true,
      data: {
        annee: Number(annee),
        nomImpot: config.impotRevenu.nom,
        pays: config.nom,
        devise: config.symboleDevise,
        details,
        totaux: {
          totalBrut: details.reduce((sum, d) => sum + d.brutAnnuel, 0),
          totalBaseImposable: details.reduce((sum, d) => sum + d.baseImposable, 0),
          totalImpot: details.reduce((sum, d) => sum + d.impot, 0)
        }
      }
    });
  } catch (error) {
    console.error('Get rapport imposition error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Helper function
function getPeriodePaiement(mois: number, annee: number): string {
  const moisNoms = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return `${moisNoms[mois - 1]} ${annee}`;
}

export default router;
