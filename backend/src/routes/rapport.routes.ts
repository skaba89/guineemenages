// Routes Rapports pour GuinéaManager

import { Router } from 'express';
import * as rapportController from '../controllers/rapport.controller';
import { authMiddleware, requireAccountant } from '../middlewares/auth';
import { requireFeature } from '../middlewares/plan';
import { exportRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/rapports/ca-mensuel - CA mensuel
router.get('/ca-mensuel', rapportController.getCaMensuel);

// GET /api/rapports/top-clients - Top clients
router.get('/top-clients', rapportController.getTopClients);

// GET /api/rapports/bilan-simplifie - Bilan simplifié
router.get('/bilan-simplifie', requireAccountant, rapportController.getBilanSimplifie);

// GET /api/rapports/impayes - Rapport des impayés
router.get('/impayes', rapportController.getRapportImpayes);

// GET /api/rapports/export - Export des données
router.get('/export', requireFeature('export'), exportRateLimiter, rapportController.exportDonnees);

export default router;
