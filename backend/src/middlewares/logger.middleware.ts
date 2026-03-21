/**
 * @fileoverview Middleware de logging pour GuinéaManager ERP
 * 
 * Ce module fournit un système de logging structuré pour suivre
 * les requêtes API, les erreurs et les événements importants.
 * 
 * @module logger
 * @author GuinéaManager Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';

// ============================================================================
// TYPES
// ============================================================================

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  userId?: string;
  companyId?: string;
  ip?: string;
  userAgent?: string;
  message?: string;
  error?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const currentLevel = process.env.LOG_LEVEL || 'INFO';

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Formate un log en JSON
 */
function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * Affiche un log dans la console
 */
function log(entry: LogEntry): void {
  const levelValue = LOG_LEVELS[entry.level];
  const currentValue = LOG_LEVELS[currentLevel as keyof typeof LOG_LEVELS] || 1;

  if (levelValue >= currentValue) {
    const formatted = formatLog(entry);
    
    switch (entry.level) {
      case 'ERROR':
        console.error('\x1b[31m%s\x1b[0m', formatted);
        break;
      case 'WARN':
        console.warn('\x1b[33m%s\x1b[0m', formatted);
        break;
      case 'INFO':
        console.info('\x1b[36m%s\x1b[0m', formatted);
        break;
      default:
        console.log(formatted);
    }
  }
}

// ============================================================================
// MIDDLEWARES
// ============================================================================

/**
 * Middleware de logging des requêtes HTTP
 * 
 * Enregistre automatiquement chaque requête avec :
 * - Méthode HTTP et chemin
 * - Code de statut de la réponse
 * - Durée de traitement
 * - Informations utilisateur (si authentifié)
 * - IP et User-Agent
 * 
 * @function requestLogger
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Capturer la fin de la réponse
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 400 ? 'WARN' : 'INFO',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      companyId: req.user?.companyId,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')?.substring(0, 100)
    };

    log(entry);
  });

  next();
};

/**
 * Middleware de logging des erreurs
 * 
 * Capture et log les erreurs non gérées avec
 * le contexte de la requête.
 * 
 * @function errorLogger
 */
export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    method: req.method,
    path: req.path,
    statusCode: err.status || 500,
    userId: req.user?.id,
    companyId: req.user?.companyId,
    ip: req.ip || req.socket.remoteAddress,
    message: err.message,
    error: err.stack
  };

  log(entry);

  next(err);
};

// ============================================================================
// FONCTIONS DE LOGGING
// ============================================================================

/**
 * Log un message de niveau INFO
 * 
 * @param message - Message à logger
 * @param data - Données additionnelles
 */
export function logInfo(message: string, data?: Record<string, any>): void {
  log({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    method: '',
    path: '',
    message,
    ...data
  });
}

/**
 * Log un message de niveau WARN
 * 
 * @param message - Message à logger
 * @param data - Données additionnelles
 */
export function logWarn(message: string, data?: Record<string, any>): void {
  log({
    timestamp: new Date().toISOString(),
    level: 'WARN',
    method: '',
    path: '',
    message,
    ...data
  });
}

/**
 * Log un message de niveau ERROR
 * 
 * @param message - Message à logger
 * @param error - Erreur à logger
 * @param data - Données additionnelles
 */
export function logError(message: string, error?: Error, data?: Record<string, any>): void {
  log({
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    method: '',
    path: '',
    message,
    error: error?.stack || error?.message,
    ...data
  });
}

/**
 * Log un message de niveau DEBUG
 * 
 * @param message - Message à logger
 * @param data - Données additionnelles
 */
export function logDebug(message: string, data?: Record<string, any>): void {
  log({
    timestamp: new Date().toISOString(),
    level: 'DEBUG',
    method: '',
    path: '',
    message,
    ...data
  });
}

// ============================================================================
// LOGS SPÉCIFIQUES
// ============================================================================

/**
 * Log une action métier
 * 
 * @param action - Nom de l'action (ex: 'CREATE_INVOICE')
 * @param userId - ID de l'utilisateur
 * @param companyId - ID de l'entreprise
 * @param details - Détails de l'action
 */
export function logAction(
  action: string,
  userId: string,
  companyId: string,
  details?: Record<string, any>
): void {
  logInfo(`Action: ${action}`, {
    userId,
    companyId,
    action,
    ...details
  });
}

/**
 * Log un événement de sécurité
 * 
 * @param event - Type d'événement (ex: 'LOGIN_FAILED', 'UNAUTHORIZED_ACCESS')
 * @param userId - ID de l'utilisateur (optionnel)
 * @param ip - Adresse IP
 * @param details - Détails de l'événement
 */
export function logSecurity(
  event: string,
  userId?: string,
  ip?: string,
  details?: Record<string, any>
): void {
  logWarn(`Security: ${event}`, {
    userId,
    ip,
    event,
    ...details
  });
}

/**
 * Log une opération de base de données
 * 
 * @param operation - Type d'opération (ex: 'INSERT', 'UPDATE', 'DELETE')
 * @param table - Nom de la table
 * @param recordId - ID de l'enregistrement
 * @param userId - ID de l'utilisateur
 */
export function logDatabase(
  operation: string,
  table: string,
  recordId?: string,
  userId?: string
): void {
  logDebug(`DB: ${operation} on ${table}`, {
    operation,
    table,
    recordId,
    userId
  });
}
