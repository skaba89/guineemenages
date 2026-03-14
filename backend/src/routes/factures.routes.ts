import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

// GET /api/factures
router.get('/', async (req: Request, res: Response) => {
  try {
    const { statut, clientId, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { companyId: req.user!.companyId };
    if (statut) where.statut = statut;
    if (clientId) where.clientId = clientId;

    const [factures, total] = await Promise.all([
      prisma.facture.findMany({
        where,
        include: {
          client: true,
          lignes: {
            include: { produit: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.facture.count({ where })
    ]);

    res.json({
      success: true,
      data: factures,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    console.error('Get factures error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/factures/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const facture = await prisma.facture.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: {
        client: true,
        lignes: { include: { produit: true } },
        paiements: true
      }
    });

    if (!facture) {
      return res.status(404).json({ success: false, message: 'Facture non trouvée' });
    }

    res.json({ success: true, data: facture });
  } catch (error) {
    console.error('Get facture error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/factures
router.post('/', async (req: Request, res: Response) => {
  try {
    const { clientId, dateEcheance, lignes, notes, modePaiement } = req.body;

    // Calculate totals
    let montantHT = 0;
    let montantTVA = 0;

    const lignesData = lignes.map((ligne: any) => {
      const ht = ligne.quantite * ligne.prixUnitaire;
      const tva = Math.round(ht * (ligne.tauxTVA || 18) / 100);
      montantHT += ht;
      montantTVA += tva;
      return {
        ...ligne,
        montantHT: ht,
        montantTVA: tva,
        montantTTC: ht + tva
      };
    });

    const montantTTC = montantHT + montantTVA;

    // Generate invoice number
    const year = new Date().getFullYear();
    const count = await prisma.facture.count({
      where: { companyId: req.user!.companyId, numero: { startsWith: `FAC-${year}` } }
    });
    const numero = `FAC-${year}-${String(count + 1).padStart(4, '0')}`;

    const facture = await prisma.facture.create({
      data: {
        numero,
        clientId,
        dateEmission: new Date(),
        dateEcheance: new Date(dateEcheance),
        montantHT,
        montantTVA,
        montantTTC,
        statut: 'BROUILLON',
        modePaiement,
        notes,
        companyId: req.user!.companyId,
        lignes: {
          create: lignesData
        }
      },
      include: { client: true, lignes: true }
    });

    res.status(201).json({ success: true, message: 'Facture créée', data: facture });
  } catch (error) {
    console.error('Create facture error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/factures/:id/statut
router.put('/:id/statut', async (req: Request, res: Response) => {
  try {
    const { statut } = req.body;

    const existing = await prisma.facture.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Facture non trouvée' });
    }

    const facture = await prisma.facture.update({
      where: { id: req.params.id },
      data: { statut }
    });

    res.json({ success: true, message: 'Statut mis à jour', data: facture });
  } catch (error) {
    console.error('Update statut error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/factures/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.facture.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Facture non trouvée' });
    }

    await prisma.ligneFacture.deleteMany({ where: { factureId: req.params.id } });
    await prisma.facture.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'Facture supprimée' });
  } catch (error) {
    console.error('Delete facture error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
