// Logger Winston pour GuinéaManager

import winston from 'winston';
import { config } from './config';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Format personnalisé pour la console
const consoleFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    log += ` ${JSON.stringify(metadata)}`;
  }
  
  if (stack) {
    log += `\n${stack}`;
  }
  
  return log;
});

// Création du logger
const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: { service: 'guineamanager-api' },
  transports: [
    // Fichier pour les erreurs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Fichier pour tous les logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// En développement, ajouter la console
if (config.nodeEnv !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), consoleFormat),
    })
  );
}

// Helper pour les logs avec contexte
export const logWithContext = (context: string) => ({
  info: (message: string, meta?: Record<string, unknown>) => 
    logger.info(`[${context}] ${message}`, meta),
  error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
    const errorMeta = error instanceof Error 
      ? { ...meta, stack: error.stack, errorMessage: error.message }
      : { ...meta, error };
    logger.error(`[${context}] ${message}`, errorMeta);
  },
  warn: (message: string, meta?: Record<string, unknown>) => 
    logger.warn(`[${context}] ${message}`, meta),
  debug: (message: string, meta?: Record<string, unknown>) => 
    logger.debug(`[${context}] ${message}`, meta),
});

export default logger;
