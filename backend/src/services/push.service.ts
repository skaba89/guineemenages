// Push Notification Service for GuinéaManager ERP
// Uses Web Push API with VAPID for browser push notifications

import prisma from '../utils/prisma';
import logger from '../utils/logger';

// Types
interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: {
    url?: string;
    actionType?: string;
    actionId?: string;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

interface ScheduledNotification {
  userId: string;
  type: 'DAILY_SUMMARY' | 'PAYMENT_REMINDER' | 'STOCK_ALERT' | 'INVOICE_REMINDER' | 'SUBSCRIPTION_EXPIRING';
  scheduledAt: Date;
  payload: PushNotificationPayload;
}

// VAPID Configuration
let webpush: any = null;
let vapidConfigured = false;

function initWebPush(): void {
  if (vapidConfigured) return;

  try {
    // Check for VAPID keys
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      logger.warn('VAPID keys not configured. Push notifications will be disabled.');
      logger.info('Generate VAPID keys with: npx web-push generate-vapid-keys');
      return;
    }

    webpush = require('web-push');
    webpush.setVapidDetails(
      'mailto:support@guineamanager.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    vapidConfigured = true;
    logger.info('Web Push configured successfully');
  } catch (error) {
    logger.error('Failed to configure Web Push:', error);
  }
}

// Initialize on module load
initWebPush();

// ============================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================

/**
 * Subscribe a user to push notifications
 */
export async function subscribeUser(
  userId: string,
  subscription: PushSubscription,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if subscription already exists
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint },
    });

    if (existing) {
      // Update if belongs to current user
      if (existing.userId === userId) {
        await prisma.pushSubscription.update({
          where: { id: existing.id },
          data: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            userAgent,
            actif: true,
          },
        });
      }
      return { success: true };
    }

    // Create new subscription
    await prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
        actif: true,
      },
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to subscribe user:', error);
    return { success: false, error: 'Erreur lors de l\'abonnement' };
  }
}

/**
 * Unsubscribe a user from push notifications
 */
export async function unsubscribeUser(
  userId: string,
  endpoint?: string
): Promise<{ success: boolean }> {
  try {
    const where: any = { userId };

    if (endpoint) {
      where.endpoint = endpoint;
    }

    await prisma.pushSubscription.deleteMany({ where });

    return { success: true };
  } catch (error) {
    logger.error('Failed to unsubscribe user:', error);
    return { success: false };
  }
}

/**
 * Get all active subscriptions for a user
 */
export async function getUserSubscriptions(userId: string): Promise<any[]> {
  return prisma.pushSubscription.findMany({
    where: {
      userId,
      actif: true,
    },
  });
}

// ============================================================
// PUSH NOTIFICATION SENDING
// ============================================================

/**
 * Send a push notification to a specific user
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; sent: number; failed: number }> {
  if (!vapidConfigured) {
    logger.warn('Push notifications not configured');
    return { success: false, sent: 0, failed: 0 };
  }

  try {
    const subscriptions = await getUserSubscriptions(userId);

    if (subscriptions.length === 0) {
      return { success: true, sent: 0, failed: 0 };
    }

    const pushPayload = JSON.stringify({
      ...payload,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/badge-72x72.png',
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          pushPayload
        );
        sent++;
      } catch (error: any) {
        failed++;

        // Remove invalid subscription (410 Gone)
        if (error.statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { id: sub.id },
          });
        }
      }
    }

    return { success: true, sent, failed };
  } catch (error) {
    logger.error('Failed to send push notification:', error);
    return { success: false, sent: 0, failed: 0 };
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<{ success: boolean; totalSent: number; totalFailed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushToUser(userId, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { success: true, totalSent, totalFailed };
}

// ============================================================
// SCHEDULED NOTIFICATIONS
// ============================================================

/**
 * Create a scheduled notification
 */
