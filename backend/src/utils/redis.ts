// Client Redis pour GuinéaManager (cache, sessions, rate limiting)

import Redis from 'ioredis';
import { config } from './config';
import logger from './logger';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      keepAlive: 10000,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis client error', error);
    });

    redisClient.on('close', () => {
      logger.warn('Redis client connection closed');
    });
  }

  return redisClient;
};

// Cache helper functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = getRedisClient();
      const data = await client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    try {
      const client = getRedisClient();
      const data = JSON.stringify(value);
      if (ttlSeconds) {
        await client.setex(key, ttlSeconds, data);
      } else {
        await client.set(key, data);
      }
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error });
      return false;
    }
  },

  async delete(key: string): Promise<boolean> {
    try {
      const client = getRedisClient();
      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error });
      return false;
    }
  },

  async deletePattern(pattern: string): Promise<number> {
    try {
      const client = getRedisClient();
      const keys = await client.keys(pattern);
      if (keys.length === 0) return 0;
      await client.del(...keys);
      return keys.length;
    } catch (error) {
      logger.error('Cache deletePattern error', { pattern, error });
      return 0;
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      const client = getRedisClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', { key, error });
      return false;
    }
  },

  async incr(key: string): Promise<number> {
    try {
      const client = getRedisClient();
      return await client.incr(key);
    } catch (error) {
      logger.error('Cache incr error', { key, error });
      return 0;
    }
  },

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const client = getRedisClient();
      const result = await client.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      logger.error('Cache expire error', { key, error });
      return false;
    }
  },
};

// Cache keys helpers
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  company: (companyId: string) => `company:${companyId}`,
  companyUsers: (companyId: string) => `company:${companyId}:users`,
  dashboard: (companyId: string) => `dashboard:${companyId}`,
  facture: (factureId: string) => `facture:${factureId}`,
  produit: (produitId: string) => `produit:${produitId}`,
  client: (clientId: string) => `client:${clientId}`,
  rateLimit: (ip: string) => `ratelimit:${ip}`,
  otp: (phone: string) => `otp:${phone}`,
  refreshToken: (token: string) => `refresh:${token}`,
  invoiceCount: (companyId: string, yearMonth: string) => `invoices:${companyId}:${yearMonth}`,
};

// Fermer la connexion proprement
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
};

export default getRedisClient;
