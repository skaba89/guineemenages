// Tests pour les calculs de paie - GuinéaManager

import { describe, it, expect } from 'vitest';
import { 
  calculerCNSS, 
  calculerIPR, 
  calculerPaieComplete,
  genererBulletinDetails,
  calculerMasseSalariale 
} from '../src/utils/payroll';

describe('Calculs de Paie Guinée', () => {
  describe('calculerCNSS', () => {
    it('devrait calculer la CNSS employé à 5%', () => {
      const salaire = 2000000; // 2M GNF
      const result = calculerCNSS(salaire);
      
      expect(result.employe).toBe(100000); // 5% de 2M
      expect(result.patron).toBe(360000); // 18% de 2M
    });

    it('devrait plafonner la base de calcul à 5M GNF', () => {
      const salaire = 10000000; // 10M GNF
      const result = calculerCNSS(salaire);
      
      // CNSS calculée sur 5M max
      expect(result.employe).toBe(250000); // 5% de 5M
      expect(result.patron).toBe(900000); // 18% de 5M
    });

    it('devrait gérer un salaire nul', () => {
      const result = calculerCNSS(0);
      
      expect(result.employe).toBe(0);
      expect(result.patron).toBe(0);
    });
  });

  describe('calculerIPR', () => {
    it('devrait retourner 0 pour un salaire <= 3M GNF', () => {
      const salaire = 3000000;
      const cnss = 150000; // 5% de 3M
      const ipr = calculerIPR(salaire, cnss);
      
      // Base imposable = 3M - 150000 = 2.85M < 3M
      expect(ipr).toBe(0);
    });

    it('devrait appliquer 10% pour la tranche 3M-5M', () => {
      const salaire = 4000000; // 4M GNF
      const cnss = 200000; // 5% de 4M
      const ipr = calculerIPR(salaire, cnss);
      
      // Base imposable = 4M - 200K = 3.8M
      // 3.8M - 3M = 800K dans la tranche à 10%
      // IPR = 800K * 10% = 80000
      expect(ipr).toBe(80000);
    });

    it('devrait appliquer le barème progressif pour 7M GNF', () => {
      const salaire = 7000000; // 7M GNF
      const cnss = 350000; // 5% de 7M
      const ipr = calculerIPR(salaire, cnss);
      
      // Base imposable = 7M - 350K = 6.65M
      // 0-3M: 0%
      // 3M-5M: 2M * 10% = 200K
      // 5M-6.65M: 1.65M * 15% = 247500
      // Total = 447500
      expect(ipr).toBe(447500);
    });

    it('devrait appliquer 20% pour la tranche > 10M', () => {
      const salaire = 15000000; // 15M GNF
      const cnss = 250000; // 5% plafonné à 5M
      const ipr = calculerIPR(salaire, cnss);
      
      // Base imposable = 15M - 250K = 14.75M
      // 0-3M: 0%
      // 3M-5M: 2M * 10% = 200K
      // 5M-10M: 5M * 15% = 750K
      // 10M-14.75M: 4.75M * 20% = 950K
      // Total = 1.9M
      expect(ipr).toBe(1900000);
    });
  });

  describe('calculerPaieComplete', () => {
    it('devrait calculer une paie complète correctement', () => {
      const salaireBase = 5000000; // 5M GNF
      const result = calculerPaieComplete(salaireBase);
      
      // Salaire brut = 5M
      expect(result.salaireBrut).toBe(5000000);
      
      // CNSS Employé = 5% de 5M = 250K
      expect(result.cnssEmploye).toBe(250000);
      
      // CNSS Patron = 18% de 5M = 900K
      expect(result.cnssPatronal).toBe(900000);
      
      // Base imposable = 5M - 250K = 4.75M
      expect(result.baseImposable).toBe(4750000);
      
      // IPR = (4.75M - 3M) * 10% = 175K
      expect(result.ipr).toBe(175000);
      
      // Net = 5M - 250K - 175K = 4.575M
      expect(result.salaireNet).toBe(4575000);
    });

    it('devrait inclure les indemnités et primes', () => {
      const salaireBase = 3000000;
      const indemnites = 500000;
      const primes = 200000;
      
      const result = calculerPaieComplete(salaireBase, { indemnites, primes });
      
      // Brut = 3M + 500K + 200K = 3.7M
      expect(result.salaireBrut).toBe(3700000);
      
      // CNSS Employé = 5% de 3.7M = 185K
      expect(result.cnssEmploye).toBe(185000);
    });

    it('devrait déduire les autres déductions', () => {
      const salaireBase = 4000000;
      const autresDeductions = 100000;
      
      const result = calculerPaieComplete(salaireBase, { autresDeductions });
      
      // Net = Brut - CNSS - IPR - Autres
      const expectedNet = result.salaireBrut - result.cnssEmploye - result.ipr - autresDeductions;
      expect(result.salaireNet).toBe(expectedNet);
    });
  });

  describe('genererBulletinDetails', () => {
    it('devrait générer les détails du bulletin', () => {
      const salaireBase = 4500000;
      const indemnites = 300000;
      const primes = 100000;
      
      const details = genererBulletinDetails(salaireBase, { indemnites, primes });
      
      // Vérifier les gains
      const gains = details.filter(d => d.type === 'gain');
      expect(gains.length).toBe(3); // Salaire base + indemnités + primes
      expect(gains.find(d => d.libelle === 'Salaire de base')?.montant).toBe(4500000);
      expect(gains.find(d => d.libelle === 'Indemnités')?.montant).toBe(300000);
      expect(gains.find(d => d.libelle === 'Primes')?.montant).toBe(100000);
      
      // Vérifier les retenues
      const retenues = details.filter(d => d.type === 'retenue');
      expect(retenues.length).toBeGreaterThanOrEqual(2); // CNSS + IPR
      
      // Vérifier les cotisations patronales
      const patronales = details.filter(d => d.type === 'patronal');
      expect(patronales.length).toBe(1);
      expect(patronales[0].libelle).toContain('Patronal');
    });
  });

  describe('calculerMasseSalariale', () => {
    it('devrait calculer la masse salariale pour plusieurs employés', () => {
      const employes = [
        { salaireBase: 3000000 },
        { salaireBase: 4000000 },
        { salaireBase: 5000000, indemnites: 200000 },
      ];
      
      const result = calculerMasseSalariale(employes);
      
      // Masse brute = 3M + 4M + 5.2M = 12.2M
      expect(result.masseSalarialeBrute).toBe(12200000);
      
      // Vérifier que les totaux sont cohérents
      expect(result.masseSalarialeNette).toBeLessThan(result.masseSalarialeBrute);
      expect(result.cotisationsPatronales).toBeGreaterThan(0);
      expect(result.coutTotalEmployeur).toBe(
        result.masseSalarialeBrute + result.cotisationsPatronales
      );
    });
  });

  describe('Cas limites', () => {
    it('devrait gérer un salaire très élevé', () => {
      const salaire = 50000000; // 50M GNF
      const result = calculerPaieComplete(salaire);
      
      // CNSS plafonnée à 5M
      expect(result.cnssEmploye).toBe(250000);
      expect(result.cnssPatronal).toBe(900000);
      
      // IPR sur la base imposable complète
      expect(result.ipr).toBeGreaterThan(0);
    });

    it('devrait gérer un salaire minimum', () => {
      const salaire = 500000; // 500K GNF
      const result = calculerPaieComplete(salaire);
      
      // CNSS = 5% de 500K = 25K
      expect(result.cnssEmploye).toBe(25000);
      
      // IPR = 0 (base imposable < 3M)
      expect(result.ipr).toBe(0);
      
      // Net = 500K - 25K = 475K
      expect(result.salaireNet).toBe(475000);
    });
  });
});