export async function scheduleNotification(
  data: ScheduledNotification
): Promise<{ success: boolean; id?: string }> {
  try {
    // Store in audit log as a scheduled task
    const log = await prisma.auditLog.create({
      data: {
        action: 'SCHEDULED_NOTIFICATION',
        table: 'Notification',
        userId: data.userId,
        details: JSON.stringify({
          type: data.type,
          scheduledAt: data.scheduledAt,
          payload: data.payload,
        }),
      },
    });

    return { success: true, id: log.id };
  } catch (error) {
    logger.error('Failed to schedule notification:', error);
    return { success: false };
  }
}

/**
 * Process scheduled notifications
 * This should be called by a cron job
 */
export async function processScheduledNotifications(): Promise<void> {
  if (!vapidConfigured) return;

  try {
    // Get scheduled notifications that are due
    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'SCHEDULED_NOTIFICATION',
        createdAt: { lte: new Date() },
      },
      take: 100,
    });

    for (const log of logs) {
      const details = JSON.parse(log.details || '{}');

      if (details.payload) {
        await sendPushToUser(log.userId!, details.payload);
      }

      // Mark as processed by deleting
      await prisma.auditLog.delete({ where: { id: log.id } });
    }
  } catch (error) {
    logger.error('Failed to process scheduled notifications:', error);
  }
}

// ============================================================
// NOTIFICATION TEMPLATES
// ============================================================

/**
 * Generate daily summary notification
 */
export async function generateDailySummary(
  userId: string,
  companyId: string
): Promise<PushNotificationPayload | null> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get stats
    const [newInvoices, paymentsReceived, overdueInvoices, lowStockProducts] = await Promise.all([
      prisma.facture.count({
        where: {
          companyId,
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.paiement.count({
        where: {
          facture: { companyId },
          date: { gte: today, lt: tomorrow },
        },
      }),
      prisma.facture.count({
        where: {
          companyId,
          statut: 'EN_RETARD',
        },
      }),
      prisma.produit.count({
        where: {
          companyId,
          type: 'PRODUIT',
          stockMin: { gt: 0 },
          stockActuel: { lte: prisma.produit.fields.stockMin },
        },
      }),
    ]);

    const messages: string[] = [];

    if (newInvoices > 0) {
      messages.push(`${newInvoices} nouvelles factures`);
    }
    if (paymentsReceived > 0) {
      messages.push(`${paymentsReceived} paiements reçus`);
    }
    if (overdueInvoices > 0) {
      messages.push(`${overdueInvoices} factures en retard`);
    }
    if (lowStockProducts > 0) {
      messages.push(`${lowStockProducts} produits en stock bas`);
    }

    if (messages.length === 0) {
      return null;
    }

    return {
      title: 'Résumé quotidien',
      body: messages.join(', '),
      tag: 'daily-summary',
      data: {
        url: '/dashboard',
        actionType: 'SUMMARY',
      },
    };
  } catch (error) {
    logger.error('Failed to generate daily summary:', error);
    return null;
  }
}

/**
 * Generate payment reminder notification
 */
export function generatePaymentReminder(
  invoiceNumber: string,
  clientName: string,
  amount: string,
  dueDate: string
): PushNotificationPayload {
  return {
    title: 'Rappel de paiement',
    body: `Facture ${invoiceNumber} de ${amount} pour ${clientName} - Échéance: ${dueDate}`,
    tag: `payment-reminder-${invoiceNumber}`,
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'Voir la facture' },
      { action: 'dismiss', title: 'Ignorer' },
    ],
    data: {
      url: `/factures/${invoiceNumber}`,
      actionType: 'FACTURE',
    },
  };
}

/**
 * Generate stock alert notification
 */
export function generateStockAlert(
  productName: string,
  currentStock: number,
  minStock: number
): PushNotificationPayload {
  const isOutOfStock = currentStock === 0;

  return {
    title: isOutOfStock ? 'Rupture de stock' : 'Alerte stock bas',
    body: `"${productName}" - Stock: ${currentStock} (minimum: ${minStock})`,
    tag: `stock-alert-${productName}`,
    requireInteraction: true,
    data: {
      url: '/produits',
      actionType: 'STOCK',
    },
  };
}

/**
 * Generate invoice overdue notification
 */
