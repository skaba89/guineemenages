// Tests unitaires pour GuinéaManager ERP
// Tests des calculs de paie guinéens (CNSS + IPR)

import { describe, it, expect } from 'vitest';
import { calculerCNSS, calculerIPR, calculerPaieComplete, formatGNF } from '../src/utils/payroll';

// Les montants sont en centimes dans le système
const CENTIME = 100;
const GNF = (gnf: number) => gnf * CENTIME; // Convertir GNF en centimes

describe('Calculs de paie guinéens', () => {
  describe('Calcul CNSS', () => {
    it('devrait calculer la CNSS employé (5%)', () => {
      const brut = GNF(3000000); // 3M GNF en centimes
      const cnss = calculerCNSS(brut);

      // CNSS employé = 5% de 3M = 150 000 GNF (en centimes: 15 000 000)
      expect(cnss.employe).toBe(GNF(150000));
    });

    it('devrait calculer la CNSS employeur (18%)', () => {
      const brut = GNF(3000000);
      const cnss = calculerCNSS(brut);

      // CNSS employeur = 18% de 3M = 540 000 GNF
      expect(cnss.employeur).toBe(GNF(540000));
    });

    it('devrait plafonner la CNSS à 5M GNF', () => {
      const brut = GNF(10000000); // 10M GNF
      const cnss = calculerCNSS(brut);

      // CNSS plafonnée à 5M
      // Employé: 5% de 5M = 250 000 GNF
      // Employeur: 18% de 5M = 900 000 GNF
      expect(cnss.employe).toBe(GNF(250000));
      expect(cnss.employeur).toBe(GNF(900000));
    });
  });

  describe('Calcul IPR (Impôt sur le revenu progressif)', () => {
    it('devrait être 0% pour un salaire ≤ 3M GNF', () => {
      // Base imposable = 3M - CNSS employé (150k) = 2.85M < 3M → 0%
      const baseImposable = GNF(2850000);
      const ipr = calculerIPR(baseImposable);

      expect(ipr).toBe(0);
    });

    it('devrait appliquer 10% pour la tranche 3M-5M GNF', () => {
      // Base imposable = 3.8M
      // IPR = 10% de (3.8M - 3M) = 10% de 800k = 80 000 GNF
      const baseImposable = GNF(3800000);
      const ipr = calculerIPR(baseImposable);

      expect(ipr).toBe(GNF(80000));
    });

    it('devrait appliquer le barème progressif correctement', () => {
      // Base imposable = 6M GNF
      // Tranche 0-3M: 0%
      // Tranche 3M-5M: 10% de 2M = 200k
      // Tranche 5M-6M: 15% de 1M = 150k
      // Total IPR = 350 000 GNF
      const baseImposable = GNF(6000000);
      const ipr = calculerIPR(baseImposable);

      expect(ipr).toBe(GNF(350000));
    });
  });

  describe('Calcul paie complète', () => {
    it('devrait calculer correctement un bulletin de paie', () => {
      const result = calculerPaieComplete({
        salaireBase: GNF(3500000), // 3.5M GNF
        heuresSupplementaires: 0,
        tauxHoraire: 0,
        primes: GNF(200000),
        indemnites: GNF(100000),
        autresAvantages: 0,
        acomptes: 0,
        autresRetenues: 0
      });

      // Brut total = 3.5M + 200k + 100k = 3.8M GNF
      expect(result.brutTotal).toBe(GNF(3800000));

      // CNSS employé = 5% de 3.8M = 190 000 GNF
      expect(result.cnssEmploye).toBe(GNF(190000));

      // CNSS employeur = 18% de 3.8M = 684 000 GNF
      expect(result.cnssEmployeur).toBe(GNF(684000));

      // Base imposable = 3.8M - 190k = 3.61M
      // IPR = 10% de (3.61M - 3M) = 10% de 610k = 61 000 GNF
      expect(result.ipr).toBe(GNF(61000));

      // Net = 3.8M - 190k - 61k = 3 549 000 GNF
      expect(result.netAPayer).toBe(GNF(3549000));

      // Coût total employeur = 3.8M + 684k = 4 484 000 GNF
      expect(result.coutTotalEmployeur).toBe(GNF(4484000));
    });

    it('devrait déduire les acomptes du net', () => {
      const result = calculerPaieComplete({
        salaireBase: GNF(3000000),
        heuresSupplementaires: 0,
        tauxHoraire: 0,
        primes: 0,
        indemnites: 0,
        autresAvantages: 0,
        acomptes: GNF(500000), // Acompte de 500k
        autresRetenues: 0
      });

      // Brut = 3M, CNSS = 150k, IPR = 0
      // Net avant acompte = 2 850 000
      // Net après acompte = 2 350 000
      expect(result.netAPayer).toBe(GNF(2350000));
    });

    it('devrait calculer avec heures supplémentaires', () => {
      const result = calculerPaieComplete({
        salaireBase: GNF(3500000),
        heuresSupplementaires: 8,
        tauxHoraire: GNF(21875), // ~20k GNF/heure
        primes: 0,
        indemnites: 0,
        autresAvantages: 0,
        acomptes: 0,
        autresRetenues: 0
      });

      // Montant heures supp = 8 * 21 875 = 175 000 GNF
      // Brut = 3.5M + 175k = 3 675 000 GNF
      expect(result.brutTotal).toBe(GNF(3675000));
    });
  });

  describe('Formatage GNF', () => {
    it('devrait formater correctement les montants', () => {
      const montant = GNF(3500000); // 3.5M GNF en centimes
      const formate = formatGNF(montant);

      expect(formate).toContain('3');
      expect(formate).toContain('500');
      expect(formate).toContain('GNF');
    });
  });
});
