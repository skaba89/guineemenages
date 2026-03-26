import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware } from '../middlewares/auth.middleware';
import { paymentService } from '../utils/payment';
import { sendSubscriptionEmail } from '../utils/email';

const router = Router();

// ============================================================
// SUBSCRIPTION PAYMENTS
// ============================================================

// POST /api/payments/initiate - Initiate payment for subscription
router.post('/initiate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      planId: z.string(),
      duree: z.enum(['MENSUEL', 'ANNUEL']),
      methode: z.enum(['ORANGE_MONEY', 'MTN_MONEY', 'CARTE']),
      phoneNumber: z.string().optional(),
    });

    const data = schema.parse(req.body);

    // Get plan details
    const plan = await prisma.planAbonnement.findUnique({
      where: { id: data.planId },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan non trouvé',
      });
    }

    // Calculate amount
    const amount = data.duree === 'ANNUEL' ? plan.prixAnnuel : plan.prixMensuel;

    if (amount === 0) {
      // Free plan - activate directly
      await prisma.company.update({
        where: { id: req.user!.companyId },
        data: {
          planId: plan.id,
          dateDebutAbonnement: new Date(),
          dateFinAbonnement: data.duree === 'ANNUEL' 
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return res.json({
        success: true,
        message: 'Plan activé avec succès',
        data: { plan },
      });
    }

    // Get company for currency
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
    });

    const currency = company?.devise || 'GNF';

    // Initiate payment
    const paymentResult = await paymentService.initiatePayment(data.methode, {
      amount,
      currency,
      phoneNumber: data.phoneNumber,
      email: req.user!.email,
      description: `Abonnement ${plan.nom} - ${data.duree === 'ANNUEL' ? 'Annuel' : 'Mensuel'}`,
      metadata: {
        planId: plan.id,
        userId: req.user!.id,
        companyId: req.user!.companyId,
        duree: data.duree,
      },
    });

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: paymentResult.message || 'Erreur lors du paiement',
      });
    }

    // Record payment in database
    const payment = await paymentService.recordPayment({
      companyId: req.user!.companyId,
      montant: amount,
      devise: currency,
      methode: data.methode,
      reference: paymentResult.reference || '',
      transactionId: paymentResult.transactionId || '',
      planId: plan.id,
      planNom: plan.nom,
      duree: data.duree,
      statut: 'EN_ATTENTE',
    });

    res.json({
      success: true,
      message: 'Paiement initié',
      data: {
        paymentId: payment.id,
        transactionId: paymentResult.transactionId,
        reference: paymentResult.reference,
        redirectUrl: paymentResult.redirectUrl,
        status: paymentResult.status,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Initiate payment error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/payments/verify/:transactionId - Verify payment status
router.get('/verify/:transactionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const { methode } = req.query;

    if (!methode || !['ORANGE_MONEY', 'MTN_MONEY', 'CARTE'].includes(methode as string)) {
      return res.status(400).json({
        success: false,
        message: 'Méthode de paiement requise',
      });
    }

    // Find payment record
    const payment = await prisma.paiementAbonnement.findFirst({
      where: {
        OR: [
          { transactionId },
          { reference: transactionId },
        ],
        companyId: req.user!.companyId,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé',
      });
    }

    // Verify with payment provider
    const verification = await paymentService.verifyPayment(
      methode as 'ORANGE_MONEY' | 'MTN_MONEY' | 'CARTE',
      transactionId
    );

    // Update payment status if changed
    if (verification.status !== payment.statut) {
      await paymentService.updatePaymentStatus(
        payment.id,
        verification.status === 'SUCCESS' ? 'REUSSI' : verification.status
      );

      // If payment successful, activate subscription
      if (verification.status === 'SUCCESS') {
        const durationDays = payment.duree === 'ANNUEL' ? 365 : 30;
        
        await prisma.company.update({
          where: { id: req.user!.companyId },
          data: {
            planId: payment.planId,
            dateDebutAbonnement: new Date(),
            dateFinAbonnement: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
          },
        });

        // Send confirmation email
        await sendSubscriptionEmail(
          req.user!.email,
          payment.planNom,
          `${payment.montant / 100} ${payment.devise}`,
          new Date().toLocaleDateString('fr-FR'),
          new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
          req.user!.company?.nom || 'GuinéaManager'
        );
      }
    }

    res.json({
      success: true,
      data: {
        status: verification.status,
        payment: {
          id: payment.id,
          montant: payment.montant,
          devise: payment.devise,
          planNom: payment.planNom,
          duree: payment.duree,
        },
      },
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/payments/history - Get payment history
router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payments = await paymentService.getPaymentHistory(req.user!.companyId);

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/payments/webhook/orange-money - Orange Money webhook
router.post('/webhook/orange-money', async (req: Request, res: Response) => {
  try {
    const { transaction_id, status, order_id } = req.body;

    const payment = await prisma.paiementAbonnement.findFirst({
      where: { reference: order_id },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const newStatus = status === 'SUCCESS' ? 'REUSSI' : status === 'FAILED' ? 'ECHEC' : 'EN_ATTENTE';
    
    await paymentService.updatePaymentStatus(payment.id, newStatus, req.body);

    if (newStatus === 'REUSSI') {
      const durationDays = payment.duree === 'ANNUEL' ? 365 : 30;
      
      await prisma.company.update({
        where: { id: payment.companyId },
        data: {
          planId: payment.planId,
          dateDebutAbonnement: new Date(),
          dateFinAbonnement: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
        },
      });
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Orange Money webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// POST /api/payments/webhook/mtn-money - MTN Money webhook
router.post('/webhook/mtn-money', async (req: Request, res: Response) => {
  try {
    const { externalReference, status, financialTransactionId } = req.body;

    const payment = await prisma.paiementAbonnement.findFirst({
      where: { reference: externalReference },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const newStatus = status === 'SUCCESSFUL' ? 'REUSSI' : status === 'FAILED' ? 'ECHEC' : 'EN_ATTENTE';
    
    await paymentService.updatePaymentStatus(payment.id, newStatus, req.body);

    if (newStatus === 'REUSSI') {
      const durationDays = payment.duree === 'ANNUEL' ? 365 : 30;
      
      await prisma.company.update({
        where: { id: payment.companyId },
        data: {
          planId: payment.planId,
          dateDebutAbonnement: new Date(),
          dateFinAbonnement: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
        },
      });
    }

    res.json({ received: true });
  } catch (error) {
    console.error('MTN Money webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// GET /api/payments/methods - Get available payment methods
router.get('/methods', authMiddleware, async (req: Request, res: Response) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
    });

    const methods = [];

    // Orange Money - Available in all supported countries
    methods.push({
      id: 'ORANGE_MONEY',
      name: 'Orange Money',
      icon: '/icons/orange-money.png',
      available: true,
      countries: ['GN', 'SN', 'ML', 'CI', 'BF', 'BJ', 'NE'],
    });

    // MTN Money - Available in most countries
    methods.push({
      id: 'MTN_MONEY',
      name: 'MTN Mobile Money',
      icon: '/icons/mtn-money.png',
      available: ['GN', 'CI', 'BJ', 'NE'].includes(company?.codePays || 'GN'),
      countries: ['GN', 'CI', 'BJ', 'NE'],
    });

    // Card payment - Available everywhere
    methods.push({
      id: 'CARTE',
      name: 'Carte bancaire',
      icon: '/icons/card.png',
      available: true,
      countries: null,
    });

    res.json({
      success: true,
      data: methods,
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
