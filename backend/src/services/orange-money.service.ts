// Service Orange Money pour GuinéaManager

import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { cache } from '../utils/redis';
import { config, isFeatureEnabled } from '../utils/config';
import logger from '../utils/logger';
import { NotFoundError, ConflictError, ValidationError } from '../middlewares/errorHandler';

// Types
interface OrangeMoneyPaymentRequest {
  amount: number;
  orderId: string;
  customerPhone: string;
  customerName?: string;
  description?: string;
}

interface OrangeMoneyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface OrangeMoneyPaymentResponse {
  order_id: string;
  txid?: string;
  notif_token?: string;
  status: string;
  message?: string;
}

// Obtenir un token d'accès Orange Money
const getAccessToken = async (): Promise<string> => {
  if (!isFeatureEnabled('orangeMoney')) {
    throw new ValidationError('Service Orange Money non configuré');
  }

  const cacheKey = 'orange_money:access_token';
  const cached = await cache.get<string>(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const credentials = Buffer.from(
      `${config.orangeMoneyClientId}:${config.orangeMoneyClientSecret}`
    ).toString('base64');

    const response = await fetch('https://api.orange.com/oauth/v3/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data = (await response.json()) as OrangeMoneyTokenResponse;
    
    // Cache le token avec une marge de sécurité
    const expiresIn = Math.max(data.expires_in - 60, 60);
    await cache.set(cacheKey, data.access_token, expiresIn);

    return data.access_token;
  } catch (error) {
    logger.error('Orange Money token fetch failed', error);
    throw new Error('Impossible d\'obtenir le token Orange Money');
  }
};

// Initier un paiement Orange Money
export const initierPaiement = async (
  companyId: string,
  data: OrangeMoneyPaymentRequest
) => {
  if (!isFeatureEnabled('orangeMoney')) {
    throw new ValidationError('Service Orange Money non configuré');
  }

  // Vérifier que le compte Orange Money existe
  const account = await prisma.orangeMoneyAccount.findFirst({
    where: { companyId, isActive: true },
  });

  if (!account) {
    throw new NotFoundError('Compte Orange Money');
  }

  // Normaliser le numéro de téléphone
  const phone = data.customerPhone.replace(/\D/g, '');
  const formattedPhone = phone.startsWith('224') ? phone : `224${phone}`;

  // Créer la transaction en DB
  const transaction = await prisma.orangeMoneyTransaction.create({
    data: {
      companyId,
      orderId: data.orderId,
      amount: data.amount,
      currency: 'GNF',
      customerPhone: formattedPhone,
      customerName: data.customerName,
      status: 'PENDING',
    },
  });

  try {
    const token = await getAccessToken();

    // Appel à l'API Orange Money Webpay
    const response = await fetch(`${config.orangeMoneyApiUrl}/webpayment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant_key: account.merchantCode,
        currency: 'GNF',
        order_id: data.orderId,
        amount: data.amount,
        ref: `GM-${Date.now()}`,
        customer_msisdn: formattedPhone,
        customer_name: data.customerName || 'Client',
        description: data.description || 'Paiement GuinéaManager',
        return_url: `${config.appUrl}/payment/callback`,
        cancel_url: `${config.appUrl}/payment/cancel`,
        notif_url: `${config.apiUrl}/api/paiements-mobile/orange-money/callback`,
        lang: 'fr',
      }),
    });

    const result = (await response.json()) as OrangeMoneyPaymentResponse;

    if (!response.ok || result.status === 'error') {
      // Mettre à jour le statut
      await prisma.orangeMoneyTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          errorMessage: result.message || 'Payment initiation failed',
        },
      });

      throw new Error(result.message || 'Erreur lors de l\'initiation du paiement');
    }

    // Mettre à jour avec l'ID de transaction Orange
    await prisma.orangeMoneyTransaction.update({
      where: { id: transaction.id },
      data: {
        orangeTxId: result.txid,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      },
    });

    return {
      orderId: data.orderId,
      txId: result.txid,
      notifToken: result.notif_token,
      status: 'PENDING',
      message: 'Paiement initié. Veuillez confirmer sur votre téléphone.',
    };
  } catch (error) {
    logger.error('Orange Money payment initiation failed', error);
    
    await prisma.orangeMoneyTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  }
};

// Traiter le callback Orange Money
export const traiterCallback = async (data: {
  status: string;
  order_id: string;
  txid?: string;
  notif_token?: string;
}) => {
  const transaction = await prisma.orangeMoneyTransaction.findFirst({
    where: { orderId: data.order_id },
  });

  if (!transaction) {
    logger.warn('Orange Money callback for unknown transaction', { orderId: data.order_id });
    return { success: false, message: 'Transaction non trouvée' };
  }

  const newStatus = data.status === 'SUCCESS' ? 'SUCCESS' : 
                    data.status === 'FAILED' ? 'FAILED' : 
                    data.status === 'CANCELLED' ? 'CANCELLED' : 'FAILED';

  await prisma.orangeMoneyTransaction.update({
    where: { id: transaction.id },
    data: {
      status: newStatus,
      orangeTxId: data.txid || transaction.orangeTxId,
      completedAt: newStatus === 'SUCCESS' ? new Date() : undefined,
    },
  });

  // Si succès, créer le paiement dans le système
  if (newStatus === 'SUCCESS') {
    // Trouver la facture associée si metadata contient l'info
    const metadata = transaction.metadata ? JSON.parse(transaction.metadata) : null;
    
    if (metadata?.factureId) {
      // Enregistrer le paiement
      await prisma.paiement.create({
        data: {
          factureId: metadata.factureId,
          montant: transaction.amount,
          mode: 'ORANGE_MONEY',
          reference: data.txid,
          referenceMobile: transaction.customerPhone,
          orangeTransactionId: transaction.id,
        },
      });

      // Mettre à jour la facture
      const facture = await prisma.facture.findUnique({
        where: { id: metadata.factureId },
      });

      if (facture) {
        const nouveauMontantPaye = facture.montantPaye + transaction.amount;
        let nouveauStatut = facture.statut;

        if (nouveauMontantPaye >= facture.totalTtc) {
          nouveauStatut = 'PAYEE';
        } else {
          nouveauStatut = 'PARTIELLEMENT_PAYEE';
        }

        await prisma.facture.update({
          where: { id: metadata.factureId },
          data: {
            montantPaye: nouveauMontantPaye,
            statut: nouveauStatut,
          },
        });
      }
    }
  }

  logger.info('Orange Money callback processed', {
    orderId: data.order_id,
    status: newStatus,
  });

  return { success: true, status: newStatus };
};

// Vérifier le statut d'une transaction
export const verifierStatut = async (transactionId: string) => {
  const transaction = await prisma.orangeMoneyTransaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    throw new NotFoundError('Transaction');
  }

  // Si déjà terminée, retourner le statut
  if (['SUCCESS', 'FAILED', 'CANCELLED'].includes(transaction.status)) {
    return transaction;
  }

  // Sinon, interroger l'API Orange
  try {
    const token = await getAccessToken();

    const response = await fetch(
      `${config.orangeMoneyApiUrl}/transaction/${transaction.orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const result = await response.json();
      
      const newStatus = result.status === 'SUCCESS' ? 'SUCCESS' : 
                        result.status === 'FAILED' ? 'FAILED' : 
                        result.status === 'CANCELLED' ? 'CANCELLED' : 
                        transaction.status;

      if (newStatus !== transaction.status) {
        await traiterCallback({
          status: result.status,
          order_id: transaction.orderId,
          txid: result.txid,
        });
      }

      return prisma.orangeMoneyTransaction.findUnique({
        where: { id: transactionId },
      });
    }
  } catch (error) {
    logger.error('Orange Money status check failed', error);
  }

  return transaction;
};

// Lister les transactions
export const listTransactions = async (
  companyId: string,
  options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }
) => {
  const { status, limit = 20, offset = 0 } = options || {};

  return prisma.orangeMoneyTransaction.findMany({
    where: {
      companyId,
      ...(status && { status: status as any }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
};

// Créer/Mettre à jour un compte Orange Money
export const configurerCompte = async (
  companyId: string,
  data: {
    apiKey: string;
    apiSecret: string;
    merchantCode: string;
  }
) => {
  const existing = await prisma.orangeMoneyAccount.findFirst({
    where: { companyId },
  });

  if (existing) {
    return prisma.orangeMoneyAccount.update({
      where: { id: existing.id },
      data: {
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        merchantCode: data.merchantCode,
      },
    });
  }

  return prisma.orangeMoneyAccount.create({
    data: {
      companyId,
      apiKey: data.apiKey,
      apiSecret: data.apiSecret,
      merchantCode: data.merchantCode,
    },
  });
};

export default {
  initierPaiement,
  traiterCallback,
  verifierStatut,
  listTransactions,
  configurerCompte,
};
