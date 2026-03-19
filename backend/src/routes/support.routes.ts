import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware } from '../middlewares/auth.middleware';
import { sendTicketResponseEmail } from '../utils/email';

const router = Router();

// ============================================================
// SUPPORT TICKETS
// ============================================================

// GET /api/support/tickets - List tickets
router.get('/tickets', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { statut, priorite, page = 1, limit = 20 } = req.query;

    const where: any = {
      companyId: req.user!.companyId,
    };

    if (statut) where.statut = statut;
    if (priorite) where.priorite = priorite;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          reponses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: { reponses: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.supportTicket.count({ where }),
    ]);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/support/tickets/:id - Get single ticket
router.get('/tickets/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
      },
      include: {
        reponses: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket non trouvé',
      });
    }

    // Mark notification as read
    await prisma.notification.updateMany({
      where: {
        actionId: ticket.id,
        actionType: 'TICKET',
        lu: false,
      },
      data: { lu: true },
    });

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/support/tickets - Create ticket
router.post('/tickets', authMiddleware, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      sujet: z.string().min(5).max(200),
      description: z.string().min(20),
      priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'CRITIQUE']).optional(),
      categorie: z.enum(['TECHNIQUE', 'FACTURATION', 'COMPTE', 'AUTRE']).optional(),
      piecesJointes: z.array(z.string()).optional(),
    });

    const data = schema.parse(req.body);

    const ticket = await prisma.supportTicket.create({
      data: {
        sujet: data.sujet,
        description: data.description,
        priorite: data.priorite || 'NORMALE',
        categorie: data.categorie || 'AUTRE',
        userId: req.user!.id,
        companyId: req.user!.companyId,
        piecesJointes: data.piecesJointes ? JSON.stringify(data.piecesJointes) : null,
      },
    });

    // Create notification for admin
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        titre: 'Nouveau ticket de support',
        message: `Nouveau ticket: ${data.sujet}`,
        type: 'INFO',
        actionUrl: `/support/tickets/${ticket.id}`,
        actionType: 'TICKET',
        actionId: ticket.id,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Ticket créé avec succès',
      data: ticket,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/support/tickets/:id/reponses - Add response to ticket
router.post('/tickets/:id/reponses', authMiddleware, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      message: z.string().min(10),
      piecesJointes: z.array(z.string()).optional(),
    });

    const data = schema.parse(req.body);

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket non trouvé',
      });
    }

    // Create response
    const reponse = await prisma.ticketReponse.create({
      data: {
        ticketId: ticket.id,
        auteurId: req.user!.id,
        auteurType: 'USER',
        message: data.message,
        piecesJointes: data.piecesJointes ? JSON.stringify(data.piecesJointes) : null,
      },
    });

    // Update ticket status if it was resolved
    if (ticket.statut === 'RESOLU') {
      await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: { 
          statut: 'EN_COURS',
          updatedAt: new Date(),
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Réponse ajoutée',
      data: reponse,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Add response error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/support/tickets/:id/close - Close ticket
router.put('/tickets/:id/close', authMiddleware, async (req: Request, res: Response) => {
  try {
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket non trouvé',
      });
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        statut: 'FERME',
        fermeAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Ticket fermé',
      data: updated,
    });
  } catch (error) {
    console.error('Close ticket error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/support/tickets/:id/satisfaction - Rate ticket satisfaction
router.post('/tickets/:id/satisfaction', authMiddleware, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      satisfaction: z.number().min(1).max(5),
      commentaire: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId,
        statut: 'RESOLU',
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket non trouvé ou non résolu',
      });
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        satisfaction: data.satisfaction,
        commentaire: data.commentaire,
      },
    });

    res.json({
      success: true,
      message: 'Merci pour votre évaluation',
      data: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Rate ticket error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/support/categories - Get ticket categories
router.get('/categories', authMiddleware, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { value: 'TECHNIQUE', label: 'Problème technique', icon: 'settings' },
      { value: 'FACTURATION', label: 'Facturation & Paiement', icon: 'credit-card' },
      { value: 'COMPTE', label: 'Compte & Accès', icon: 'user' },
      { value: 'AUTRE', label: 'Autre', icon: 'help-circle' },
    ],
  });
});

