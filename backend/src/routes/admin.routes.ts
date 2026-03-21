// Routes Admin pour GuinéaManager

import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authMiddleware, requireOwner } from '../middlewares/auth';

const router = Router();

// Toutes les routes nécessitent une authentification et le rôle OWNER
router.use(authMiddleware);
router.use(requireOwner);

// GET /api/admin/stats - Statistiques globales
router.get('/stats', adminController.getStatsGlobales);

// GET /api/admin/subscriptions - Liste des souscriptions
router.get('/subscriptions', adminController.getSubscriptions);

// GET /api/admin/entreprises - Liste des entreprises
router.get('/entreprises', adminController.getEntreprises);

// GET /api/admin/audit-logs - Logs d'audit
router.get('/audit-logs', adminController.getAuditLogs);

// POST /api/admin/activer-plan/:companyId - Activer un plan
router.post('/activer-plan/:companyId', adminController.activerPlan);

// POST /api/admin/suspendre/:companyId - Suspendre une souscription
router.post('/suspendre/:companyId', adminController.suspendreSouscription);

export default router;
