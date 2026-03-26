// Setup pour les tests GuinéaManager

import { beforeAll, afterAll } from 'vitest';
import prisma from '../src/utils/prisma';

// Configuration globale pour les tests
beforeAll(async () => {
  // Vérifier la connexion à la base de données de test
  try {
    await prisma.$connect();
    console.log('✅ Connexion à la base de données de test établie');
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    throw error;
  }
});

afterAll(async () => {
  // Fermer les connexions
  await prisma.$disconnect();
  console.log('🔌 Connexion à la base de données fermée');
});

// Variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only-32chars';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
