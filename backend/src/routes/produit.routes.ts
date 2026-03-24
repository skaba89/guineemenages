// Routes Produit pour GuinéaManager

import { Router } from 'express';
import * as produitController from '../controllers/produit.controller';
import { authMiddleware } from '../middlewares/auth';
import { createRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/produits - Lister les produits
router.get('/', produitController.listProduits);

// GET /api/produits/search - Rechercher des produits
router.get('/search', produitController.searchProduits);

// GET /api/produits/stock-alerte - Produits en alerte de stock
router.get('/stock-alerte', produitController.getStockAlert);

// GET /api/produits/stock-stats - Statistiques de stock
router.get('/stock-stats', produitController.getStockStats);

// POST /api/produits - Créer un produit
router.post('/', createRateLimiter, produitController.createProduit);

// GET /api/produits/:id - Obtenir un produit
router.get('/:id', produitController.getProduit);

// PUT /api/produits/:id - Mettre à jour un produit
router.put('/:id', produitController.updateProduit);

// DELETE /api/produits/:id - Supprimer un produit
router.delete('/:id', produitController.deleteProduit);

// PATCH /api/produits/:id/stock - Mettre à jour le stock
router.patch('/:id/stock', produitController.updateStock);

export default router;
