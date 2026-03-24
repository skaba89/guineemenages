// Routes Client pour GuinéaManager

import { Router } from 'express';
import * as clientController from '../controllers/client.controller';
import { authMiddleware } from '../middlewares/auth';
import { createRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/clients - Lister les clients
router.get('/', clientController.listClients);

// GET /api/clients/balance - Clients avec solde dû
router.get('/balance', clientController.getClientsWithBalance);

// POST /api/clients - Créer un client
router.post('/', createRateLimiter, clientController.createClient);

// GET /api/clients/:id - Obtenir un client
router.get('/:id', clientController.getClient);

// PUT /api/clients/:id - Mettre à jour un client
router.put('/:id', clientController.updateClient);

// DELETE /api/clients/:id - Supprimer un client
router.delete('/:id', clientController.deleteClient);

// GET /api/clients/:id/factures - Factures d'un client
router.get('/:id/factures', clientController.getClientInvoices);

export default router;
