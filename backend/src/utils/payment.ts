import crypto from 'crypto';
import { prisma } from '../index';

// ============================================================
// TYPES
// ============================================================

interface PaymentRequest {
  amount: number; // In centimes
  currency: string;
  phoneNumber?: string;
  email?: string;
  description: string;
  metadata?: Record<string, any>;
}

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  reference?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  message?: string;
  redirectUrl?: string;
}

interface PaymentVerification {
  success: boolean;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  amount?: number;
  transactionId?: string;
}

// ============================================================
// ORANGE MONEY API
// ============================================================

class OrangeMoneyService {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private merchantCode: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.baseUrl = process.env.ORANGE_MONEY_API_URL || 'https://api.orange.com/orange-money-webpay/dev/v1';
    this.clientId = process.env.ORANGE_MONEY_CLIENT_ID || '';
    this.clientSecret = process.env.ORANGE_MONEY_CLIENT_SECRET || '';
    this.merchantCode = process.env.ORANGE_MONEY_MERCHANT_CODE || '';
  }

  // Get OAuth token
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      });

      const data = await response.json() as { access_token: string; expires_in: number };
      
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Orange Money OAuth error:', error);
      throw new Error('Failed to authenticate with Orange Money');
    }
  }

  // Initiate payment
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!request.phoneNumber) {
      return { success: false, status: 'FAILED', message: 'Phone number is required for Orange Money' };
    }

    try {
      const token = await this.getAccessToken();
      const orderId = `GM${Date.now()}${Math.random().toString(36).substring(7)}`;
      
      const response = await fetch(`${this.baseUrl}/webpayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          merchant_code: this.merchantCode,
          currency: request.currency === 'GNF' ? 'GNF' : 'XOF',
          order_id: orderId,
          amount: Math.ceil(request.amount / 100), // Convert from centimes
          return_url: `${process.env.FRONTEND_URL}/payment/callback`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
          notif_url: `${process.env.API_URL}/api/payments/webhook/orange-money`,
          lang: 'fr',
          reference: request.description,
          customer_msisdn: request.phoneNumber.replace('+', ''),
        }),
      });

      const data = await response.json() as { 
        transaction_id?: string;
        payment_url?: string;
        message?: string;
        status?: string;
      };

      if (response.ok && data.transaction_id) {
        return {
          success: true,
          transactionId: data.transaction_id,
          reference: orderId,
          status: 'PENDING',
          redirectUrl: data.payment_url,
        };
      }

      return {
        success: false,
        status: 'FAILED',
        message: data.message || 'Payment initiation failed',
      };
    } catch (error: any) {
      console.error('Orange Money payment error:', error);
      return { success: false, status: 'FAILED', message: error.message };
    }
  }

  // Verify payment status
  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/transaction/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json() as {
        status: string;
        amount?: number;
        transaction_id?: string;
      };

      const statusMap: Record<string, 'PENDING' | 'SUCCESS' | 'FAILED'> = {
        'PENDING': 'PENDING',
        'SUCCESS': 'SUCCESS',
        'FAILED': 'FAILED',
        'EXPIRED': 'FAILED',
        'CANCELLED': 'FAILED',
      };

      return {
        success: data.status === 'SUCCESS',
        status: statusMap[data.status] || 'PENDING',
        amount: data.amount ? data.amount * 100 : undefined, // Convert to centimes
        transactionId: data.transaction_id,
      };
    } catch (error) {
      console.error('Orange Money verification error:', error);
      return { success: false, status: 'FAILED' };
    }
  }
}

// ============================================================
// MTN MOBILE MONEY API
// ============================================================

class MTNMoneyService {
  private baseUrl: string;
  private subscriptionKey: string;
  private apiKey: string;
  private userId: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.baseUrl = process.env.MTN_MONEY_API_URL || 'https://ericssonbasicapi2.azure-api.net/collection';
    this.subscriptionKey = process.env.MTN_MONEY_SUBSCRIPTION_KEY || '';
    this.apiKey = process.env.MTN_MONEY_API_KEY || '';
    this.userId = process.env.MTN_MONEY_USER_ID || '';
  }

  // Get access token
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${this.baseUrl}/token/`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Authorization': `Basic ${this.apiKey}`,
        },
      });

      const data = await response.json() as { access_token: string; expires_in: number };
      
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('MTN Money OAuth error:', error);
      throw new Error('Failed to authenticate with MTN Money');
    }
  }

  // Request payment (Collection)
  async requestPayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!request.phoneNumber) {
      return { success: false, status: 'FAILED', message: 'Phone number is required for MTN Money' };
    }

    try {
      const token = await this.getAccessToken();
      const referenceId = crypto.randomUUID();
      
      const response = await fetch(`${this.baseUrl}/v1_0/requesttopay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Authorization': `Bearer ${token}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': process.env.MTN_MONEY_ENVIRONMENT || 'sandbox',
        },
        body: JSON.stringify({
          amount: Math.ceil(request.amount / 100).toString(),
          currency: request.currency === 'GNF' ? 'GNF' : 'XOF',
          externalId: `GM${Date.now()}`,
          payer: {
            partyIdType: 'MSISDN',
            partyId: request.phoneNumber.replace('+', ''),
          },
          payerMessage: request.description,
          payeeNote: request.description,
        }),
      });

      if (response.status === 202) {
        return {
          success: true,
          transactionId: referenceId,
          reference: referenceId,
          status: 'PENDING',
        };
      }

      const error = await response.json() as { message?: string };
      return {
        success: false,
        status: 'FAILED',
        message: error.message || 'Payment request failed',
      };
    } catch (error: any) {
      console.error('MTN Money payment error:', error);
      return { success: false, status: 'FAILED', message: error.message };
    }
  }

  // Check payment status
  async checkPaymentStatus(referenceId: string): Promise<PaymentVerification> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/v1_0/requesttopay/${referenceId}`, {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': process.env.MTN_MONEY_ENVIRONMENT || 'sandbox',
        },
      });

      const data = await response.json() as {
        status: string;
        amount?: string;
        financialTransactionId?: string;
      };

      const statusMap: Record<string, 'PENDING' | 'SUCCESS' | 'FAILED'> = {
        'PENDING': 'PENDING',
        'SUCCESSFUL': 'SUCCESS',
        'FAILED': 'FAILED',
        'REJECTED': 'FAILED',
        'TIMEOUT': 'FAILED',
      };

      return {
        success: data.status === 'SUCCESSFUL',
        status: statusMap[data.status] || 'PENDING',
        amount: data.amount ? parseInt(data.amount) * 100 : undefined,
        transactionId: data.financialTransactionId,
      };
    } catch (error) {
      console.error('MTN Money status check error:', error);
      return { success: false, status: 'FAILED' };
    }
  }
}

// ============================================================
// STRIPE (CARD PAYMENT)
// ============================================================

class StripeService {
  private apiKey: string;
  private webhookSecret: string;

  constructor() {
    this.apiKey = process.env.STRIPE_SECRET_KEY || '';
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  async createPaymentIntent(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: new URLSearchParams({
          amount: request.amount.toString(),
          currency: request.currency.toLowerCase() === 'gnf' ? 'gnf' : 
                    request.currency.toLowerCase() === 'xof' ? 'xof' : 'eur',
          description: request.description,
          'metadata[orderId]': request.metadata?.orderId || '',
          'metadata[userId]': request.metadata?.userId || '',
        }).toString(),
      });

      const data = await response.json() as {
        id?: string;
        client_secret?: string;
        status?: string;
        error?: { message: string };
      };

      if (response.ok && data.id) {
        return {
          success: true,
          transactionId: data.id,
          reference: data.id,
          status: 'PENDING',
        };
      }

      return {
        success: false,
        status: 'FAILED',
        message: data.error?.message || 'Payment creation failed',
      };
    } catch (error: any) {
      console.error('Stripe payment error:', error);
      return { success: false, status: 'FAILED', message: error.message };
    }
  }

  async verifyPayment(paymentIntentId: string): Promise<PaymentVerification> {
    try {
      const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const data = await response.json() as {
        status: string;
        amount: number;
        id: string;
      };

      const statusMap: Record<string, 'PENDING' | 'SUCCESS' | 'FAILED'> = {
        'requires_payment_method': 'PENDING',
        'requires_confirmation': 'PENDING',
        'requires_action': 'PENDING',
        'processing': 'PENDING',
        'succeeded': 'SUCCESS',
        'canceled': 'FAILED',
        'failed': 'FAILED',
      };

      return {
        success: data.status === 'succeeded',
        status: statusMap[data.status] || 'PENDING',
        amount: data.amount,
        transactionId: data.id,
      };
    } catch (error) {
      console.error('Stripe verification error:', error);
      return { success: false, status: 'FAILED' };
    }
  }
}

// ============================================================
// PAYMENT SERVICE FACTORY
// ============================================================

export class PaymentService {
  private orangeMoney: OrangeMoneyService;
  private mtnMoney: MTNMoneyService;
  private stripe: StripeService;

  constructor() {
    this.orangeMoney = new OrangeMoneyService();
    this.mtnMoney = new MTNMoneyService();
    this.stripe = new StripeService();
  }

  // Initiate payment based on method
  async initiatePayment(method: 'ORANGE_MONEY' | 'MTN_MONEY' | 'CARTE', request: PaymentRequest): Promise<PaymentResponse> {
    switch (method) {
      case 'ORANGE_MONEY':
        return this.orangeMoney.initiatePayment(request);
      case 'MTN_MONEY':
        return this.mtnMoney.requestPayment(request);
      case 'CARTE':
        return this.stripe.createPaymentIntent(request);
      default:
        return { success: false, status: 'FAILED', message: 'Unsupported payment method' };
    }
  }

  // Verify payment
  async verifyPayment(method: 'ORANGE_MONEY' | 'MTN_MONEY' | 'CARTE', transactionId: string): Promise<PaymentVerification> {
    switch (method) {
      case 'ORANGE_MONEY':
        return this.orangeMoney.verifyPayment(transactionId);
      case 'MTN_MONEY':
        return this.mtnMoney.checkPaymentStatus(transactionId);
      case 'CARTE':
        return this.stripe.verifyPayment(transactionId);
      default:
        return { success: false, status: 'FAILED' };
    }
  }

  // Record payment in database
  async recordPayment(data: {
    companyId: string;
    montant: number;
    devise: string;
    methode: string;
    reference: string;
    transactionId: string;
    planId: string;
    planNom: string;
    duree: string;
    statut: string;
  }): Promise<any> {
    return prisma.paiementAbonnement.create({
      data: {
        companyId: data.companyId,
        montant: data.montant,
        devise: data.devise,
        methode: data.methode,
        reference: data.reference,
        planId: data.planId,
        planNom: data.planNom,
        duree: data.duree,
        statut: data.statut,
        traiteAt: data.statut === 'REUSSI' ? new Date() : null,
      },
    });
  }

  // Update payment status
  async updatePaymentStatus(paymentId: string, status: string, details?: any): Promise<any> {
    return prisma.paiementAbonnement.update({
      where: { id: paymentId },
      data: {
        statut: status,
        traiteAt: status === 'REUSSI' ? new Date() : null,
        detailsReponse: details ? JSON.stringify(details) : null,
      },
    });
  }

  // Get payment history
  async getPaymentHistory(companyId: string): Promise<any[]> {
    return prisma.paiementAbonnement.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

export const paymentService = new PaymentService();
export default paymentService;
