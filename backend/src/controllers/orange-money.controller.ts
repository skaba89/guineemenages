// Contrôleur Orange Money pour GuinéaManager

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import * as orangeMoneyService from '../services/orange-money.service';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';
import logger from '../utils/logger';

// Schémas de validation
const initierPaiementSchema = z.object({
  amount: z.number().int().positive('Le montant doit être positif'),
  customerPhone: z.string().min(8, 'Numéro de téléphone inval'),
  customerName: z.string().optional(),
  factureId: z.string().optional(),
  description: z.string().optional(),
});

const configurerCompteSchema = z.object({
  apiKey: z.string().min(1, 'API Key requise'),
  apiSecret: z.string().min(1, 'API Secret requis'),
  merchantCode: z.string().min(1, 'Code marchand requis'),
});

// Initier un paiement
export const initierPaiement = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validated = initierPaiementSchema.parse(req.body);
    const { companyId } = req as AuthenticatedRequest;

    // Générer un ID de commande unique
    const orderId = `GM-${companyId.substring(0, 8)}-${Date.now()}`;

    // Stocker les metadata
    const metadata = validated.factureId ? { factureId: validated.factureId } : null;

    const result = await orangeMoneyService.initierPaiement(companyId, {
      amount: validated.amount,
      orderId,
      customerPhone: validated.customerPhone,
      customerName: validated.customerName,
      description: validated.description,
    });

    // Sauvegarder les metadata
    if (metadata) {
      const tx = await prisma.orangeMoneyTransaction.findFirst({
        where: { orderId },
      });
      if (tx) {
        await prisma.orangeMoneyTransaction.update({
          where: { id: tx.id },
          data: { metadata: JSON.stringify(metadata) },
        });
      }
    }

    res.status(201).json({
      success: true,
      data: result,
    });
  }
);

// Callback Orange Money (webhook)
export const handleCallback = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const data = req.body;

    logger.info('Orange Money callback received', { data });

    // Vérifier la signature si nécessaire
    // const signature = req.headers['x-orange-signature'];

    const result = await orangeMoneyService.traiterCallback(data);

    // Toujours répondre 200 à Orange Money
    res.status(200).json({
      status: 'OK',
      ...result,
    });
  }
);

// Vérifier le statut d'une transaction
export const verifierStatut = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { transactionId } = req.params;

    const transaction = await orangeMoneyService.verifierStatut(transactionId);

    res.json({
      success: true,
      data: transaction,
    });
  }
);

// Lister les transactions
export const listTransactions = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { status, limit, offset } = req.query;

    const transactions = await orangeMoneyService.listTransactions(companyId, {
      status: status as string,
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json({
      success: true,
      data: transactions,
    });
  }
);

// Configurer le compte Orange Money
export const configurerCompte = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validated = configurerCompteSchema.parse(req.body);
    const { companyId } = req as AuthenticatedRequest;

    const compte = await orangeMoneyService.configurerCompte(companyId, validated);

    res.json({
      success: true,
      data: {
        id: compte.id,
        merchantCode: compte.merchantCode,
        isActive: compte.isActive,
      },
    });
  }
);

import prisma from '../utils/prisma';

export default {
  initierPaiement,
  handleCallback,
  verifierStatut,
  listTransactions,
  configurerCompte,
};
