// Routes Employé pour GuinéaManager

import { Router } from 'express';
import * as employeController from '../controllers/employe.controller';
import { authMiddleware, requireAccountant } from '../middlewares/auth';
import { createRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/employes - Lister les employés
router.get('/', employeController.listEmployes);

// GET /api/employes/actifs - Employés actifs
router.get('/actifs', employeController.getActiveEmployes);

// GET /api/employes/stats - Statistiques
router.get('/stats', employeController.getEmployeStats);

// POST /api/employes - Créer un employé
router.post('/', requireAccountant, createRateLimiter, employeController.createEmploye);

// GET /api/employes/:id - Obtenir un employé
router.get('/:id', employeController.getEmploye);

// PUT /api/employes/:id - Mettre à jour un employé
router.put('/:id', requireAccountant, employeController.updateEmploye);

// DELETE /api/employes/:id - Supprimer un employé
router.delete('/:id', requireAccountant, employeController.deleteEmploye);

export default router;
