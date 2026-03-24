// Configuration GuinéaManager

import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Schema de validation de la configuration
const configSchema = z.object({
  // Server
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  port: z.coerce.number().default(3001),
  apiUrl: z.string().default('http://localhost:3001'),
  
  // Database
  databaseUrl: z.string().default('file:./dev.db'),
  
  // Redis (optional - used for caching and sessions)
  redisUrl: z.string().optional(),
  
  // JWT - Secret with default for production
  jwtSecret: z.string().default('guineamanager-production-jwt-secret-key-2024-secure'),
  jwtExpiresIn: z.string().default('15m'),
  jwtRefreshExpiresIn: z.string().default('7d'),
  
  // Africa's Talking
  africastalkingApiKey: z.string().optional(),
  africastalkingUsername: z.string().default('sandbox'),
  africastalkingSenderId: z.string().default('GuineaManager'),
  
  // Orange Money
  orangeMoneyApiUrl: z.string().optional(),
  orangeMoneyClientId: z.string().optional(),
  orangeMoneyClientSecret: z.string().optional(),
  orangeMoneyMerchantCode: z.string().optional(),
  orangeMoneyWebhookSecret: z.string().optional(),
  
  // Resend Email
  resendApiKey: z.string().optional(),
  emailFrom: z.string().default('noreply@guineamanager.com'),
  
  // Supabase
  supabaseUrl: z.string().optional(),
  supabaseAnonKey: z.string().optional(),
  supabaseServiceKey: z.string().optional(),
  
  // App
  appName: z.string().default('GuinéaManager'),
  appUrl: z.string().default('http://localhost:3000'),
  supportEmail: z.string().default('support@guineamanager.com'),
  supportPhone: z.string().default('+224 000 00 00 00'),
  
  // Rate Limiting
  rateLimitWindowMs: z.coerce.number().default(60000),
  rateLimitMaxRequests: z.coerce.number().default(100),
  
  // Logging
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // OTP
  otpLength: z.coerce.number().default(6),
  otpExpiresInMinutes: z.coerce.number().default(5),
  
  // Security
  bcryptSaltRounds: z.coerce.number().default(12),
});

// Parse et valider la configuration
const parseConfig = () => {
  const rawConfig = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    apiUrl: process.env.API_URL,
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    africastalkingApiKey: process.env.AFRICASTALKING_API_KEY,
    africastalkingUsername: process.env.AFRICASTALKING_USERNAME,
    africastalkingSenderId: process.env.AFRICASTALKING_SENDER_ID,
    orangeMoneyApiUrl: process.env.ORANGE_MONEY_API_URL,
    orangeMoneyClientId: process.env.ORANGE_MONEY_CLIENT_ID,
    orangeMoneyClientSecret: process.env.ORANGE_MONEY_CLIENT_SECRET,
    orangeMoneyMerchantCode: process.env.ORANGE_MONEY_MERCHANT_CODE,
    orangeMoneyWebhookSecret: process.env.ORANGE_MONEY_WEBHOOK_SECRET,
    resendApiKey: process.env.RESEND_API_KEY,
    emailFrom: process.env.EMAIL_FROM,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    appName: process.env.APP_NAME,
    appUrl: process.env.APP_URL,
    supportEmail: process.env.SUPPORT_EMAIL,
    supportPhone: process.env.SUPPORT_PHONE,
    rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
    logLevel: process.env.LOG_LEVEL,
    otpLength: process.env.OTP_LENGTH,
    otpExpiresInMinutes: process.env.OTP_EXPIRES_IN_MINUTES,
    bcryptSaltRounds: process.env.BCRYPT_SALT_ROUNDS,
  };

  return configSchema.parse(rawConfig);
};

export const config = parseConfig();

// Type export
export type Config = z.infer<typeof configSchema>;

// Helper pour vérifier si une fonctionnalité est activée
export const isFeatureEnabled = (feature: 'sms' | 'email' | 'orangeMoney' | 'storage'): boolean => {
  switch (feature) {
    case 'sms':
      return !!config.africastalkingApiKey;
    case 'email':
      return !!config.resendApiKey;
    case 'orangeMoney':
      return !!config.orangeMoneyClientId && !!config.orangeMoneyClientSecret;
    case 'storage':
      return !!config.supabaseUrl && !!config.supabaseServiceKey;
    default:
      return false;
  }
};
