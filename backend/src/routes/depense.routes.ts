// Routes Dépense pour GuinéaManager

import { Router } from 'express';
import * as depenseController from '../controllers/depense.controller';
import { authMiddleware, requireAccountant } from '../middlewares/auth';
import { createRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/depenses - Lister les dépenses
router.get('/', depenseController.listDepenses);

// GET /api/depenses/stats/categorie - Stats par catégorie
router.get('/stats/categorie', depenseController.getStatsParCategorie);

// GET /api/depenses/stats/mensuelles - Stats mensuelles
router.get('/stats/mensuelles', depenseController.getStatsMensuelles);

// GET /api/depenses/stats/total - Total des dépenses
router.get('/stats/total', depenseController.getTotalDepenses);

// POST /api/depenses - Créer une dépense
router.post('/', requireAccountant, createRateLimiter, depenseController.createDepense);

// GET /api/depenses/:id - Obtenir une dépense
router.get('/:id', depenseController.getDepense);

// PUT /api/depenses/:id - Mettre à jour une dépense
router.put('/:id', requireAccountant, depenseController.updateDepense);

// DELETE /api/depenses/:id - Supprimer une dépense
router.delete('/:id', requireAccountant, depenseController.deleteDepense);

export default router;
