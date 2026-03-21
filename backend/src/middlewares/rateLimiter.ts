// Middleware de rate limiting pour GuinéaManager

import rateLimit from 'express-rate-limit';
import { config } from '../utils/config';
import logger from '../utils/logger';

// Rate limiter global - 100 requêtes par minute par IP
export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // 1 minute par défaut
  max: config.rateLimitMaxRequests, // 100 requêtes par défaut
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Trop de requêtes. Veuillez réessayer dans quelques instants.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json(options.message);
  },
  keyGenerator: (req) => {
    // Utiliser l'IP ou l'ID utilisateur si authentifié
    const userId = (req as any).userId;
    return userId ? `user_${userId}` : req.ip || 'unknown';
  },
});

// Rate limiter pour les tentatives de connexion - 5 tentatives par 15 minutes
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_LOGIN_ATTEMPTS',
      message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne pas compter les connexions réussies
  keyGenerator: (req) => {
    // Limiter par email + IP
    const email = req.body?.email || 'unknown';
    return `login_${email}_${req.ip}`;
  },
});

// Rate limiter pour l'envoi d'OTP - 3 par 5 minutes
export const otpRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_OTP_REQUESTS',
      message: 'Trop de demandes de code OTP. Réessayez dans 5 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const phone = req.body?.phone || 'unknown';
    return `otp_${phone}`;
  },
});

// Rate limiter pour la création de ressources - 30 par minute
export const createRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    error: {
      code: 'CREATE_RATE_LIMIT',
      message: 'Trop de créations en peu de temps. Ralentissez.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const companyId = (req as any).companyId || 'anonymous';
    return `create_${companyId}_${req.ip}`;
  },
});

// Rate limiter pour l'API publique (webhooks, callbacks) - 1000 par minute
export const publicApiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: {
    success: false,
    error: {
      code: 'PUBLIC_RATE_LIMIT',
      message: 'Rate limit exceeded',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter pour les exports PDF - 20 par minute
export const exportRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: {
      code: 'EXPORT_RATE_LIMIT',
      message: 'Trop de demandes d\'export. Réessayez dans un instant.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as any).userId || 'anonymous';
    return `export_${userId}`;
  },
});

// Rate limiter pour les opérations de paiement - 10 par minute
export const paymentRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'PAYMENT_RATE_LIMIT',
      message: 'Trop de tentatives de paiement. Réessayez dans un instant.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const companyId = (req as any).companyId || 'anonymous';
    return `payment_${companyId}`;
  },
});

export default globalRateLimiter;
