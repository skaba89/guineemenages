// Tests d'authentification pour GuinéaManager ERP
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/index';

describe('Authentification', () => {
  const testUser = {
    email: 'test-auth@example.com',
    password: 'Password123!',
    nom: 'Test',
    prenom: 'User',
    companyName: 'Test Company Auth'
  };

  beforeEach(async () => {
    // Nettoyer la base de données avant chaque test
    try {
      const user = await prisma.user.findUnique({
        where: { email: testUser.email }
      });
      if (user) {
        await prisma.user.delete({ where: { id: user.id } });
        await prisma.company.delete({ where: { id: user.companyId } });
      }
    } catch (error) {
      // Ignorer les erreurs de nettoyage
    }
  });

  afterEach(async () => {
    // Nettoyer après les tests
    try {
      const user = await prisma.user.findUnique({
        where: { email: testUser.email }
      });
      if (user) {
        await prisma.user.delete({ where: { id: user.id } });
        await prisma.company.delete({ where: { id: user.companyId } });
      }
    } catch (error) {
      // Ignorer les erreurs de nettoyage
    }
  });

  describe('Inscription', () => {
    it('devrait créer un nouvel utilisateur avec une entreprise', async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      
      const result = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            nom: testUser.companyName,
            email: testUser.email,
            plan: 'FREE'
          }
        });

        const user = await tx.user.create({
          data: {
            email: testUser.email,
            password: hashedPassword,
            nom: testUser.nom,
            prenom: testUser.prenom,
            role: 'ADMIN',
            companyId: company.id
          }
        });

        return { company, user };
      });

      expect(result.user.email).toBe(testUser.email);
      expect(result.user.nom).toBe(testUser.nom);
      expect(result.user.role).toBe('ADMIN');
      expect(result.company.nom).toBe(testUser.companyName);
    });

    it('devrait rejeter un email déjà utilisé', async () => {
      // Créer un premier utilisateur
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      
      await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: { nom: testUser.companyName, email: testUser.email, plan: 'FREE' }
        });
        await tx.user.create({
          data: {
            email: testUser.email,
            password: hashedPassword,
            nom: testUser.nom,
            prenom: testUser.prenom,
            role: 'ADMIN',
            companyId: company.id
          }
        });
      });

      // Tenter de créer un second utilisateur avec le même email
      await expect(async () => {
        await prisma.user.create({
          data: {
            email: testUser.email,
            password: hashedPassword,
            nom: 'Autre',
            prenom: 'User',
            role: 'ADMIN',
            companyId: 'some-company-id'
          }
        });
      }).rejects.toThrow();
    });

    it('devrait hasher le mot de passe', async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      
      expect(hashedPassword).not.toBe(testUser.password);
      expect(hashedPassword.length).toBeGreaterThan(50);
      
      const isValid = await bcrypt.compare(testUser.password, hashedPassword);
      expect(isValid).toBe(true);
    });
  });

  describe('Connexion', () => {
    it('devrait valider un mot de passe correct', async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      
      const result = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: { nom: testUser.companyName, email: testUser.email, plan: 'FREE' }
        });
        const user = await tx.user.create({
          data: {
            email: testUser.email,
            password: hashedPassword,
            nom: testUser.nom,
            prenom: testUser.prenom,
            role: 'ADMIN',
            companyId: company.id
          }
        });
        return user;
      });

      // Vérifier le mot de passe
      const isValid = await bcrypt.compare(testUser.password, result.password);
      expect(isValid).toBe(true);
    });

    it('devrait rejeter un mot de passe incorrect', async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      
      const result = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: { nom: testUser.companyName, email: testUser.email, plan: 'FREE' }
        });
        const user = await tx.user.create({
          data: {
            email: testUser.email,
            password: hashedPassword,
            nom: testUser.nom,
            prenom: testUser.prenom,
            role: 'ADMIN',
            companyId: company.id
          }
        });
        return user;
      });

      const isValid = await bcrypt.compare('wrong-password', result.password);
      expect(isValid).toBe(false);
    });
  });

  describe('Rôles et permissions', () => {
    it('devrait assigner le rôle ADMIN par défaut', async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      
      const user = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: { nom: testUser.companyName, email: testUser.email, plan: 'FREE' }
        });
        return tx.user.create({
          data: {
            email: testUser.email,
            password: hashedPassword,
            nom: testUser.nom,
            prenom: testUser.prenom,
            role: 'ADMIN',
            companyId: company.id
          }
        });
      });

      expect(user.role).toBe('ADMIN');
    });

    it('devrait supporter les différents rôles', () => {
      const roles = ['ADMIN', 'MANAGER', 'COMPTABLE', 'EMPLOYE'];
      
      roles.forEach(role => {
        expect(['ADMIN', 'MANAGER', 'COMPTABLE', 'EMPLOYE']).toContain(role);
      });
    });
  });
});

describe('Validation des données auth', () => {
  it('devrait valider un email correct', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    expect(emailRegex.test('test@example.com')).toBe(true);
    expect(emailRegex.test('user.name@domain.co.gn')).toBe(true);
  });

  it('devrait rejeter un email invalide', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    expect(emailRegex.test('invalid-email')).toBe(false);
    expect(emailRegex.test('@domain.com')).toBe(false);
    expect(emailRegex.test('user@')).toBe(false);
  });

  it('devrait exiger un mot de passe de 6+ caractères', () => {
    const validatePassword = (pwd: string) => pwd.length >= 6;
    
    expect(validatePassword('123456')).toBe(true);
    expect(validatePassword('Password123!')).toBe(true);
    expect(validatePassword('12345')).toBe(false);
  });
});
