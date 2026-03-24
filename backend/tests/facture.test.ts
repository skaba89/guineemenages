// Tests pour les routes de factures - GuinéaManager

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/utils/prisma';
import { hashPassword } from '../src/services/auth.service';
import { generateTokenPair } from '../src/utils/jwt';

// Variables de test
let testCompany: any;
let testUser: any;
let testClient: any;
let testProduit: any;
let accessToken: string;

describe('Factures', () => {
  beforeAll(async () => {
    // Créer les données de test
    const passwordHash = await hashPassword('TestPassword123!');
    
    testCompany = await prisma.company.create({
      data: {
        name: 'Test Facture Company',
        plan: 'STANDARD',
        maxUsers: 5,
        maxInvoices: -1,
      },
    });

    testUser = await prisma.user.create({
      data: {
        email: 'facture@test.com',
        passwordHash,
        role: 'OWNER',
        companyId: testCompany.id,
      },
    });

    testClient = await prisma.client.create({
      data: {
        nom: 'Client Test',
        telephone: '622000000',
        email: 'client@test.com',
        companyId: testCompany.id,
      },
    });

    testProduit = await prisma.produit.create({
      data: {
        nom: 'Produit Test',
        reference: 'PRD-TEST-001',
        prixAchat: 50000, // 500 GNF en centimes
        prixVente: 100000, // 1000 GNF en centimes
        stockActuel: 100,
        stockAlerte: 10,
        unite: 'unité',
        companyId: testCompany.id,
      },
    });

    // Générer le token
    const tokens = await generateTokenPair({
      userId: testUser.id,
      email: testUser.email,
      companyId: testCompany.id,
      role: testUser.role,
    });
    accessToken = tokens.accessToken;
  });

  afterAll(async () => {
    // Nettoyer
    await prisma.paiement.deleteMany({});
    await prisma.ligneFacture.deleteMany({});
    await prisma.facture.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.produit.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.client.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.user.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.company.delete({ where: { id: testCompany.id } });
    await prisma.$disconnect();
  });

  describe('POST /api/factures', () => {
    it('devrait créer une nouvelle facture', async () => {
      const response = await request(app)
        .post('/api/factures')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId: testClient.id,
          lignes: [
            {
              produitId: testProduit.id,
              designation: 'Produit Test',
              quantite: 5,
              prixUnitaire: 100000, // 1000 GNF
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.numero).toMatch(/^FAC-\d{4}-\d{4}$/);
      expect(response.body.data.totalHt).toBe(500000); // 5 * 100000
      expect(response.body.data.statut).toBe('BROUILLON');
    });

    it('devrait refuser une facture sans client', async () => {
      const response = await request(app)
        .post('/api/factures')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lignes: [
            {
              designation: 'Test',
              quantite: 1,
              prixUnitaire: 100000,
            },
          ],
        });

      expect(response.status).toBe(400);
    });

    it('devrait refuser une facture sans lignes', async () => {
      const response = await request(app)
        .post('/api/factures')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId: testClient.id,
          lignes: [],
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/factures', () => {
    it('devrait lister les factures', async () => {
      const response = await request(app)
        .get('/api/factures')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('devrait filtrer par statut', async () => {
      const response = await request(app)
        .get('/api/factures?statut=BROUILLON')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((f: any) => {
        expect(f.statut).toBe('BROUILLON');
      });
    });
  });

  describe('POST /api/factures/:id/envoyer', () => {
    let factureId: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/factures')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId: testClient.id,
          lignes: [
            {
              designation: 'Test envoi',
              quantite: 1,
              prixUnitaire: 50000,
            },
          ],
        });
      factureId = response.body.data.id;
    });

    it('devrait envoyer une facture en brouillon', async () => {
      const response = await request(app)
        .post(`/api/factures/${factureId}/envoyer`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.statut).toBe('ENVOYEE');
    });

    it('devrait refuser d\'envoyer une facture déjà envoyée', async () => {
      const response = await request(app)
        .post(`/api/factures/${factureId}/envoyer`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/factures/:id/payer', () => {
    let factureId: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/factures')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId: testClient.id,
          lignes: [
            {
              designation: 'Test paiement',
              quantite: 1,
              prixUnitaire: 100000,
            },
          ],
        });
      factureId = response.body.data.id;

      // Envoyer d'abord
      await request(app)
        .post(`/api/factures/${factureId}/envoyer`)
        .set('Authorization', `Bearer ${accessToken}`);
    });

    it('devrait enregistrer un paiement partiel', async () => {
      const response = await request(app)
        .post(`/api/factures/${factureId}/payer`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          montant: 50000, // 50% du total
          mode: 'CASH',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('devrait refuser un paiement négatif', async () => {
      const response = await request(app)
        .post(`/api/factures/${factureId}/payer`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          montant: -10000,
          mode: 'CASH',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/factures/:id/pdf', () => {
    let factureId: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/factures')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId: testClient.id,
          lignes: [
            {
              designation: 'Test PDF',
              quantite: 1,
              prixUnitaire: 100000,
            },
          ],
        });
      factureId = response.body.data.id;
    });

    it('devrait générer un PDF', async () => {
      const response = await request(app)
        .get(`/api/factures/${factureId}/pdf`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
    });
  });
});
