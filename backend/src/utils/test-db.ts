/**
 * @fileoverview Utilitaire de base de données pour les tests
 * 
 * Ce module exporte une instance PrismaClient pour les tests,
 * sans démarrer le serveur Express.
 */

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
