// Service SMS avec Africa's Talking pour GuinéaManager

import AfricasTalking from 'africastalking';
import { config, isFeatureEnabled } from './config';
import prisma from './prisma';
import { cache, cacheKeys } from './redis';
import logger from './logger';

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface AfricaTalkingResponse {
  SMSMessageData: {
    Message: string;
    Recipients: Array<{
      statusCode: number;
      number: string;
      status: string;
      cost: string;
      messageId: string;
    }>;
  };
}

// Initialiser Africa's Talking
let atClient: ReturnType<typeof AfricasTalking> | null = null;

const getAtClient = () => {
  if (!atClient && config.africastalkingApiKey) {
    atClient = AfricasTalking({
      apiKey: config.africastalkingApiKey,
      username: config.africastalkingUsername,
    });
  }
  return atClient;
};

// Normaliser le numéro de téléphone guinéen
export const normalizePhoneNumber = (phone: string): string => {
  // Supprimer les espaces et caractères non numériques
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Si commence par 0, remplacer par +224
  if (cleaned.startsWith('0')) {
    cleaned = '+224' + cleaned.substring(1);
  }

  // Si commence par 224 sans +, ajouter +
  if (cleaned.startsWith('224') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  // Si pas de +, ajouter +224
  if (!cleaned.startsWith('+')) {
    cleaned = '+224' + cleaned;
  }

  return cleaned;
};

// Envoyer un SMS
export const sendSms = async (
  to: string,
  message: string,
  options?: {
    companyId?: string;
    userId?: string;
    smsType?: string;
  }
): Promise<SmsResult> => {
  // Vérifier si le service est activé
  if (!isFeatureEnabled('sms')) {
    logger.warn('SMS feature is not enabled');
    return { success: false, error: 'SMS service not configured' };
  }

  const client = getAtClient();
  if (!client) {
    return { success: false, error: 'SMS client not initialized' };
  }

  const normalizedPhone = normalizePhoneNumber(to);

  try {
    const response: AfricaTalkingResponse = await client.SMS.send({
      to: [normalizedPhone],
      message,
      from: config.africastalkingSenderId,
    });

    const recipient = response.SMSMessageData.Recipients[0];

    if (recipient && recipient.statusCode === 101 || recipient.status === 'Success') {
      // Logger en DB
      await prisma.smsLog.create({
        data: {
          companyId: options?.companyId,
          userId: options?.userId,
          phone: normalizedPhone,
          message,
          messageId: recipient.messageId,
          status: 'SENT',
          smsType: options?.smsType || 'GENERAL',
        },
      });

      logger.info('SMS sent successfully', {
        phone: normalizedPhone,
        messageId: recipient.messageId,
        cost: recipient.cost,
      });

      return {
        success: true,
        messageId: recipient.messageId,
      };
    }

    throw new Error(`SMS failed with status: ${recipient?.status || 'unknown'}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Logger l'échec
    await prisma.smsLog.create({
      data: {
        companyId: options?.companyId,
        userId: options?.userId,
        phone: normalizedPhone,
        message,
        status: 'FAILED',
        errorMessage,
        smsType: options?.smsType || 'GENERAL',
      },
    });

    logger.error('SMS send failed', { phone: normalizedPhone, error: errorMessage });

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Générer un OTP
export const generateOtp = (length: number = config.otpLength): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

// Envoyer un OTP par SMS
export const sendOtpSms = async (
  phone: string,
  options?: { companyId?: string; userId?: string }
): Promise<{ success: boolean; otp?: string; error?: string }> => {
  const normalizedPhone = normalizePhoneNumber(phone);

  // Vérifier le rate limiting pour OTP
  const otpKey = `otp_limit:${normalizedPhone}`;
  const attempts = await cache.incr(otpKey);
  
  if (attempts === 1) {
    // Premier essai, définir l'expiration (5 minutes)
    await cache.expire(otpKey, 300);
  }
  
  if (attempts > 3) {
    return {
      success: false,
      error: 'Trop de tentatives. Veuillez réessayer dans 5 minutes.',
    };
  }

  // Générer l'OTP
  const otp = generateOtp();
  const otpCacheKey = cacheKeys.otp(normalizedPhone);

  // Stocker l'OTP dans le cache
  await cache.set(
    otpCacheKey,
    {
      otp,
      attempts: 0,
      createdAt: new Date().toISOString(),
    },
    config.otpExpiresInMinutes * 60
  );

  // Message SMS
  const message = `Votre code de verification Guineamanager est: ${otp}. Valide ${config.otpExpiresInMinutes} minutes. Ne le partagez avec personne.`;

  // Envoyer le SMS
  const result = await sendSms(normalizedPhone, message, {
    ...options,
    smsType: 'OTP',
  });

  if (result.success) {
    return { success: true, otp }; // En prod, on ne retourne pas l'OTP
  }

  return { success: false, error: result.error };
};

// Vérifier un OTP
export const verifyOtp = async (phone: string, code: string): Promise<{ valid: boolean; error?: string }> => {
  const normalizedPhone = normalizePhoneNumber(phone);
  const otpCacheKey = cacheKeys.otp(normalizedPhone);

  const storedData = await cache.get<{ otp: string; attempts: number }>(otpCacheKey);

  if (!storedData) {
    return { valid: false, error: 'Code expiré ou invalide' };
  }

  // Vérifier le nombre de tentatives
  if (storedData.attempts >= 3) {
    await cache.delete(otpCacheKey);
    return { valid: false, error: 'Trop de tentatives. Veuillez demander un nouveau code.' };
  }

  // Vérifier le code
  if (storedData.otp !== code) {
    // Incrémenter les tentatives
    await cache.set(
      otpCacheKey,
      { ...storedData, attempts: storedData.attempts + 1 },
      config.otpExpiresInMinutes * 60
    );
    return { valid: false, error: 'Code incorrect' };
  }

  // Code valide, supprimer du cache
  await cache.delete(otpCacheKey);

  return { valid: true };
};

// Envoyer une notification de facture
export const sendInvoiceSms = async (
  phone: string,
  invoiceNumber: string,
  amount: number,
  dueDate?: Date,
  options?: { companyId?: string }
): Promise<SmsResult> => {
  const amountFormatted = new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: 'GNF',
  }).format(amount);

  let message = `Facture ${invoiceNumber} - Montant: ${amountFormatted}`;
  
  if (dueDate) {
    const dueDateStr = new Date(dueDate).toLocaleDateString('fr-GN');
    message += ` - Echeance: ${dueDateStr}`;
  }

  return sendSms(phone, message, { ...options, smsType: 'FACTURE' });
};

// Envoyer un rappel de paiement
export const sendPaymentReminderSms = async (
  phone: string,
  invoiceNumber: string,
  amount: number,
  options?: { companyId?: string }
): Promise<SmsResult> => {
  const amountFormatted = new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: 'GNF',
  }).format(amount);

  const message = `RAPPEL: Facture ${invoiceNumber} en attente de paiement. Montant: ${amountFormatted}. Merci de regulariser.`;

  return sendSms(phone, message, { ...options, smsType: 'RAPPEL' });
};
