// Prisma Client singleton pour GuinéaManager

import { PrismaClient } from '@prisma/client';
import logger from './logger';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Logging des requêtes en développement
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: { query: string; duration: number }) => {
    logger.debug('Prisma Query', {
      query: e.query,
      duration: `${e.duration}ms`,
    });
  });
}

prisma.$on('error', (e: { message: string }) => {
  logger.error('Prisma Error', { message: e.message });
});

prisma.$on('warn', (e: { message: string }) => {
  logger.warn('Prisma Warning', { message: e.message });
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Fermer la connexion proprement
export const closePrisma = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('Prisma connection closed');
};

// Helper pour les transactions
export const transaction = async <T>(
  fn: (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>
): Promise<T> => {
  return prisma.$transaction(fn);
};

// Helper pour vérifier la connexion
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database connection check failed', error);
    return false;
  }
};

export default prisma;
