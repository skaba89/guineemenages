// Client Redis pour GuinéaManager (cache, sessions, rate limiting)
// Redis est optionnel - si non configuré, les fonctions de cache ne font rien

import Redis from 'ioredis';
import { config } from './config';
import logger from './logger';

let redisClient: Redis | null = null;
let redisAvailable = false;

export const getRedisClient = (): Redis | null => {
  // Si Redis n'est pas configuré, retourner null
  if (!config.redisUrl) {
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(config.redisUrl || 'redis://localhost:6379', {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 10000,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      redisClient.on('connect', () => {
        redisAvailable = true;
        logger.info('Redis client connected');
      });

      redisClient.on('error', (error) => {
        redisAvailable = false;
        logger.warn('Redis client error (running without cache)', { error: error.message });
      });

      redisClient.on('close', () => {
        redisAvailable = false;
        logger.warn('Redis client connection closed');
      });
    } catch (error) {
      logger.warn('Redis initialization failed, running without cache');
      return null;
    }
  }

  return redisClient;
};

// Vérifier si Redis est disponible
export const isRedisAvailable = (): boolean => {
  return redisAvailable && !!config.redisUrl;
};

// Cache helper functions - gracefull degradation si Redis non disponible
export const cache = {
  async get<T>(_key: string): Promise<T | null> {
    if (!isRedisAvailable()) return null;
    try {
      const client = getRedisClient();
      if (!client) return null;
      const data = await client.get(_key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Cache get error', { key: _key, error });
      return null;
    }
  },

  async set(_key: string, _value: unknown, _ttlSeconds?: number): Promise<boolean> {
    if (!isRedisAvailable()) return false;
    try {
      const client = getRedisClient();
      if (!client) return false;
      const data = JSON.stringify(_value);
      if (_ttlSeconds) {
        await client.setex(_key, _ttlSeconds, data);
      } else {
        await client.set(_key, data);
      }
      return true;
    } catch (error) {
      logger.error('Cache set error', { key: _key, error });
      return false;
    }
  },

  async delete(_key: string): Promise<boolean> {
    if (!isRedisAvailable()) return false;
    try {
      const client = getRedisClient();
      if (!client) return false;
      await client.del(_key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key: _key, error });
      return false;
    }
  },

  async deletePattern(_pattern: string): Promise<number> {
    if (!isRedisAvailable()) return 0;
    try {
      const client = getRedisClient();
      if (!client) return 0;
      const keys = await client.keys(_pattern);
      if (keys.length === 0) return 0;
      await client.del(...keys);
      return keys.length;
    } catch (error) {
      logger.error('Cache deletePattern error', { pattern: _pattern, error });
      return 0;
    }
  },

  async exists(_key: string): Promise<boolean> {
    if (!isRedisAvailable()) return false;
    try {
      const client = getRedisClient();
      if (!client) return false;
      const result = await client.exists(_key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', { key: _key, error });
      return false;
    }
  },

  async incr(_key: string): Promise<number> {
    if (!isRedisAvailable()) return 0;
    try {
      const client = getRedisClient();
      if (!client) return 0;
      return await client.incr(_key);
    } catch (error) {
      logger.error('Cache incr error', { key: _key, error });
      return 0;
    }
  },

  async expire(_key: string, _ttlSeconds: number): Promise<boolean> {
    if (!isRedisAvailable()) return false;
    try {
      const client = getRedisClient();
      if (!client) return false;
      const result = await client.expire(_key, _ttlSeconds);
      return result === 1;
    } catch (error) {
      logger.error('Cache expire error', { key: _key, error });
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
    redisAvailable = false;
    logger.info('Redis connection closed');
  }
};

export default getRedisClient;
