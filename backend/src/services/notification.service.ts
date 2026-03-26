// Notification Service for GuinéaManager ERP
// Handles Email, SMS, Push, and In-App notifications

import prisma from '../utils/prisma';
import { sendInvoiceEmail, sendPayslipEmail, sendPaymentReminderEmail, send2FACodeEmail, sendSubscriptionEmail, sendWelcomeEmail } from '../utils/email';
import { createNotification } from '../routes/notifications.routes';

// Types
type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

interface NotificationPayload {
  userId: string;
  titre: string;
  message: string;
  type: NotificationType;
  channels?: NotificationChannel[];
  actionUrl?: string;
  actionType?: string;
  actionId?: string;
  emailData?: {
    to: string;
    template: string;
    data: any;
  };
  smsData?: {
    telephone: string;
    message: string;
  };
}

// ============================================================
// SMS SERVICE
// ============================================================

/**
 * Send SMS via configured gateway
 * Supports: Twilio, Orange SMS API, Local gateways
 */
async function sendSMS(telephone: string, message: string): Promise<{ success: boolean; error?: string }> {
  // Normalize phone number
  let phone = telephone.replace(/\D/g, '');
  if (!phone.startsWith('224') && phone.length === 9) {
    phone = `224${phone}`; // Guinea
  } else if (!phone.startsWith('221') && phone.length === 9) {
    phone = `221${phone}`; // Senegal
  } else if (!phone.startsWith('225') && phone.length === 10) {
    phone = `225${phone}`; // Ivory Coast
  }

  // Log SMS attempt
  const smsLog = await prisma.smsLog.create({
    data: {
      telephone: phone,
      message,
      statut: 'EN_ATTENTE',
    },
  });

  try {
    // Check if Twilio is configured
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      await twilio.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+${phone}`,
      });

      await prisma.smsLog.update({
        where: { id: smsLog.id },
        data: { statut: 'ENVOYE' },
      });

      return { success: true };
    }

    // Check if Orange SMS API is configured (for Guinea, Senegal, Ivory Coast)
    if (process.env.ORANGE_SMS_API_KEY && process.env.ORANGE_SMS_SECRET) {
      const response = await fetch('https://api.orange.com/smsmessaging/v1/outbound/tel%3A%2B' + process.env.ORANGE_SENDER_ID + '/requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getOrangeSMSAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outboundSMSMessageRequest: {
            address: `tel:+${phone}`,
            senderAddress: `tel:+${process.env.ORANGE_SENDER_ID}`,
            outboundSMSTextMessage: {
              message,
            },
          },
        }),
      });

      if (response.ok) {
        await prisma.smsLog.update({
          where: { id: smsLog.id },
          data: { statut: 'ENVOYE' },
        });
        return { success: true };
      }

      throw new Error('Orange SMS API failed');
    }

    // Check if local gateway is configured (for local SMS providers)
    if (process.env.LOCAL_SMS_API_URL) {
      const response = await fetch(process.env.LOCAL_SMS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOCAL_SMS_API_KEY}`,
        },
        body: JSON.stringify({
          to: phone,
          message,
          from: 'GuineaManager',
        }),
      });

      if (response.ok) {
        await prisma.smsLog.update({
          where: { id: smsLog.id },
          data: { statut: 'ENVOYE' },
        });
        return { success: true };
      }

      throw new Error('Local SMS API failed');
    }

    // No SMS gateway configured - log as failed
    await prisma.smsLog.update({
      where: { id: smsLog.id },
      data: {
        statut: 'ECHEC',
        erreur: 'Aucune passerelle SMS configurée',
      },
    });

    return { success: false, error: 'Aucune passerelle SMS configurée' };
  } catch (error: any) {
    await prisma.smsLog.update({
      where: { id: smsLog.id },
      data: {
        statut: 'ECHEC',
        erreur: error.message,
      },
    });

    return { success: false, error: error.message };
  }
}

/**
 * Get Orange SMS API access token
 */
