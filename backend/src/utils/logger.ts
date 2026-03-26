// Simple console logger for GuinéaManager
// No winston - just console output to avoid Docker permission issues

interface LogMeta {
  [key: string]: unknown;
}

const formatTimestamp = (): string => {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
};

const formatMessage = (level: string, message: string, meta?: LogMeta): string => {
  const timestamp = formatTimestamp();
  let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    // Convert Error objects to strings
    const sanitizedMeta: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(meta)) {
      if (value instanceof Error) {
        sanitizedMeta[key] = {
          message: value.message,
          stack: value.stack,
        };
      } else {
        sanitizedMeta[key] = value;
      }
    }
    log += ` ${JSON.stringify(sanitizedMeta)}`;
  }
  return log;
};

interface Logger {
  info: (message: string, meta?: LogMeta | unknown) => void;
  error: (message: string, meta?: LogMeta | unknown) => void;
  warn: (message: string, meta?: LogMeta | unknown) => void;
  debug: (message: string, meta?: LogMeta | unknown) => void;
  http: (message: string, meta?: LogMeta | unknown) => void;
}

const logger: Logger = {
  info: (message: string, meta?: LogMeta | unknown): void => {
    console.log(formatMessage('info', message, meta instanceof Error ? { error: meta.message } : meta as LogMeta | undefined));
  },
  
  error: (message: string, meta?: LogMeta | unknown): void => {
    const errorMeta = meta instanceof Error 
      ? { error: meta.message, stack: meta.stack } 
      : meta as LogMeta | undefined;
    console.error(formatMessage('error', message, errorMeta));
  },
  
  warn: (message: string, meta?: LogMeta | unknown): void => {
    console.warn(formatMessage('warn', message, meta instanceof Error ? { error: meta.message } : meta as LogMeta | undefined));
  },
  
  debug: (message: string, meta?: LogMeta | unknown): void => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(formatMessage('debug', message, meta instanceof Error ? { error: meta.message } : meta as LogMeta | undefined));
    }
  },

  http: (message: string, meta?: LogMeta | unknown): void => {
    console.log(formatMessage('http', message, meta instanceof Error ? { error: meta.message } : meta as LogMeta | undefined));
  },
};

export default logger;

export const logWithContext = (context: string) => ({
  info: (msg: string, meta?: LogMeta | unknown) => logger.info(`[${context}] ${msg}`, meta),
  error: (msg: string, err?: unknown, meta?: LogMeta | unknown) => {
    const m = err instanceof Error ? { ...(meta as LogMeta), error: err.message, stack: err.stack } : meta;
    logger.error(`[${context}] ${msg}`, m);
  },
  warn: (msg: string, meta?: LogMeta | unknown) => logger.warn(`[${context}] ${msg}`, meta),
  debug: (msg: string, meta?: LogMeta | unknown) => logger.debug(`[${context}] ${msg}`, meta),
  http: (msg: string, meta?: LogMeta | unknown) => logger.http(`[${context}] ${msg}`, meta),
});
