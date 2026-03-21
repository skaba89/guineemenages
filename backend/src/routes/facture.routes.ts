// Routes Facture pour GuinéaManager

import { Router } from 'express';
import * as factureController from '../controllers/facture.controller';
import { authMiddleware } from '../middlewares/auth';
import { checkInvoiceLimit } from '../middlewares/plan';
import { createRateLimiter, exportRateLimiter, paymentRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/factures - Lister les factures
router.get('/', factureController.listFactures);

// POST /api/factures - Créer une facture
router.post('/', createRateLimiter, checkInvoiceLimit, factureController.createFacture);

// GET /api/factures/:id - Obtenir une facture
router.get('/:id', factureController.getFacture);

// PUT /api/factures/:id - Mettre à jour une facture
router.put('/:id', factureController.updateFacture);

// DELETE /api/factures/:id - Supprimer une facture
router.delete('/:id', factureController.deleteFacture);

// POST /api/factures/:id/envoyer - Envoyer une facture
router.post('/:id/envoyer', factureController.sendFacture);

// GET /api/factures/:id/pdf - Télécharger le PDF
router.get('/:id/pdf', exportRateLimiter, factureController.getFacturePdf);

// POST /api/factures/:id/payer - Enregistrer un paiement
router.post('/:id/payer', paymentRateLimiter, factureController.recordPayment);

// POST /api/factures/:id/annuler - Annuler une facture
router.post('/:id/annuler', factureController.cancelFacture);

export default router;
