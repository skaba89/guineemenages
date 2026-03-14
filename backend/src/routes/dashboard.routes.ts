import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

// GET /api/dashboard/stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const debutAnnee = new Date(now.getFullYear(), 0, 1);

    // Parallel queries for performance
    const [
      caMois,
      caAnnee,
      facturesEnAttente,
      facturesEnRetard,
      clientsActifs,
      produitsStockBas,
      masseSalarialeMois,
      depensesMois
    ] = await Promise.all([
      // CA mois (factures payées)
      prisma.facture.aggregate({
        where: {
          companyId,
          statut: 'PAYEE',
          dateEmission: { gte: debutMois }
        },
        _sum: { montantTTC: true }
      }),

      // CA année
      prisma.facture.aggregate({
        where: {
          companyId,
          statut: 'PAYEE',
          dateEmission: { gte: debutAnnee }
        },
        _sum: { montantTTC: true }
      }),

      // Factures en attente
      prisma.facture.count({
        where: { companyId, statut: 'ENVOYEE' }
      }),

      // Factures en retard
      prisma.facture.count({
        where: {
          companyId,
          statut: 'EN_RETARD'
        }
      }),

      // Clients actifs
      prisma.client.count({
        where: { companyId }
      }),

      // Produits stock bas
      prisma.$queryRaw`
        SELECT COUNT(*) as count FROM Produit 
        WHERE companyId = ${companyId} 
        AND stockActuel <= stockMin 
        AND actif = 1
      `,

      // Masse salariale mois
      prisma.bulletinPaie.aggregate({
        where: {
          companyId,
          mois: now.getMonth() + 1,
          annee: now.getFullYear(),
          statut: 'PAYE'
        },
        _sum: { netAPayer: true }
      }),

      // Dépenses mois
      prisma.depense.aggregate({
        where: {
          companyId,
          date: { gte: debutMois }
        },
        _sum: { montant: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        caMois: (caMois._sum.montantTTC || 0) / 100,
        caAnnee: (caAnnee._sum.montantTTC || 0) / 100,
        facturesEnAttente,
        facturesEnRetard,
        clientsActifs,
        produitsStockBas: Number((produitsStockBas as any)[0]?.count || 0),
        masseSalarialeMois: (masseSalarialeMois._sum.netAPayer || 0) / 100,
        depensesMois: (depensesMois._sum.montant || 0) / 100
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/dashboard/factures-recentes
router.get('/factures-recentes', async (req: Request, res: Response) => {
  try {
    const factures = await prisma.facture.findMany({
      where: { companyId: req.user!.companyId },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({ success: true, data: factures });
  } catch (error) {
    console.error('Get recent factures error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/dashboard/alertes
router.get('/alertes', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;

    // Stock bas
    const stockBas = await prisma.$queryRaw`
      SELECT id, nom, stockActuel, stockMin FROM Produit 
      WHERE companyId = ${companyId} 
      AND stockActuel <= stockMin 
      AND actif = 1
      ORDER BY stockActuel ASC
      LIMIT 10
    `;

    // Factures en retard
    const facturesRetard = await prisma.facture.findMany({
      where: {
        companyId,
        statut: 'EN_RETARD'
      },
      include: { client: true },
      take: 5
    });

    res.json({
      success: true,
      data: {
        stockBas,
        facturesRetard
      }
    });
  } catch (error) {
    console.error('Get alertes error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
