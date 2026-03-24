// Tests du module Clients pour GuinéaManager ERP
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/index';

describe('Module Clients', () => {
  let companyId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Créer une entreprise de test
    const company = await prisma.company.upsert({
      where: { id: 'test-company-clients' },
      update: {},
      create: {
        id: 'test-company-clients',
        nom: 'Test Company Clients',
        email: 'clients@test.com',
        plan: 'STANDARD'
      }
    });
    companyId = company.id;

    // Créer un utilisateur de test
    const user = await prisma.user.upsert({
      where: { id: 'test-user-clients' },
      update: {},
      create: {
        id: 'test-user-clients',
        email: 'clients-user@test.com',
        password: 'hashedpassword',
        nom: 'Test',
        prenom: 'User',
        role: 'ADMIN',
        companyId
      }
    });
    testUserId = user.id;
  });

  describe('Création de client', () => {
    it('devrait créer un client particulier', async () => {
      const client = await prisma.client.create({
        data: {
          nom: 'Alpha Condé',
          email: 'alpha@example.com',
          telephone: '+224 622 22 22 22',
          adresse: 'Kaloum',
          ville: 'Conakry',
          type: 'PARTICULIER',
          companyId
        }
      });

      expect(client.nom).toBe('Alpha Condé');
      expect(client.email).toBe('alpha@example.com');
      expect(client.type).toBe('PARTICULIER');
      expect(client.totalAchats).toBe(0);
    });

    it('devrait créer un client entreprise', async () => {
      const client = await prisma.client.create({
        data: {
          nom: 'Société Minière SARL',
          email: 'contact@smg-gn.com',
          telephone: '+224 623 33 33 33',
          adresse: 'Hamdallaye',
          ville: 'Conakry',
          type: 'ENTREPRISE',
          companyId
        }
      });

      expect(client.type).toBe('ENTREPRISE');
    });

    it('devrait définir le pays par défaut sur Guinée', async () => {
      const client = await prisma.client.create({
        data: {
          nom: 'Test Default Country',
          email: 'default@test.com',
          type: 'PARTICULIER',
          companyId
        }
      });

      expect(client.pays).toBe('Guinée');
    });

    it('devrait initialiser totalAchats à 0', async () => {
      const client = await prisma.client.create({
        data: {
          nom: 'Test Achats',
          email: 'achats@test.com',
          type: 'PARTICULIER',
          companyId
        }
      });

      expect(client.totalAchats).toBe(0);
    });
  });

  describe('Lecture de clients', () => {
    it('devrait lister les clients d\'une entreprise', async () => {
      // Créer quelques clients
      await prisma.client.createMany({
        data: [
          { nom: 'Client 1', email: 'client1@test.com', type: 'PARTICULIER', companyId },
          { nom: 'Client 2', email: 'client2@test.com', type: 'ENTREPRISE', companyId }
        ]
      });

      const clients = await prisma.client.findMany({
        where: { companyId }
      });

      expect(clients.length).toBeGreaterThanOrEqual(2);
    });

    it('devrait trouver un client par ID', async () => {
      const created = await prisma.client.create({
        data: {
          nom: 'Client Find',
          email: 'find@test.com',
          type: 'PARTICULIER',
          companyId
        }
      });

      const found = await prisma.client.findUnique({
        where: { id: created.id }
      });

      expect(found).not.toBeNull();
      expect(found?.nom).toBe('Client Find');
    });

    it('devrait filtrer par type', async () => {
      await prisma.client.createMany({
        data: [
          { nom: 'Particulier 1', email: 'part1@test.com', type: 'PARTICULIER', companyId },
          { nom: 'Entreprise 1', email: 'ent1@test.com', type: 'ENTREPRISE', companyId }
        ]
      });

      const particuliers = await prisma.client.findMany({
        where: { companyId, type: 'PARTICULIER' }
      });

      expect(particuliers.every(c => c.type === 'PARTICULIER')).toBe(true);
    });
  });

  describe('Mise à jour de client', () => {
    it('devrait mettre à jour le nom d\'un client', async () => {
      const client = await prisma.client.create({
        data: {
          nom: 'Ancien Nom',
          email: 'update@test.com',
          type: 'PARTICULIER',
          companyId
        }
      });

      const updated = await prisma.client.update({
        where: { id: client.id },
        data: { nom: 'Nouveau Nom' }
      });

      expect(updated.nom).toBe('Nouveau Nom');
    });

    it('devrait mettre à jour totalAchats', async () => {
      const client = await prisma.client.create({
        data: {
          nom: 'Client Achats',
          email: 'achats-update@test.com',
          type: 'PARTICULIER',
          companyId
        }
      });

      const updated = await prisma.client.update({
        where: { id: client.id },
        data: { totalAchats: 5000000 }
      });

      expect(updated.totalAchats).toBe(5000000);
    });
  });

  describe('Suppression de client', () => {
    it('devrait supprimer un client', async () => {
      const client = await prisma.client.create({
        data: {
          nom: 'Client à supprimer',
          email: 'delete@test.com',
          type: 'PARTICULIER',
          companyId
        }
      });

      await prisma.client.delete({
        where: { id: client.id }
      });

      const found = await prisma.client.findUnique({
        where: { id: client.id }
      });

      expect(found).toBeNull();
    });
  });

  describe('Recherche de clients', () => {
    beforeEach(async () => {
      await prisma.client.createMany({
        data: [
          { nom: 'Mamadou Diallo', email: 'mamadou@test.com', type: 'PARTICULIER', companyId },
          { nom: 'Fatou Sylla', email: 'fatou@test.com', type: 'PARTICULIER', companyId },
          { nom: 'Société ABC', email: 'abc@test.com', type: 'ENTREPRISE', companyId }
        ]
      });
    });

    it('devrait rechercher par nom', async () => {
      const results = await prisma.client.findMany({
        where: {
          companyId,
          nom: { contains: 'Diallo' }
        }
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].nom).toContain('Diallo');
    });

    it('devrait rechercher par email', async () => {
      const results = await prisma.client.findMany({
        where: {
          companyId,
          email: { contains: 'fatou' }
        }
      });

      expect(results.length).toBeGreaterThan(0);
    });
  });
});
