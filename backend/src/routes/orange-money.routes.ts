// Routes Orange Money pour GuinéaManager

import { Router } from 'express';
import * as orangeMoneyController from '../controllers/orange-money.controller';
import { authMiddleware, requireAdmin } from '../middlewares/auth';
import { paymentRateLimiter, publicApiRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Routes protégées (authentification requise)
router.use(authMiddleware);

// POST /api/paiements-mobile/orange-money/initier - Initier un paiement
router.post('/orange-money/initier', paymentRateLimiter, orangeMoneyController.initierPaiement);

// GET /api/paiements-mobile/orange-money/statut/:transactionId - Vérifier le statut
router.get('/orange-money/statut/:transactionId', orangeMoneyController.verifierStatut);

// GET /api/paiements-mobile/orange-money/transactions - Lister les transactions
router.get('/orange-money/transactions', orangeMoneyController.listTransactions);

// POST /api/paiements-mobile/orange-money/configurer - Configurer le compte
router.post('/orange-money/configurer', requireAdmin, orangeMoneyController.configurerCompte);

// Webhook Orange Money (route publique)
router.post('/orange-money/callback', publicApiRateLimiter, orangeMoneyController.handleCallback);

export default router;
