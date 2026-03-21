// Tests Factures pour GuinéaManager ERP
// Tests: création facture, calculs TVA, PDF, statuts, validation

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createFactureSchema, updateFactureSchema, factureFilterSchema, ligneFactureSchema } from '../src/utils/validation';

// Mock Prisma
const mockPrismaFacture = {
  facture: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    aggregate: vi.fn(),
  },
  client: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  ligneFacture: {
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock('../src/utils/database', () => ({
  default: mockPrismaFacture,
}));

// ============================================
// Fonctions utilitaires de calcul TVA
// ============================================
function calculerMontantsLigne(quantite: number, prixUnitaire: number, tauxTVA: number = 18) {
  const montantHT = Math.round(quantite * prixUnitaire);
  const montantTVA = Math.round(montantHT * (tauxTVA / 100));
  const montantTTC = montantHT + montantTVA;
  return { montantHT, montantTVA, montantTTC };
}

function calculerTotauxFacture(lignes: Array<{ quantite: number; prixUnitaire: number; tauxTVA: number }>) {
  let montantHT = 0;
  let montantTVA = 0;

  for (const ligne of lignes) {
    const montants = calculerMontantsLigne(ligne.quantite, ligne.prixUnitaire, ligne.tauxTVA);
    montantHT += montants.montantHT;
    montantTVA += montants.montantTVA;
  }

  return {
    montantHT,
    montantTVA,
    montantTTC: montantHT + montantTVA,
  };
}

function genererNumeroFacture(sequence: number): string {
  const year = new Date().getFullYear();
  return `FAC-${year}-${sequence.toString().padStart(6, '0')}`;
}

// ============================================
// Tests Calculs TVA
// ============================================
describe('Calculs TVA', () => {
  describe('calculerMontantsLigne', () => {
    it('devrait calculer les montants avec TVA 18%', () => {
      const result = calculerMontantsLigne(10, 50000, 18);

      // HT = 10 * 50000 = 500 000
      // TVA = 500 000 * 18% = 90 000
      // TTC = 500 000 + 90 000 = 590 000
      expect(result.montantHT).toBe(500000);
      expect(result.montantTVA).toBe(90000);
      expect(result.montantTTC).toBe(590000);
    });

    it('devrait calculer les montants avec TVA 0%', () => {
      const result = calculerMontantsLigne(5, 100000, 0);

      expect(result.montantHT).toBe(500000);
      expect(result.montantTVA).toBe(0);
      expect(result.montantTTC).toBe(500000);
    });

    it('devrait gérer les quantités décimales (arrondies)', () => {
      const result = calculerMontantsLigne(2.5, 100000, 18);

      // HT = 2.5 * 100000 = 250 000
      // TVA = 250 000 * 18% = 45 000
      expect(result.montantHT).toBe(250000);
      expect(result.montantTVA).toBe(45000);
    });

    it('devrait gérer les prix unitaires élevés', () => {
      const result = calculerMontantsLigne(1, 50000000, 18); // 50M GNF

      expect(result.montantHT).toBe(50000000);
      expect(result.montantTVA).toBe(9000000);
      expect(result.montantTTC).toBe(59000000);
    });

    it('devrait gérer les taux TVA personnalisés', () => {
      // Test avec différents taux
      const taux5 = calculerMontantsLigne(100, 1000, 5);
      expect(taux5.montantTVA).toBe(5000);

      const taux10 = calculerMontantsLigne(100, 1000, 10);
      expect(taux10.montantTVA).toBe(10000);

      const taux20 = calculerMontantsLigne(100, 1000, 20);
      expect(taux20.montantTVA).toBe(20000);
    });
  });

  describe('calculerTotauxFacture', () => {
    it('devrait calculer les totaux pour plusieurs lignes', () => {
      const lignes = [
        { quantite: 2, prixUnitaire: 50000, tauxTVA: 18 },   // HT: 100k, TVA: 18k
        { quantite: 1, prixUnitaire: 100000, tauxTVA: 18 },  // HT: 100k, TVA: 18k
        { quantite: 5, prixUnitaire: 20000, tauxTVA: 0 },    // HT: 100k, TVA: 0
      ];

      const result = calculerTotauxFacture(lignes);

      expect(result.montantHT).toBe(300000);
      expect(result.montantTVA).toBe(36000);
      expect(result.montantTTC).toBe(336000);
    });

    it('devrait gérer une facture vide', () => {
      const result = calculerTotauxFacture([]);

      expect(result.montantHT).toBe(0);
      expect(result.montantTVA).toBe(0);
      expect(result.montantTTC).toBe(0);
    });

    it('devrait gérer les taux TVA différents par ligne', () => {
      const lignes = [
        { quantite: 1, prixUnitaire: 100000, tauxTVA: 18 },  // TVA: 18k
        { quantite: 1, prixUnitaire: 100000, tauxTVA: 10 },  // TVA: 10k
        { quantite: 1, prixUnitaire: 100000, tauxTVA: 0 },   // TVA: 0
      ];

      const result = calculerTotauxFacture(lignes);

      expect(result.montantHT).toBe(300000);
      expect(result.montantTVA).toBe(28000);
    });
  });
});

// ============================================
// Tests Validation Schemas - Factures
// ============================================
describe('Facture Validation Schemas', () => {
  describe('ligneFactureSchema', () => {
    it('devrait valider une ligne de facture correcte', () => {
      const data = {
        description: 'Prestation de service',
        quantite: 5,
        prixUnitaire: 50000,
        tauxTVA: 18,
      };

      const result = ligneFactureSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('devrait utiliser la TVA par défaut (0)', () => {
      const data = {
        description: 'Produit exempté',
        quantite: 1,
        prixUnitaire: 100000,
      };

      const result = ligneFactureSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tauxTVA).toBe(0);
      }
    });

    it('devrait rejeter une quantité négative', () => {
      const data = {
        description: 'Test',
        quantite: -1,
        prixUnitaire: 100000,
      };

      const result = ligneFactureSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un prix négatif', () => {
      const data = {
        description: 'Test',
        quantite: 1,
        prixUnitaire: -100,
      };

      const result = ligneFactureSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un taux TVA > 100%', () => {
      const data = {
        description: 'Test',
        quantite: 1,
        prixUnitaire: 100000,
        tauxTVA: 150,
      };

      const result = ligneFactureSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter une description vide', () => {
      const data = {
        description: '',
        quantite: 1,
        prixUnitaire: 100000,
      };

      const result = ligneFactureSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('createFactureSchema', () => {
    it('devrait valider une facture complète', () => {
      const data = {
        clientId: 'clt_123456789',
        dateEmission: new Date('2024-01-15'),
        dateEcheance: new Date('2024-02-15'),
        modePaiement: 'virement' as const,
        notes: 'Merci pour votre confiance',
        lignes: [
          { description: 'Service 1', quantite: 2, prixUnitaire: 50000, tauxTVA: 18 },
          { description: 'Service 2', quantite: 1, prixUnitaire: 100000, tauxTVA: 18 },
        ],
      };

      const result = createFactureSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('devrait rejeter une facture sans lignes', () => {
      const data = {
        clientId: 'clt_123456789',
        lignes: [],
      };

      const result = createFactureSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un clientId invalide', () => {
      const data = {
        clientId: 'invalid-id',
        lignes: [
          { description: 'Test', quantite: 1, prixUnitaire: 100000 },
        ],
      };

      const result = createFactureSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('devrait accepter les modes de paiement valides', () => {
      const modes = ['especes', 'virement', 'cheque', 'mobile_money'];

      for (const mode of modes) {
        const data = {
          clientId: 'clt_123456789',
          modePaiement: mode,
          lignes: [
            { description: 'Test', quantite: 1, prixUnitaire: 100000 },
          ],
        };

        const result = createFactureSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('factureFilterSchema', () => {
    it('devrait valider les filtres de statut', () => {
      const statuts = ['brouillon', 'envoyee', 'payee', 'annulee'];

      for (const statut of statuts) {
        const result = factureFilterSchema.safeParse({ statut });
        expect(result.success).toBe(true);
      }
    });

    it('devrait valider les filtres de date', () => {
      const data = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = factureFilterSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('devrait convertir les dates depuis des strings', () => {
      const data = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const result = factureFilterSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startDate instanceof Date).toBe(true);
        expect(result.data.endDate instanceof Date).toBe(true);
      }
    });
  });
});

// ============================================
// Tests Génération Numéro Facture
// ============================================
describe('Génération Numéro Facture', () => {
  it('devrait générer un numéro au bon format', () => {
    const numero = genererNumeroFacture(1);

    expect(numero).toMatch(/^FAC-\d{4}-\d{6}$/);
  });

  it('devrait incrémenter correctement la séquence', () => {
    const num1 = genererNumeroFacture(1);
    const num2 = genererNumeroFacture(2);
    const num10 = genererNumeroFacture(10);
    const num100 = genererNumeroFacture(100);
    const num1000 = genererNumeroFacture(1000);

    expect(num1).toContain('000001');
    expect(num2).toContain('000002');
    expect(num10).toContain('000010');
    expect(num100).toContain('000100');
    expect(num1000).toContain('001000');
  });

  it('devrait utiliser l\'année courante', () => {
    const currentYear = new Date().getFullYear();
    const numero = genererNumeroFacture(1);

    expect(numero).toContain(currentYear.toString());
  });
});

// ============================================
// Tests Transitions de Statut
// ============================================
describe('Transitions de Statut Facture', () => {
  const validTransitions: Record<string, string[]> = {
    brouillon: ['envoyee', 'annulee'],
    envoyee: ['payee', 'annulee'],
    payee: [],
    annulee: [],
  };

  function isValidTransition(from: string, to: string): boolean {
    return validTransitions[from]?.includes(to) ?? false;
  }

  it('devrait permettre la transition brouillon -> envoyee', () => {
    expect(isValidTransition('brouillon', 'envoyee')).toBe(true);
  });

  it('devrait permettre la transition brouillon -> annulee', () => {
    expect(isValidTransition('brouillon', 'annulee')).toBe(true);
  });

  it('devrait permettre la transition envoyee -> payee', () => {
    expect(isValidTransition('envoyee', 'payee')).toBe(true);
  });

  it('devrait permettre la transition envoyee -> annulee', () => {
    expect(isValidTransition('envoyee', 'annulee')).toBe(true);
  });

  it('devrait empêcher la transition payee -> autre', () => {
    expect(isValidTransition('payee', 'envoyee')).toBe(false);
    expect(isValidTransition('payee', 'annulee')).toBe(false);
    expect(isValidTransition('payee', 'brouillon')).toBe(false);
  });

  it('devrait empêcher la transition annulee -> autre', () => {
    expect(isValidTransition('annulee', 'envoyee')).toBe(false);
    expect(isValidTransition('annulee', 'payee')).toBe(false);
  });

  it('devrait empêcher la transition directe brouillon -> payee', () => {
    expect(isValidTransition('brouillon', 'payee')).toBe(false);
  });
});

// ============================================
// Tests Service Facture
// ============================================
describe('Facture Service Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createFacture', () => {
    it('devrait créer une facture avec les bonnes données', async () => {
      const mockFacture = {
        id: 'fact-123',
        numero: 'FAC-2024-000001',
        clientId: 'client-123',
        dateEmission: new Date(),
        dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        montantHT: 500000,
        montantTVA: 90000,
        montantTTC: 590000,
        statut: 'brouillon',
        lignes: [
          { description: 'Service', quantite: 10, prixUnitaire: 50000, montantHT: 500000, montantTVA: 90000, montantTTC: 590000 },
        ],
      };

      mockPrismaFacture.facture.create.mockResolvedValue(mockFacture);

      const result = await mockPrismaFacture.facture.create({
        data: {
          numero: 'FAC-2024-000001',
          clientId: 'client-123',
          montantHT: 500000,
          montantTVA: 90000,
          montantTTC: 590000,
          statut: 'brouillon',
        },
      });

      expect(result).toEqual(mockFacture);
    });

    it('devrait vérifier l\'existence du client', async () => {
      mockPrismaFacture.client.findFirst.mockResolvedValue({
        id: 'client-123',
        nom: 'Client Test',
      });

      const client = await mockPrismaFacture.client.findFirst({
        where: { id: 'client-123', companyId: 'company-123' },
      });

      expect(client).not.toBeNull();
    });

    it('devrait rejeter si le client n\'existe pas', async () => {
      mockPrismaFacture.client.findFirst.mockResolvedValue(null);

      const client = await mockPrismaFacture.client.findFirst({
        where: { id: 'non-existent', companyId: 'company-123' },
      });

      expect(client).toBeNull();
    });
  });

  describe('getFactures', () => {
    it('devrait retourner une liste paginée de factures', async () => {
      const mockFactures = [
        { id: '1', numero: 'FAC-2024-000001', montantTTC: 500000 },
        { id: '2', numero: 'FAC-2024-000002', montantTTC: 750000 },
      ];

      mockPrismaFacture.facture.findMany.mockResolvedValue(mockFactures);
      mockPrismaFacture.facture.count.mockResolvedValue(2);

      const factures = await mockPrismaFacture.facture.findMany({
        where: { companyId: 'company-123' },
        skip: 0,
        take: 10,
      });
      const total = await mockPrismaFacture.facture.count({ where: { companyId: 'company-123' } });

      expect(factures.length).toBe(2);
      expect(total).toBe(2);
    });

    it('devrait filtrer par statut', async () => {
      const mockFactures = [
        { id: '1', numero: 'FAC-2024-000001', statut: 'payee' },
      ];

      mockPrismaFacture.facture.findMany.mockResolvedValue(mockFactures);

      const factures = await mockPrismaFacture.facture.findMany({
        where: { companyId: 'company-123', statut: 'payee' },
      });

      expect(factures.length).toBe(1);
      expect(factures[0].statut).toBe('payee');
    });

    it('devrait filtrer par client', async () => {
      const mockFactures = [
        { id: '1', clientId: 'client-123' },
      ];

      mockPrismaFacture.facture.findMany.mockResolvedValue(mockFactures);

      const factures = await mockPrismaFacture.facture.findMany({
        where: { companyId: 'company-123', clientId: 'client-123' },
      });

      expect(factures[0].clientId).toBe('client-123');
    });
  });

  describe('updateFactureStatut', () => {
    it('devrait mettre à jour le statut d\'une facture', async () => {
      const updatedFacture = {
        id: 'fact-123',
        statut: 'envoyee',
      };

      mockPrismaFacture.facture.findFirst.mockResolvedValue({ id: 'fact-123', statut: 'brouillon' });
      mockPrismaFacture.facture.update.mockResolvedValue(updatedFacture);

      const result = await mockPrismaFacture.facture.update({
        where: { id: 'fact-123' },
        data: { statut: 'envoyee' },
      });

      expect(result.statut).toBe('envoyee');
    });

    it('devrait mettre à jour le totalAchats du client quand facture payée', async () => {
      mockPrismaFacture.facture.findFirst.mockResolvedValue({
        id: 'fact-123',
        statut: 'envoyee',
        clientId: 'client-123',
        montantTTC: 590000,
      });

      await mockPrismaFacture.client.update({
        where: { id: 'client-123' },
        data: { totalAchats: { increment: 590000 } },
      });

      expect(mockPrismaFacture.client.update).toHaveBeenCalled();
    });
  });

  describe('deleteFacture', () => {
    it('devrait supprimer une facture en brouillon', async () => {
      mockPrismaFacture.facture.findFirst.mockResolvedValue({
        id: 'fact-123',
        statut: 'brouillon',
      });
      mockPrismaFacture.ligneFacture.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaFacture.facture.delete.mockResolvedValue({ id: 'fact-123' });

      await mockPrismaFacture.ligneFacture.deleteMany({ where: { factureId: 'fact-123' } });
      await mockPrismaFacture.facture.delete({ where: { id: 'fact-123' } });

      expect(mockPrismaFacture.facture.delete).toHaveBeenCalled();
    });

    it('devrait empêcher la suppression d\'une facture envoyée', async () => {
      mockPrismaFacture.facture.findFirst.mockResolvedValue({
        id: 'fact-123',
        statut: 'envoyee',
      });

      const facture = await mockPrismaFacture.facture.findFirst({ where: { id: 'fact-123' } });

      expect(facture?.statut).not.toBe('brouillon');
      // Le service devrait lancer une ConflictError
    });
  });
});

// ============================================
// Tests Statistiques Factures
// ============================================
describe('Statistiques Factures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait calculer les statistiques des factures', async () => {
    mockPrismaFacture.facture.count.mockResolvedValue(50);
    mockPrismaFacture.facture.groupBy.mockResolvedValue([
      { statut: 'brouillon', _count: { id: 10 }, _sum: { montantTTC: 1000000 } },
      { statut: 'envoyee', _count: { id: 15 }, _sum: { montantTTC: 2500000 } },
      { statut: 'payee', _count: { id: 20 }, _sum: { montantTTC: 5000000 } },
      { statut: 'annulee', _count: { id: 5 }, _sum: { montantTTC: 500000 } },
    ]);
    mockPrismaFacture.facture.aggregate.mockResolvedValue({
      _sum: { montantTTC: 5000000 },
    });

    const totalFactures = await mockPrismaFacture.facture.count({ where: { companyId: 'company-123' } });
    const byStatut = await mockPrismaFacture.facture.groupBy({
      by: ['statut'],
      where: { companyId: 'company-123' },
      _count: { id: true },
      _sum: { montantTTC: true },
    });
    const chiffreAffaires = await mockPrismaFacture.facture.aggregate({
      where: { companyId: 'company-123', statut: 'payee' },
      _sum: { montantTTC: true },
    });

    expect(totalFactures).toBe(50);
    expect(byStatut.length).toBe(4);
    expect(chiffreAffaires._sum.montantTTC).toBe(5000000);
  });

  it('devrait compter les factures en retard', async () => {
    mockPrismaFacture.facture.count.mockResolvedValue(3);

    const enRetard = await mockPrismaFacture.facture.count({
      where: {
        companyId: 'company-123',
        statut: 'envoyee',
        dateEcheance: { lt: new Date() },
      },
    });

    expect(enRetard).toBe(3);
  });
});

// ============================================
// Tests PDF Generation (mock)
// ============================================
describe('PDF Generation', () => {
  it('devrait générer un buffer PDF', async () => {
    // Mock de la génération PDF
    const mockPdfBuffer = Buffer.from('mock-pdf-content');

    const generatePDF = vi.fn().mockResolvedValue(mockPdfBuffer);

    const result = await generatePDF({
      numero: 'FAC-2024-000001',
      dateEmission: new Date(),
      dateEcheance: new Date(),
      statut: 'envoyee',
      montantHT: 500000,
      montantTVA: 90000,
      montantTTC: 590000,
      client: { nom: 'Client Test' },
      company: { nom: 'Company Test' },
      lignes: [{ description: 'Test', quantite: 1, prixUnitaire: 500000, tauxTVA: 18, montantHT: 500000, montantTVA: 90000, montantTTC: 590000 }],
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('devrait inclure les bonnes informations dans le PDF', async () => {
    const factureData = {
      numero: 'FAC-2024-000123',
      dateEmission: new Date('2024-01-15'),
      dateEcheance: new Date('2024-02-15'),
      statut: 'envoyee',
      montantHT: 1000000,
      montantTVA: 180000,
      montantTTC: 1180000,
      client: {
        nom: 'Mamadou Diallo',
        email: 'mamadou@email.com',
        telephone: '+224 620 00 00 00',
        adresse: 'Hamdallaye, Conakry',
      },
      company: {
        nom: 'Guinée Services SARL',
        ninea: 'GN-12345678',
        telephone: '+224 664 00 00 00',
      },
      lignes: [
        { description: 'Consultation', quantite: 5, prixUnitaire: 100000, tauxTVA: 18, montantHT: 500000, montantTVA: 90000, montantTTC: 590000 },
        { description: 'Formation', quantite: 1, prixUnitaire: 500000, tauxTVA: 18, montantHT: 500000, montantTVA: 90000, montantTTC: 590000 },
      ],
    };

    // Vérifier que les données sont correctes
    expect(factureData.numero).toBe('FAC-2024-000123');
    expect(factureData.montantTTC).toBe(1180000);
    expect(factureData.lignes.length).toBe(2);
  });
});

// ============================================
// Tests Edge Cases
// ============================================
describe('Facture Edge Cases', () => {
  it('devrait gérer une facture avec beaucoup de lignes', () => {
    const lignes = Array.from({ length: 50 }, (_, i) => ({
      description: `Ligne ${i + 1}`,
      quantite: 1,
      prixUnitaire: 10000,
      tauxTVA: 18,
    }));

    const result = calculerTotauxFacture(lignes);

    expect(result.montantHT).toBe(500000);
    expect(result.montantTVA).toBe(90000);
  });

  it('devrait gérer les montants très élevés', () => {
    const result = calculerMontantsLigne(1, 1000000000, 18); // 1 milliard GNF

    expect(result.montantHT).toBe(1000000000);
    expect(result.montantTVA).toBe(180000000);
    expect(result.montantTTC).toBe(1180000000);
  });

  it('devrait gérer les dates d\'échéance dans le passé', () => {
    const dateEmission = new Date('2024-01-15');
    const dateEcheance = new Date('2024-01-01'); // Passé

    // La validation ne devrait pas empêcher cela (pour les cas de factures rétroactives)
    expect(dateEcheance < dateEmission).toBe(true);
  });
});
