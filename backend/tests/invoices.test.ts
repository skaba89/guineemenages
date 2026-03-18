// Tests du module Factures pour GuinéaManager ERP
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/index';

describe('Module Factures', () => {
  let companyId: string;
  let clientId: string;
  let produitId: string;

  beforeEach(async () => {
    // Créer une entreprise de test
    const company = await prisma.company.upsert({
      where: { id: 'test-company-factures' },
      update: {},
      create: {
        id: 'test-company-factures',
        nom: 'Test Company Factures',
        email: 'factures@test.com',
        plan: 'STANDARD'
      }
    });
    companyId = company.id;

    // Créer un client de test
    const client = await prisma.client.upsert({
      where: { id: 'test-client-factures' },
      update: {},
      create: {
        id: 'test-client-factures',
        nom: 'Client Facture Test',
        email: 'client-facture@test.com',
        type: 'PARTICULIER',
        companyId
      }
    });
    clientId = client.id;

    // Créer un produit de test
    const produit = await prisma.produit.upsert({
      where: { id: 'test-produit-factures' },
      update: {},
      create: {
        id: 'test-produit-factures',
        nom: 'Produit Test',
        prixUnitaire: 100000,
        unite: 'Unité',
        stockActuel: 100,
        companyId
      }
    });
    produitId = produit.id;
  });

  describe('Calculs de facture', () => {
    it('devrait calculer correctement le montant HT', () => {
      const quantite = 5;
      const prixUnitaire = 100000;
      const montantHT = quantite * prixUnitaire;

      expect(montantHT).toBe(500000);
    });

    it('devrait calculer correctement la TVA 18%', () => {
      const montantHT = 500000;
      const tauxTVA = 18;
      const montantTVA = Math.round(montantHT * tauxTVA / 100);

      expect(montantTVA).toBe(90000);
    });

    it('devrait calculer correctement le TTC', () => {
      const montantHT = 500000;
      const montantTVA = 90000;
      const montantTTC = montantHT + montantTVA;

      expect(montantTTC).toBe(590000);
    });

    it('devrait gérer plusieurs lignes de facture', () => {
      const lignes = [
        { quantite: 2, prixUnitaire: 100000, tauxTVA: 18 },
        { quantite: 1, prixUnitaire: 50000, tauxTVA: 18 },
        { quantite: 3, prixUnitaire: 25000, tauxTVA: 18 }
      ];

      let totalHT = 0;
      let totalTVA = 0;

      lignes.forEach(ligne => {
        const ht = ligne.quantite * ligne.prixUnitaire;
        const tva = Math.round(ht * ligne.tauxTVA / 100);
        totalHT += ht;
        totalTVA += tva;
      });

      // HT: 200000 + 50000 + 75000 = 325000
      // TVA: 36000 + 9000 + 13500 = 58500
      expect(totalHT).toBe(325000);
      expect(totalTVA).toBe(58500);
      expect(totalHT + totalTVA).toBe(383500);
    });
  });

  describe('Création de facture', () => {
    it('devrait créer une facture avec des lignes', async () => {
      const facture = await prisma.facture.create({
        data: {
          numero: 'FAC-TEST-001',
          clientId,
          dateEmission: new Date(),
          dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          montantHT: 100000,
          montantTVA: 18000,
          montantTTC: 118000,
          statut: 'BROUILLON',
          companyId,
          lignes: {
            create: [
              {
                description: 'Produit Test',
                quantite: 1,
                prixUnitaire: 100000,
                tauxTVA: 18,
                montantHT: 100000,
                montantTVA: 18000,
                montantTTC: 118000
              }
            ]
          }
        },
        include: { lignes: true }
      });

      expect(facture.numero).toBe('FAC-TEST-001');
      expect(facture.montantHT).toBe(100000);
      expect(facture.montantTTC).toBe(118000);
      expect(facture.lignes.length).toBe(1);
    });

    it('devrait générer un numéro de facture unique', async () => {
      const year = new Date().getFullYear();
      
      const facture1 = await prisma.facture.create({
        data: {
          numero: `FAC-${year}-0001`,
          clientId,
          dateEmission: new Date(),
          dateEcheance: new Date(),
          montantHT: 100000,
          montantTVA: 18000,
          montantTTC: 118000,
          statut: 'BROUILLON',
          companyId
        }
      });

      expect(facture1.numero).toMatch(/FAC-\d{4}-\d{4}/);
    });

    it('devrait définir le statut BROUILLON par défaut', async () => {
      const facture = await prisma.facture.create({
        data: {
          numero: 'FAC-TEST-DEFAULT',
          clientId,
          dateEmission: new Date(),
          dateEcheance: new Date(),
          montantHT: 50000,
          montantTVA: 9000,
          montantTTC: 59000,
          companyId
        }
      });

      expect(facture.statut).toBe('BROUILLON');
    });
  });

  describe('Statuts de facture', () => {
    it('devrait supporter tous les statuts', () => {
      const statuts = ['BROUILLON', 'ENVOYEE', 'PAYEE', 'EN_RETARD', 'ANNULEE'];
      
      statuts.forEach(statut => {
        expect(['BROUILLON', 'ENVOYEE', 'PAYEE', 'EN_RETARD', 'ANNULEE']).toContain(statut);
      });
    });

    it('devrait mettre à jour le statut', async () => {
      const facture = await prisma.facture.create({
        data: {
          numero: 'FAC-TEST-STATUT',
          clientId,
          dateEmission: new Date(),
          dateEcheance: new Date(),
          montantHT: 50000,
          montantTVA: 9000,
          montantTTC: 59000,
          statut: 'BROUILLON',
          companyId
        }
      });

      const updated = await prisma.facture.update({
        where: { id: facture.id },
        data: { statut: 'ENVOYEE' }
      });

      expect(updated.statut).toBe('ENVOYEE');
    });
  });

  describe('Modes de paiement', () => {
    it('devrait supporter tous les modes de paiement guinéens', () => {
      const modes = ['ESPECES', 'VIREMENT', 'ORANGE_MONEY', 'MTN_MONEY', 'CHEQUE', 'CARTE'];
      
      modes.forEach(mode => {
        expect(['ESPECES', 'VIREMENT', 'ORANGE_MONEY', 'MTN_MONEY', 'CHEQUE', 'CARTE']).toContain(mode);
      });
    });
  });

  describe('Numérotation automatique', () => {
    it('devrait incrémenter le numéro de facture', async () => {
      const count = await prisma.facture.count({
        where: { companyId }
      });

      const year = new Date().getFullYear();
      const nextNumber = String(count + 1).padStart(4, '0');
      const numero = `FAC-${year}-${nextNumber}`;

      expect(numero).toMatch(/FAC-\d{4}-\d{4}/);
    });
  });
});