export function generateInvoiceOverdue(
  invoiceNumber: string,
  clientName: string,
  amount: string,
  daysLate: number
): PushNotificationPayload {
  return {
    title: 'Facture en retard',
    body: `${invoiceNumber} - ${clientName}: ${amount} (${daysLate} jour(s) de retard)`,
    tag: `invoice-overdue-${invoiceNumber}`,
    requireInteraction: true,
    actions: [
      { action: 'remind', title: 'Envoyer un rappel' },
      { action: 'view', title: 'Voir' },
    ],
    data: {
      url: `/factures/${invoiceNumber}`,
      actionType: 'FACTURE',
    },
  };
}

/**
 * Generate subscription expiring notification
 */
export function generateSubscriptionExpiring(
  planName: string,
  daysRemaining: number,
  endDate: string
): PushNotificationPayload {
  return {
    title: 'Abonnement expire bientôt',
    body: `Votre abonnement ${planName} expire dans ${daysRemaining} jour(s) (${endDate})`,
    tag: 'subscription-expiring',
    requireInteraction: true,
    actions: [
      { action: 'renew', title: 'Renouveler' },
      { action: 'dismiss', title: 'Plus tard' },
    ],
    data: {
      url: '/parametres?tab=abonnement',
      actionType: 'SUBSCRIPTION',
    },
  };
}

// ============================================================
// SMS TEMPLATE HELPERS
// ============================================================

/**
 * SMS Templates for different events
 */
export const smsTemplates = {
  invoiceCreated: (data: { invoiceNumber: string; amount: string; clientName: string }) =>
    `GuineaManager: Facture ${data.invoiceNumber} de ${data.amount} créée pour ${data.clientName}`,

  invoicePaid: (data: { invoiceNumber: string; amount: string }) =>
    `GuineaManager: Paiement de ${data.amount} reçu pour la facture ${data.invoiceNumber}`,

  invoiceReminder: (data: { invoiceNumber: string; amount: string; dueDate: string }) =>
    `Rappel: Facture ${data.invoiceNumber} de ${data.amount} - Échéance: ${data.dueDate}. Merci de régulariser.`,

  invoiceOverdue: (data: { invoiceNumber: string; amount: string; daysLate: number }) =>
    `URGENT: Facture ${data.invoiceNumber} de ${data.amount} en retard de ${data.daysLate} jour(s). Merci de régulariser.`,

  stockAlert: (data: { productName: string; currentStock: number }) =>
    `Alerte stock: ${data.productName} - ${data.currentStock} restant(s)`,

  payrollReady: (data: { month: string; amount: string }) =>
    `GuineaManager: Paie ${data.month} prête. Total: ${data.amount}`,

  subscriptionExpiring: (data: { planName: string; daysRemaining: number }) =>
    `GuineaManager: Votre abonnement ${data.planName} expire dans ${data.daysRemaining} jour(s)`,

  verificationCode: (code: string) =>
    `GuineaManager: Votre code de vérification est ${code}. Valide 5 minutes.`,

  passwordReset: (code: string) =>
    `GuineaManager: Code de réinitialisation: ${code}. Valide 10 minutes.`,
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Generate VAPID keys (run once to generate)
 */
export function generateVapidKeys(): { publicKey: string; privateKey: string } | null {
  try {
    if (!webpush) {
      const webPushModule = require('web-push');
      return webPushModule.generateVAPIDKeys();
    }
    return webpush.generateVAPIDKeys();
  } catch (error) {
    logger.error('Failed to generate VAPID keys:', error);
    return null;
  }
}

/**
 * Get VAPID public key
 */
export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}

/**
 * Check if push notifications are configured
 */
export function isPushConfigured(): boolean {
  return vapidConfigured;
}

export default {
  subscribeUser,
  unsubscribeUser,
  getUserSubscriptions,
  sendPushToUser,
  sendPushToUsers,
  scheduleNotification,
  processScheduledNotifications,
  generateDailySummary,
  generatePaymentReminder,
  generateStockAlert,
  generateInvoiceOverdue,
  generateSubscriptionExpiring,
  smsTemplates,
  generateVapidKeys,
  getVapidPublicKey,
  isPushConfigured,
};
