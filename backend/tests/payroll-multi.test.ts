/**
 * @fileoverview Tests unitaires pour les calculs de paie multi-pays
 * 
 * Ce module teste les fonctions de calcul de paie pour tous les pays supportés:
 * - Guinée (GNF, IPR, CNSS)
 * - Sénégal (XOF, IR, CSS/IPRES)
 * - Mali (XOF, IR, INPS)
 * - Côte d'Ivoire (XOF, IR, CNPS)
 * - Burkina Faso (XOF, IR, CNSS)
 * - Bénin (XOF, IR, CNSS)
 * - Niger (XOF, IR, CNSS)
 * 
 * @module payroll-multi.test
 * @author GuinéaManager Team
 * @version 2.0.0
 */

import {
  calculerCotisationsSociales,
  calculerImpotRevenu,
  calculerPaieComplete,
  calculerMasseSalariale,
  formaterMontant
} from '../src/utils/payroll-multi';
import {
  GUINEE,
  SENEGAL,
  MALI,
  COTE_DIVOIRE,
  BURKINA_FASO,
  BENIN,
  NIGER,
  getConfigPays,
  LISTE_PAYS
} from '../src/config/countries';

// ============================================================================
// TESTS CONFIGURATION PAYS
// ============================================================================

describe('Configuration des pays', () => {
  test('Tous les pays supportés doivent avoir une configuration valide', () => {
    LISTE_PAYS.forEach(pays => {
      const config = getConfigPays(pays.code);
      expect(config).not.toBeNull();
      expect(config?.nom).toBe(pays.nom);
      expect(config?.code).toBe(pays.code);
      expect(config?.devise).toBe(pays.devise);
    });
  });

  test('Guinée doit utiliser GNF comme devise', () => {
    expect(GUINEE.codeDevise).toBe('GNF');
    expect(GUINEE.symboleDevise).toBe('GNF');
  });

  test('Les pays de la zone CFA doivent utiliser XOF', () => {
    [SENEGAL, MALI, COTE_DIVOIRE, BURKINA_FASO, BENIN, NIGER].forEach(pays => {
      expect(pays.codeDevise).toBe('XOF');
      expect(pays.symboleDevise).toBe('FCFA');
    });
  });

  test('getConfigPays retourne null pour un pays non supporté', () => {
    expect(getConfigPays('XX')).toBeNull();
    expect(getConfigPays('PaysInexistant')).toBeNull();
  });
});

// ============================================================================
// TESTS COTISATIONS SOCIALES
// ============================================================================

describe('Calcul des cotisations sociales', () => {
  test('Guinée: CNSS avec plafond de 5M GNF', () => {
    // Salaire en dessous du plafond
    const result1 = calculerCotisationsSociales(3_000_000_00, GUINEE);
    expect(result1.base).toBe(3_000_000_00);
    expect(result1.employe).toBe(150_000_00); // 3M * 5%
    expect(result1.employeur).toBe(540_000_00); // 3M * 18%

    // Salaire au-dessus du plafond
    const result2 = calculerCotisationsSociales(8_000_000_00, GUINEE);
    expect(result2.base).toBe(5_000_000_00); // Plafonné à 5M
    expect(result2.employe).toBe(250_000_00); // 5M * 5%
    expect(result2.employeur).toBe(900_000_00); // 5M * 18%
  });

  test('Sénégal: CSS/IPRES avec plafond de 350K FCFA', () => {
    const result = calculerCotisationsSociales(500_000_00, SENEGAL);
    expect(result.base).toBe(350_000_00); // Plafonné
    expect(result.employe).toBeCloseTo(350_000_00 * 0.056); // CSS + IPRES employé
    expect(result.employeur).toBeCloseTo(350_000_00 * 0.209); // CSS + IPRES employeur
  });

  test('Côte d\'Ivoire: CNPS avec plafond de 480K FCFA', () => {
    const result = calculerCotisationsSociales(600_000_00, COTE_DIVOIRE);
    expect(result.base).toBe(480_000_00); // Plafonné
    expect(result.employe).toBeCloseTo(480_000_00 * 0.063);
    expect(result.employeur).toBeCloseTo(480_000_00 * 0.117);
  });

  test('Mali: INPS avec plafond de 500K FCFA', () => {
    const result = calculerCotisationsSociales(400_000_00, MALI);
    expect(result.base).toBe(400_000_00);
    expect(result.employe).toBeCloseTo(400_000_00 * 0.04);
    expect(result.employeur).toBeCloseTo(400_000_00 * 0.176);
  });

  test('Burkina Faso: CNSS avec plafond de 600K FCFA', () => {
    const result = calculerCotisationsSociales(800_000_00, BURKINA_FASO);
    expect(result.base).toBe(600_000_00); // Plafonné
    expect(result.employe).toBeCloseTo(600_000_00 * 0.055);
    expect(result.employeur).toBeCloseTo(600_000_00 * 0.164);
  });

  test('Bénin: CNSS avec plafond de 600K FCFA', () => {
    const result = calculerCotisationsSociales(500_000_00, BENIN);
    expect(result.base).toBe(500_000_00);
    expect(result.employe).toBeCloseTo(500_000_00 * 0.036);
    expect(result.employeur).toBeCloseTo(500_000_00 * 0.134);
  });

  test('Niger: CNSS avec plafond de 400K FCFA', () => {
    const result = calculerCotisationsSociales(500_000_00, NIGER);
    expect(result.base).toBe(400_000_00); // Plafonné
    expect(result.employe).toBeCloseTo(400_000_00 * 0.04);
    expect(result.employeur).toBeCloseTo(400_000_00 * 0.164);
  });
});