// GET /api/support/stats - Get support statistics
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const [total, ouverts, enCours, resolus, avgSatisfaction] = await Promise.all([
      prisma.supportTicket.count({
        where: { companyId: req.user!.companyId },
      }),
      prisma.supportTicket.count({
        where: { companyId: req.user!.companyId, statut: 'OUVERT' },
      }),
      prisma.supportTicket.count({
        where: { companyId: req.user!.companyId, statut: 'EN_COURS' },
      }),
      prisma.supportTicket.count({
        where: { companyId: req.user!.companyId, statut: 'RESOLU' },
      }),
      prisma.supportTicket.aggregate({
        where: {
          companyId: req.user!.companyId,
          satisfaction: { not: null },
        },
        _avg: { satisfaction: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        ouverts,
        enCours,
        resolus,
        avgSatisfaction: avgSatisfaction._avg.satisfaction || 0,
      },
    });
  } catch (error) {
    console.error('Get support stats error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================
// KNOWLEDGE BASE (FAQ)
// ============================================================

const faqArticles = [
  {
    id: '1',
    categorie: 'DEBUT',
    titre: 'Comment créer mon entreprise sur GuinéaManager?',
    contenu: `Pour créer votre entreprise:
    
1. Cliquez sur "S'inscrire" sur la page d'accueil
2. Remplissez vos informations personnelles et le nom de votre entreprise
3. Sélectionnez votre pays (Guinée, Sénégal, etc.)
4. Validez votre email
5. Vous pouvez maintenant accéder à votre tableau de bord

Votre entreprise dispose automatiquement d'un essai gratuit de 30 jours.`,
  },
  {
    id: '2',
    categorie: 'FACTURATION',
    titre: 'Comment créer une facture?',
    contenu: `Pour créer une facture:

1. Allez dans le menu "Factures"
2. Cliquez sur "Nouvelle facture"
3. Sélectionnez ou créez un client
4. Ajoutez les lignes de facturation (produits/services)
5. Vérifiez les totaux et la TVA
6. Enregistrez ou envoyez directement par email

Les factures sont automatiquement numérotées selon votre configuration.`,
  },
  {
    id: '3',
    categorie: 'PAIE',
    titre: 'Comment calculer la paie de mes employés?',
    contenu: `Le calcul de la paie est automatique:

1. Allez dans "Paie" > "Calculer la paie"
2. Sélectionnez le mois et l'année
3. Choisissez les employés concernés
4. Le système calcule automatiquement:
   - Le salaire de base
   - Les cotisations CNSS (selon votre pays)
   - L'IPR/IR (impôt sur le revenu)
   - Le net à payer

Vous pouvez ensuite valider et payer les bulletins.`,
  },
  {
    id: '4',
    categorie: 'PAIEMENT',
    titre: 'Comment payer mon abonnement via Mobile Money?',
    contenu: `Pour payer avec Mobile Money:

1. Allez dans "Paramètres" > "Mon abonnement"
2. Cliquez sur "Changer de plan" ou "Renouveler"
3. Sélectionnez votre plan et la durée
4. Choisissez "Orange Money" ou "MTN Money"
5. Entrez votre numéro de téléphone
6. Vous recevrez une demande de confirmation sur votre mobile
7. Validez avec votre code PIN

Votre abonnement est activé immédiatement après confirmation.`,
  },
  {
    id: '5',
    categorie: 'COMPTE',
    titre: 'Comment activer l\'authentification à deux facteurs?',
    contenu: `Pour sécuriser votre compte:

1. Allez dans "Paramètres" > "Sécurité"
2. Cliquez sur "Activer 2FA"
3. Choisissez votre méthode:
   - Application d'authentification (Google Authenticator, Authy)
   - SMS (code envoyé par SMS)
4. Scannez le QR code ou entrez votre numéro
5. Entrez le code de vérification
6. Sauvegardez vos codes de récupération

Votre compte est maintenant protégé par 2FA.`,
  },
];

// GET /api/support/faq - Get FAQ articles
router.get('/faq', authMiddleware, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: faqArticles,
  });
});

// GET /api/support/faq/:id - Get single FAQ article
router.get('/faq/:id', authMiddleware, (req: Request, res: Response) => {
  const article = faqArticles.find(a => a.id === req.params.id);
  
  if (!article) {
    return res.status(404).json({
      success: false,
      message: 'Article non trouvé',
    });
  }

  res.json({
    success: true,
    data: article,
  });
});

export default router;
