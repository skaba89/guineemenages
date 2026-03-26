import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

// ============================================================================
// PLANS D'ABONNEMENT (Public)
// ============================================================================

// GET /api/plans - Liste tous les plans disponibles
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const plans = await prisma.planAbonnement.findMany({
      where: { actif: true },
      orderBy: { prixMensuel: 'asc' }
    });

    // Masquer les détails sensibles pour les non-authentifiés
    const plansPublic = plans.map(plan => ({
      id: plan.id,
      nom: plan.nom,
      description: plan.description,
      prixMensuel: plan.prixMensuel,
      prixAnnuel: plan.prixAnnuel,
      maxEmployes: plan.maxEmployes === -1 ? 'Illimité' : plan.maxEmployes,
      maxUtilisateurs: plan.maxUtilisateurs === -1 ? 'Illimité' : plan.maxUtilisateurs,
      maxClients: plan.maxClients === -1 ? 'Illimité' : plan.maxClients,
      maxProduits: plan.maxProduits === -1 ? 'Illimité' : plan.maxProduits,
      maxFacturesMois: plan.maxFacturesMois === -1 ? 'Illimité' : plan.maxFacturesMois,
      modules: plan.modules,
      support: plan.support,
      sauvegardeAuto: plan.sauvegardeAuto,
      apiAccess: plan.apiAccess,
      personnalisation: plan.personnalisation,
      multiSociete: plan.multiSociete,
      rapportsAvances: plan.rapportsAvances
    }));

    res.json({ success: true, data: plansPublic });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/plans/:id - Détails d'un plan
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const plan = await prisma.planAbonnement.findUnique({
      where: { id: req.params.id, actif: true }
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan non trouvé' });
    }

    res.json({ success: true, data: plan });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================================
// GESTION ABONNEMENT (Authentifié)
// ============================================================================

// GET /api/plans/abonnement/actuel - Abonnement actuel de la société
router.get('/abonnement/actuel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
      include: { planAbonnement: true }
    });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Société non trouvée' });
    }

    // Calculer les statistiques d'utilisation
    const [employes, clients, produits, facturesMois] = await Promise.all([
      prisma.employe.count({ where: { companyId: req.user!.companyId, actif: true } }),
      prisma.client.count({ where: { companyId: req.user!.companyId } }),
      prisma.produit.count({ where: { companyId: req.user!.companyId, actif: true } }),
      prisma.facture.count({
        where: {
          companyId: req.user!.companyId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    const utilisateurs = await prisma.user.count({
      where: { companyId: req.user!.companyId, actif: true }
    });

    res.json({
      success: true,
      data: {
        plan: company.planAbonnement,
        dateDebut: company.dateDebutAbonnement,
        dateFin: company.dateFinAbonnement,
        utilisation: {
          employes: {
            actuel: employes,
            max: company.planAbonnement?.maxEmployes === -1 ? null : company.planAbonnement?.maxEmployes,
            pourcentage: company.planAbonnement?.maxEmployes === -1 
              ? null 
              : Math.round((employes / (company.planAbonnement?.maxEmployes || 1)) * 100)
          },
          utilisateurs: {
            actuel: utilisateurs,
            max: company.planAbonnement?.maxUtilisateurs === -1 ? null : company.planAbonnement?.maxUtilisateurs,
            pourcentage: company.planAbonnement?.maxUtilisateurs === -1 
              ? null 
              : Math.round((utilisateurs / (company.planAbonnement?.maxUtilisateurs || 1)) * 100)
          },
          clients: {
            actuel: clients,
            max: company.planAbonnement?.maxClients === -1 ? null : company.planAbonnement?.maxClients
          },
          produits: {
            actuel: produits,
            max: company.planAbonnement?.maxProduits === -1 ? null : company.planAbonnement?.maxProduits
          },
          facturesMois: {
            actuel: facturesMois,
            max: company.planAbonnement?.maxFacturesMois === -1 ? null : company.planAbonnement?.maxFacturesMois
          }
        }
      }
    });
  } catch (error) {
    console.error('Get abonnement actuel error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/plans/abonnement/changer - Changer de plan
router.post('/abonnement/changer', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { planId, duree = 'mensuel' } = req.body; // duree: 'mensuel' ou 'annuel'

    const plan = await prisma.planAbonnement.findUnique({
      where: { id: planId, actif: true }
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan non trouvé' });
    }

    // Vérifier les limites du nouveau plan
    const [employes, utilisateurs, clients, produits, facturesMois] = await Promise.all([
      prisma.employe.count({ where: { companyId: req.user!.companyId, actif: true } }),
      prisma.user.count({ where: { companyId: req.user!.companyId, actif: true } }),
      prisma.client.count({ where: { companyId: req.user!.companyId } }),
      prisma.produit.count({ where: { companyId: req.user!.companyId, actif: true } }),
      prisma.facture.count({
        where: {
          companyId: req.user!.companyId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    const erreurs: string[] = [];
    
    if (plan.maxEmployes !== -1 && employes > plan.maxEmployes) {
      erreurs.push(`Ce plan supporte maximum ${plan.maxEmployes} employés (actuel: ${employes})`);
    }
    if (plan.maxUtilisateurs !== -1 && utilisateurs > plan.maxUtilisateurs) {
      erreurs.push(`Ce plan supporte maximum ${plan.maxUtilisateurs} utilisateurs (actuel: ${utilisateurs})`);
    }
    if (plan.maxClients !== -1 && clients > plan.maxClients) {
      erreurs.push(`Ce plan supporte maximum ${plan.maxClients} clients (actuel: ${clients})`);
    }
    if (plan.maxProduits !== -1 && produits > plan.maxProduits) {
      erreurs.push(`Ce plan supporte maximum ${plan.maxProduits} produits (actuel: ${produits})`);
    }

    if (erreurs.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Impossible de changer de plan',
        errors: erreurs 
      });
    }

    // Calculer les dates
    const maintenant = new Date();
    const dateFin = new Date(maintenant);
    if (duree === 'annuel') {
      dateFin.setFullYear(dateFin.getFullYear() + 1);
    } else {
      dateFin.setMonth(dateFin.getMonth() + 1);
    }

    // Mettre à jour la société
    const company = await prisma.company.update({
      where: { id: req.user!.companyId },
      data: {
        planId,
        dateDebutAbonnement: maintenant,
        dateFinAbonnement: dateFin
      },
      include: { planAbonnement: true }
    });

    // Créer l'historique
    await prisma.historiqueAbonnement.create({
      data: {
        companyId: req.user!.companyId,
        planId: plan.id,
        planNom: plan.nom,
        dateDebut: maintenant,
        dateFin,
        prix: duree === 'annuel' ? plan.prixAnnuel : plan.prixMensuel,
        statut: 'ACTIF'
      }
    });

    res.json({ 
      success: true, 
      message: 'Plan mis à jour avec succès',
      data: {
        plan: company.planAbonnement,
        dateDebut: company.dateDebutAbonnement,
        dateFin: company.dateFinAbonnement
      }
    });
  } catch (error) {
    console.error('Change plan error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/plans/abonnement/historique - Historique des abonnements
router.get('/abonnement/historique', authMiddleware, async (req: Request, res: Response) => {
  try {
    const historique = await prisma.historiqueAbonnement.findMany({
      where: { companyId: req.user!.companyId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({ success: true, data: historique });
  } catch (error) {
    console.error('Get historique abonnement error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/plans/comparaison - Comparaison des plans
router.get('/comparaison/feature', async (req: Request, res: Response) => {
  try {
    const plans = await prisma.planAbonnement.findMany({
      where: { actif: true },
      orderBy: { prixMensuel: 'asc' }
    });

    const features = [
      { nom: 'Employés', key: 'maxEmployes', illimite: -1 },
      { nom: 'Utilisateurs', key: 'maxUtilisateurs', illimite: -1 },
      { nom: 'Clients', key: 'maxClients', illimite: -1 },
      { nom: 'Produits', key: 'maxProduits', illimite: -1 },
      { nom: 'Factures/mois', key: 'maxFacturesMois', illimite: -1 },
      { nom: 'Sauvegarde auto', key: 'sauvegardeAuto', type: 'boolean' },
      { nom: 'Accès API', key: 'apiAccess', type: 'boolean' },
      { nom: 'Personnalisation', key: 'personnalisation', type: 'boolean' },
      { nom: 'Multi-société', key: 'multiSociete', type: 'boolean' },
      { nom: 'Rapports avancés', key: 'rapportsAvances', type: 'boolean' }
    ];

    const comparaison = features.map(feature => {
      const row: any = { feature: feature.nom };
      plans.forEach(plan => {
        const value = (plan as any)[feature.key];
        if (feature.type === 'boolean') {
          row[plan.id] = value ? '✓' : '✗';
        } else if (value === feature.illimite) {
          row[plan.id] = 'Illimité';
        } else {
          row[plan.id] = value;
        }
      });
      return row;
    });

    res.json({ 
      success: true, 
      data: { 
        plans: plans.map(p => ({ id: p.id, nom: p.nom, prixMensuel: p.prixMensuel })),
        features: comparaison 
      } 
    });
  } catch (error) {
    console.error('Get comparaison error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