async function getOrangeSMSAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.ORANGE_SMS_API_KEY}:${process.env.ORANGE_SMS_SECRET}`
  ).toString('base64');

  const response = await fetch('https://api.orange.com/oauth/v3/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

// ============================================================
// NOTIFICATION HELPER FUNCTIONS
// ============================================================

/**
 * Send notification through multiple channels
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const { channels = ['in_app', 'push'] } = payload;

  // Always create in-app notification
  if (channels.includes('in_app')) {
    await createNotification({
      userId: payload.userId,
      titre: payload.titre,
      message: payload.message,
      type: payload.type,
      actionUrl: payload.actionUrl,
      actionType: payload.actionType,
      actionId: payload.actionId,
    });
  }

  // Send push notification (handled by createNotification)
  // Push is sent automatically when creating notification

  // Send email if data provided
  if (channels.includes('email') && payload.emailData) {
    try {
      const { to, template, data } = payload.emailData;
      // Email sending is handled by specific email functions
    } catch (error) {
      console.error('Email notification error:', error);
    }
  }

  // Send SMS if data provided
  if (channels.includes('sms') && payload.smsData) {
    await sendSMS(payload.smsData.telephone, payload.smsData.message);
  }
}

// ============================================================
// NOTIFICATION TEMPLATES
// ============================================================

/**
 * Notify about new invoice
 */
export async function notifyInvoiceCreated(
  userId: string,
  invoiceData: {
    numero: string;
    clientNom: string;
    montant: string;
    echeance: string;
    clientEmail?: string;
  }
): Promise<void> {
  await sendNotification({
    userId,
    titre: 'Nouvelle facture créée',
    message: `Facture ${invoiceData.numero} créée pour ${invoiceData.clientNom} - ${invoiceData.montant}`,
    type: 'SUCCESS',
    channels: ['in_app', 'push'],
    actionUrl: `/factures/${invoiceData.numero}`,
    actionType: 'FACTURE',
  });
}

/**
 * Notify about invoice payment
 */
export async function notifyInvoicePaid(
  userId: string,
  invoiceData: {
    numero: string;
    clientNom: string;
    montant: string;
  }
): Promise<void> {
  await sendNotification({
    userId,
    titre: 'Paiement reçu',
    message: `Paiement de ${invoiceData.montant} reçu pour la facture ${invoiceData.numero}`,
    type: 'SUCCESS',
    channels: ['in_app', 'push', 'email'],
    actionUrl: `/factures/${invoiceData.numero}`,
    actionType: 'FACTURE',
  });
}

/**
 * Notify about overdue invoice
 */
export async function notifyInvoiceOverdue(
  userId: string,
  invoiceData: {
    numero: string;
    clientNom: string;
    montant: string;
    joursRetard: number;
    clientEmail?: string;
    clientTelephone?: string;
  }
): Promise<void> {
  await sendNotification({
    userId,
    titre: 'Facture en retard',
    message: `La facture ${invoiceData.numero} est en retard de ${invoiceData.joursRetard} jour(s)`,
    type: 'WARNING',
    channels: ['in_app', 'push'],
    actionUrl: `/factures/${invoiceData.numero}`,
    actionType: 'FACTURE',
  });

  // Send SMS notification for overdue invoices
  if (invoiceData.clientTelephone) {
    await sendSMS(
      invoiceData.clientTelephone,
      `Rappel: Facture ${invoiceData.numero} de ${invoiceData.montant} en retard. Merci de régulariser.`
    );
  }
}

/**
 * Notify about low stock
 */
export async function notifyLowStock(
  userId: string,
  productData: {
    nom: string;
    stockActuel: number;
    stockMin: number;
  }
): Promise<void> {
  await sendNotification({
    userId,
    titre: 'Alerte stock bas',
    message: `Le stock de "${productData.nom}" est bas (${productData.stockActuel} restants, minimum: ${productData.stockMin})`,
    type: 'WARNING',
    channels: ['in_app', 'push'],
    actionUrl: `/produits`,
    actionType: 'STOCK',
  });
}

/**
 * Notify about payroll ready
 */
export async function notifyPayrollReady(
  userId: string,
  payrollData: {
    mois: string;
    nbEmployes: number;
    montantTotal: string;
  }
): Promise<void> {
  await sendNotification({
    userId,
    titre: 'Paie prête',
    message: `La paie de ${payrollData.mois} est prête pour ${payrollData.nbEmployes} employé(s) - Total: ${payrollData.montantTotal}`,
    type: 'INFO',
    channels: ['in_app', 'push', 'email'],
    actionUrl: `/paie`,
    actionType: 'PAIE',
  });
}

/**
 * Notify about subscription expiring
 */
export async function notifySubscriptionExpiring(
  userId: string,
  subscriptionData: {
    planNom: string;
    dateFin: string;
    joursRestants: number;
  }
): Promise<void> {
  await sendNotification({
    userId,
    titre: 'Abonnement expire bientôt',
    message: `Votre abonnement ${subscriptionData.planNom} expire dans ${subscriptionData.joursRestants} jour(s) (${subscriptionData.dateFin})`,
    type: 'WARNING',
    channels: ['in_app', 'push', 'email'],
    actionUrl: `/parametres?tab=plan`,
    actionType: 'SUBSCRIPTION',
  });
}

/**
 * Notify about new employee
 */
export async function notifyEmployeeHired(
  userId: string,
  employeeData: {
    nom: string;
    prenom: string;
    poste: string;
  }
): Promise<void> {
  await sendNotification({
    userId,
    titre: 'Nouvel employé',
    message: `${employeeData.prenom} ${employeeData.nom} a été ajouté comme ${employeeData.poste}`,
    type: 'SUCCESS',
    channels: ['in_app', 'push'],
    actionUrl: `/employes`,
    actionType: 'EMPLOYE',
  });
}

/**
 * Notify about Mobile Money payment received
 */
export async function notifyMobileMoneyReceived(
  userId: string,
  paymentData: {
    montant: string;
    methode: 'ORANGE_MONEY' | 'MTN_MONEY';
    reference: string;
  }
): Promise<void> {
  await sendNotification({
    userId,
    titre: 'Paiement Mobile Money reçu',
    message: `${paymentData.montant} reçu via ${paymentData.methode.replace('_', ' ')} - Ref: ${paymentData.reference}`,
    type: 'SUCCESS',
    channels: ['in_app', 'push'],
    actionType: 'PAIEMENT',
  });
}

/**
 * Daily summary notification
 */
export async function sendDailySummary(
  userId: string,
  summaryData: {
    newInvoices: number;
    paymentsReceived: number;
    overdueInvoices: number;
    lowStockProducts: number;
  }
): Promise<void> {
  const messages: string[] = [];

  if (summaryData.newInvoices > 0) {
    messages.push(`${summaryData.newInvoices} nouvelles factures`);
  }
  if (summaryData.paymentsReceived > 0) {
    messages.push(`${summaryData.paymentsReceived} paiements reçus`);
  }
  if (summaryData.overdueInvoices > 0) {
    messages.push(`${summaryData.overdueInvoices} factures en retard`);
  }
  if (summaryData.lowStockProducts > 0) {
    messages.push(`${summaryData.lowStockProducts} produits en stock bas`);
  }

  if (messages.length === 0) {
    return; // No summary to send
  }

  await sendNotification({
    userId,
    titre: 'Résumé quotidien',
    message: messages.join(', '),
    type: 'INFO',
    channels: ['in_app', 'push'],
    actionType: 'SUMMARY',
  });
}

export { sendSMS };
export default {
  sendNotification,
  notifyInvoiceCreated,
  notifyInvoicePaid,
  notifyInvoiceOverdue,
  notifyLowStock,
  notifyPayrollReady,
  notifySubscriptionExpiring,
  notifyEmployeeHired,
  notifyMobileMoneyReceived,
  sendDailySummary,
  sendSMS,
};