// ============================================================================
// TESTS IMPÔT SUR LE REVENU
// ============================================================================

describe('Calcul de l\'impôt sur le revenu', () => {
  describe('Guinée - IPR', () => {
    test('Salaire en dessous de 3M GNF: 0% d\'impôt', () => {
      const result = calculerImpotRevenu(2_500_000_00, GUINEE);
      expect(result.impot).toBe(0);
    });

    test('Salaire entre 3M et 5M GNF: 10% sur la tranche', () => {
      // Base imposable de 4M GNF
      const result = calculerImpotRevenu(4_000_000_00, GUINEE);
      // 0-3M: 0%, 3M-4M: 10% = 100K GNF
      expect(result.impot).toBe(100_000_00);
    });

    test('Salaire entre 5M et 10M GNF: tranches cumulées', () => {
      // Base imposable de 8M GNF
      const result = calculerImpotRevenu(8_000_000_00, GUINEE);
      // 0-3M: 0, 3-5M: 200K (2M * 10%), 5-8M: 450K (3M * 15%) = 650K
      expect(result.impot).toBe(650_000_00);
    });

    test('Salaire au-dessus de 10M GNF: toutes tranches', () => {
      // Base imposable de 15M GNF
      const result = calculerImpotRevenu(15_000_000_00, GUINEE);
      // 0-3M: 0, 3-5M: 200K, 5-10M: 750K, 10-15M: 1M = 1.95M
      expect(result.impot).toBe(1_950_000_00);
    });
  });

  describe('Sénégal - IR', () => {
    test('Salaire en dessous de 63K FCFA: 0%', () => {
      const result = calculerImpotRevenu(50_000_00, SENEGAL);
      expect(result.impot).toBe(0);
    });

    test('Salaire entre 63K et 150K FCFA: 20%', () => {
      const result = calculerImpotRevenu(100_000_00, SENEGAL);
      // 0-63K: 0, 63K-100K: 20% sur 37K = 7.4K
      expect(result.impot).toBeCloseTo(7_400_00, -3);
    });

    test('Tranche supérieure à 800K FCFA: 40%', () => {
      const result = calculerImpotRevenu(1_000_000_00, SENEGAL);
      expect(result.impot).toBeGreaterThan(0);
      expect(result.detail.length).toBeGreaterThan(0);
    });
  });

  describe('Côte d\'Ivoire - IR', () => {
    test('Salaire en dessous de 75K FCFA: 0%', () => {
      const result = calculerImpotRevenu(60_000_00, COTE_DIVOIRE);
      expect(result.impot).toBe(0);
    });

    test('Tranche à 40% pour hauts revenus', () => {
      const result = calculerImpotRevenu(2_000_000_00, COTE_DIVOIRE);
      expect(result.impot).toBeGreaterThan(0);
    });
  });

  describe('Mali - IR', () => {
    test('Salaire en dessous de 150K FCFA: 0%', () => {
      const result = calculerImpotRevenu(100_000_00, MALI);
      expect(result.impot).toBe(0);
    });

    test('Tranche à 40% pour revenus > 1M FCFA', () => {
      const result = calculerImpotRevenu(1_500_000_00, MALI);
      expect(result.impot).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// TESTS CALCUL COMPLET DE PAIE
// ============================================================================

describe('Calcul complet de paie', () => {
  test('Guinée: calcul complet avec heures supplémentaires', () => {
    const result = calculerPaieComplete({
      salaireBase: 5_000_000_00,
      heuresSupplementaires: 10,
      tauxHoraire: 50_000_00,
      primes: 200_000_00
    }, 'GN');

    expect(result.salaireBase).toBe(5_000_000_00);
    expect(result.montantHeuresSupp).toBe(500_000_00); // 10 * 50K
    expect(result.primes).toBe(200_000_00);
    expect(result.brutTotal).toBe(5_700_000_00);
    expect(result.cnssEmploye).toBe(250_000_00); // Plafonné à 5M * 5%
    expect(result.cnssEmployeur).toBe(900_000_00); // 5M * 18%
    expect(result.netAPayer).toBeGreaterThan(0);
    expect(result.coutTotalEmployeur).toBeGreaterThan(result.brutTotal);
  });

  test('Sénégal: calcul complet avec taxes additionnelles', () => {
    const result = calculerPaieComplete({
      salaireBase: 400_000_00
    }, 'SN');

    expect(result.brutTotal).toBe(400_000_00);
    expect(result.cnssEmploye).toBeGreaterThan(0);
    expect(result.taxesAdditionnelles.length).toBeGreaterThan(0);
    // Vérifier que CFCE est inclus
    const cfce = result.taxesAdditionnelles.find(t => t.nom.includes('CFCE'));
    expect(cfce).toBeDefined();
  });

  test('Côte d\'Ivoire: calcul avec contribution nationale', () => {
    const result = calculerPaieComplete({
      salaireBase: 500_000_00
    }, 'CI');

    expect(result.brutTotal).toBe(500_000_00);
    expect(result.cnssEmploye).toBeGreaterThan(0);
    // La contribution nationale de 1% sur le net
    expect(result.taxesAdditionnelles.length).toBeGreaterThan(0);
  });

  test(' acomptes sont correctement déduits', () => {
    const result = calculerPaieComplete({
      salaireBase: 5_000_000_00,
      acomptes: 1_000_000_00
    }, 'GN');

    expect(result.netAPayer).toBeLessThan(
      calculerPaieComplete({ salaireBase: 5_000_000_00 }, 'GN').netAPayer
    );
  });

  test('Parts fiscales affectent l\'abattement', () => {
    const result1 = calculerPaieComplete({
      salaireBase: 500_000_00
    }, 'SN', 1);

    const result2 = calculerPaieComplete({
      salaireBase: 500_000_00
    }, 'SN', 3); // 3 parts

    // Plus de parts = moins d'impôt
    expect(result2.impotRevenu).toBeLessThanOrEqual(result1.impotRevenu);
  });
});

// ============================================================================
// TESTS MASSE SALARIALE
// ============================================================================

describe('Calcul masse salariale', () => {
  test('Masse salariale avec plusieurs bulletins', () => {
    const bulletins = [
      { netAPayer: 2_000_000_00, coutTotalEmployeur: 2_500_000_00, brutTotal: 2_200_000_00 },
      { netAPayer: 3_000_000_00, coutTotalEmployeur: 3_600_000_00, brutTotal: 3_300_000_00 },
      { netAPayer: 4_000_000_00, coutTotalEmployeur: 4_800_000_00, brutTotal: 4_400_000_00 }
    ];

    const result = calculerMasseSalariale(bulletins);

    expect(result.totalNet).toBe(9_000_000_00);
    expect(result.totalCoutEmployeur).toBe(10_900_000_00);
    expect(result.nombreEmployes).toBe(3);
  });

  test('Masse salariale vide', () => {
    const result = calculerMasseSalariale([]);
    expect(result.totalNet).toBe(0);
    expect(result.totalCoutEmployeur).toBe(0);
    expect(result.nombreEmployes).toBe(0);
  });
});

// ============================================================================
// TESTS FORMATAGE
// ============================================================================

describe('Formatage des montants', () => {
  test('Format GNF pour la Guinée', () => {
    const result = formaterMontant(1_500_000_00, 'GN');
    expect(result).toContain('GNF');
    expect(result).toContain('1 500 000');
  });

  test('Format FCFA pour le Sénégal', () => {
    const result = formaterMontant(150_000_00, 'SN');
    expect(result).toContain('FCFA');
  });

  test('Format FCFA pour la Côte d\'Ivoire', () => {
    const result = formaterMontant(200_000_00, 'CI');
    expect(result).toContain('FCFA');
  });
});

// ============================================================================
// TESTS EDGE CASES
// ============================================================================

describe('Cas limites', () => {
  test('Salaire nul', () => {
    const result = calculerPaieComplete({ salaireBase: 0 }, 'GN');
    expect(result.brutTotal).toBe(0);
    expect(result.netAPayer).toBe(0);
  });

  test('Heures supplémentaires sans taux horaire', () => {
    const result = calculerPaieComplete({
      salaireBase: 3_000_000_00,
      heuresSupplementaires: 10
    }, 'GN');
    expect(result.montantHeuresSupp).toBe(0);
  });

  test('Toutes les retenues à 0', () => {
    const result = calculerPaieComplete({
      salaireBase: 2_000_000_00 // En dessous du seuil d'imposition
    }, 'GN');
    
    expect(result.impotRevenu).toBe(0);
    expect(result.cnssEmploye).toBe(100_000_00); // 5% de 2M
    expect(result.netAPayer).toBeGreaterThan(0);
  });

  test('Très haut salaire', () => {
    const result = calculerPaieComplete({
      salaireBase: 100_000_000_00 // 100M GNF
    }, 'GN');

    // CNSS plafonnée à 5M
    expect(result.cnssEmploye).toBe(250_000_00);
    // IPR élevé
    expect(result.impotRevenu).toBeGreaterThan(0);
  });
});
