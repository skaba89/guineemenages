/**
 * @fileoverview Configuration multi-pays pour les calculs de paie
 * 
 * Ce module définit les configurations fiscales et sociales pour les pays
 * de la sous-région ouest-africaine supportés par GuinéaManager.
 * 
 * @module countries
 * @author GuinéaManager Team
 * @version 2.0.0
 */

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

/**
 * Tranche d'imposition progressive
 */
export interface TrancheImposition {
  max: number;      // Montant maximum de la tranche en centimes
  taux: number;     // Taux d'imposition (0.1 = 10%)
}

/**
 * Configuration des cotisations sociales
 */
export interface CotisationsSociales {
  /** Nom de l'organisme de sécurité sociale */
  organisme: string;
  /** Taux de cotisation employé (ex: 0.05 = 5%) */
  tauxEmploye: number;
  /** Taux de cotisation employeur (ex: 0.18 = 18%) */
  tauxEmployeur: number;
  /** Plafond de la base de calcul en centimes (null = pas de plafond) */
  plafond: number | null;
  /** Description des prestations couvertes */
  prestations: string[];
}

/**
 * Configuration des impôts sur le revenu
 */
export interface ImpotRevenu {
  /** Nom de l'impôt */
  nom: string;
  /** Barème progressif par tranches */
  tranches: TrancheImposition[];
  /** Abattement forfaitaire en centimes */
  abattement: number;
  /** Déductible des cotisations sociales */
  deduireCotisations: boolean;
}

/**
 * Configuration des taxes sur salaires
 */
export interface TaxeSalariale {
  nom: string;
  taux: number;
  base: 'brut' | 'net';
  plafond: number | null;
}

/**
 * Configuration d'un pays
 */
export interface ConfigurationPays {
  /** Code ISO 3166-1 alpha-2 du pays */
  code: string;
  /** Nom du pays en français */
  nom: string;
  /** Devise locale */
  devise: string;
  /** Code ISO 4217 de la devise */
  codeDevise: string;
  /** Symbole de la devise */
  symboleDevise: string;
  /** Cotisations sociales */
  cotisations: CotisationsSociales;
  /** Impôt sur le revenu */
  impotRevenu: ImpotRevenu;
  /** Taxes salariales additionnelles */
  taxesAdditionnelles: TaxeSalariale[];
  /** Taux de TVA par défaut */
  tvaDefaut: number;
  /** Langue principale */
  langue: string;
  /** Format de date */
  formatDate: string;
  /** Fuseau horaire */
  fuseauHoraire: string;
  /** Préfixe téléphonique international */
  indicatifTelephonique: string;
  /** Moyens de paiement mobile disponibles */
  mobileMoney: string[];
}

// ============================================================================
// CONFIGURATIONS PAR PAYS
// ============================================================================

/**
 * Configuration complète pour la Guinée
 */
export const GUINEE: ConfigurationPays = {
  code: 'GN',
  nom: 'Guinée',
  devise: 'Franc Guinéen',
  codeDevise: 'GNF',
  symboleDevise: 'GNF',
  cotisations: {
    organisme: 'CNSS (Caisse Nationale de Sécurité Sociale)',
    tauxEmploye: 0.05,      // 5%
    tauxEmployeur: 0.18,    // 18%
    plafond: 5_000_000_00,  // 5 000 000 GNF
    prestations: [
      'Allocations familiales',
      'Prestations maternité',
      'Pensions de retraite',
      'Risques professionnels',
      'Assurance invalidité'
    ]
  },
  impotRevenu: {
    nom: 'IPR (Impôt sur le Revenu des Personnes Physiques)',
    tranches: [
      { max: 3_000_000_00, taux: 0.00 },     // 0-3M GNF: 0%
      { max: 5_000_000_00, taux: 0.10 },     // 3-5M GNF: 10%
      { max: 10_000_000_00, taux: 0.15 },    // 5-10M GNF: 15%
      { max: Infinity, taux: 0.20 }          // >10M GNF: 20%
    ],
    abattement: 0,
    deduireCotisations: true
  },
  taxesAdditionnelles: [],
  tvaDefaut: 0.18,  // 18%
  langue: 'fr',
  formatDate: 'DD/MM/YYYY',
  fuseauHoraire: 'Africa/Conakry',
  indicatifTelephonique: '+224',
  mobileMoney: ['Orange Money', 'MTN Money']
};

/**
 * Configuration complète pour le Sénégal
 */
export const SENEGAL: ConfigurationPays = {
  code: 'SN',
  nom: 'Sénégal',
  devise: 'Franc CFA',
  codeDevise: 'XOF',
  symboleDevise: 'FCFA',
  cotisations: {
    organisme: 'CSS/IPRES (Caisse de Sécurité Sociale / Institut de Prévoyance Retraite)',
    tauxEmploye: 0.056,     // 5.6% (IPRES 4% + CSS 1.6%)
    tauxEmployeur: 0.209,   // 20.9% (IPRES 8.4% + CSS 12.5%)
    plafond: 350_000_00,    // 350 000 FCFA (plafond IPRES)
    prestations: [
      'Allocations familiales',
      'Prestations maternité',
      'Pensions de retraite',
      'Accidents de travail',
      'Assurance maladie'
    ]
  },
  impotRevenu: {
    nom: 'IR (Impôt sur le Revenu)',
    tranches: [
      { max: 63_000_00, taux: 0.00 },        // 0-63 000 FCFA: 0%
      { max: 150_000_00, taux: 0.20 },       // 63-150K FCFA: 20%
      { max: 350_000_00, taux: 0.30 },       // 150-350K FCFA: 30%
      { max: 800_000_00, taux: 0.35 },       // 350-800K FCFA: 35%
      { max: Infinity, taux: 0.40 }          // >800K FCFA: 40%
    ],
    abattement: 15_000_00,  // 15 000 FCFA pour charges familiales
    deduireCotisations: true
  },
  taxesAdditionnelles: [
    {
      nom: 'Contribution Forfaitaire à la Charge des Employeurs (CFCE)',
      taux: 0.03,  // 3%
      base: 'brut',
      plafond: null
    },
    {
      nom: 'Taxe de Formation Professionnelle',
      taux: 0.01,  // 1%
      base: 'brut',
      plafond: null
    }
  ],
  tvaDefaut: 0.18,  // 18%
  langue: 'fr',
  formatDate: 'DD/MM/YYYY',
  fuseauHoraire: 'Africa/Dakar',
  indicatifTelephonique: '+221',
  mobileMoney: ['Orange Money', 'Wave', 'Free Money']
};

/**
 * Configuration complète pour le Mali
 */
export const MALI: ConfigurationPays = {
  code: 'ML',
  nom: 'Mali',
  devise: 'Franc CFA',
  codeDevise: 'XOF',
  symboleDevise: 'FCFA',
  cotisations: {
    organisme: 'INPS (Institut National de Prévoyance Sociale)',
    tauxEmploye: 0.04,      // 4%
    tauxEmployeur: 0.176,   // 17.6%
    plafond: 500_000_00,    // 500 000 FCFA
    prestations: [
      'Allocations familiales',
      'Prestations maternité',
      'Pensions de retraite',
      'Risques professionnels'
    ]
  },
  impotRevenu: {
    nom: 'IR (Impôt sur le Revenu)',
    tranches: [
      { max: 150_000_00, taux: 0.00 },       // 0-150K FCFA: 0%
      { max: 300_000_00, taux: 0.10 },       // 150-300K FCFA: 10%
      { max: 500_000_00, taux: 0.20 },       // 300-500K FCFA: 20%
      { max: 1_000_000_00, taux: 0.30 },     // 500K-1M FCFA: 30%
      { max: Infinity, taux: 0.40 }          // >1M FCFA: 40%
    ],
    abattement: 10_000_00,  // 10 000 FCFA
    deduireCotisations: true
  },
  taxesAdditionnelles: [
    {
      nom: 'Taxe de Formation Professionnelle',
      taux: 0.02,  // 2%
      base: 'brut',
      plafond: null
    }
  ],
  tvaDefaut: 0.18,  // 18%
  langue: 'fr',
  formatDate: 'DD/MM/YYYY',
  fuseauHoraire: 'Africa/Bamako',
  indicatifTelephonique: '+223',
  mobileMoney: ['Orange Money', 'Moov Money']
};

/**
 * Configuration complète pour la Côte d'Ivoire
 */
export const COTE_DIVOIRE: ConfigurationPays = {
  code: 'CI',
  nom: 'Côte d\'Ivoire',
  devise: 'Franc CFA',
  codeDevise: 'XOF',
  symboleDevise: 'FCFA',
  cotisations: {
    organisme: 'CNPS (Caisse Nationale de Prévoyance Sociale)',
    tauxEmploye: 0.063,     // 6.3%
    tauxEmployeur: 0.117,   // 11.7%
    plafond: 480_000_00,    // 480 000 FCFA
    prestations: [
      'Allocations familiales',
      'Prestations maternité',
      'Pensions de retraite',
      'Accidents de travail',
      'Assurance maladie'
    ]
  },
  impotRevenu: {
    nom: 'IR (Impôt sur le Revenu)',
    tranches: [
      { max: 75_000_00, taux: 0.00 },        // 0-75K FCFA: 0%
      { max: 165_000_00, taux: 0.10 },       // 75-165K FCFA: 10%
      { max: 285_000_00, taux: 0.15 },       // 165-285K FCFA: 15%
      { max: 405_000_00, taux: 0.20 },       // 285-405K FCFA: 20%
      { max: 555_000_00, taux: 0.25 },       // 405-555K FCFA: 25%
      { max: 755_000_00, taux: 0.30 },       // 555-755K FCFA: 30%
      { max: 1_105_000_00, taux: 0.35 },     // 755K-1.1M FCFA: 35%
      { max: Infinity, taux: 0.40 }          // >1.1M FCFA: 40%
    ],
    abattement: 20_000_00,  // 20 000 FCFA
    deduireCotisations: true
  },
  taxesAdditionnelles: [
    {
      nom: 'Contribution Nationale (CN)',
      taux: 0.01,  // 1%
      base: 'net',
      plafond: null
    }
  ],
  tvaDefaut: 0.18,  // 18%
  langue: 'fr',
  formatDate: 'DD/MM/YYYY',
  fuseauHoraire: 'Africa/Abidjan',
  indicatifTelephonique: '+225',
  mobileMoney: ['Orange Money', 'MTN Money', 'Moov Money', 'Wave']
};

/**
 * Configuration complète pour le Burkina Faso
 */
export const BURKINA_FASO: ConfigurationPays = {
  code: 'BF',
  nom: 'Burkina Faso',
  devise: 'Franc CFA',
  codeDevise: 'XOF',
  symboleDevise: 'FCFA',
  cotisations: {
    organisme: 'CNSS (Caisse Nationale de Sécurité Sociale)',
    tauxEmploye: 0.055,     // 5.5%
    tauxEmployeur: 0.164,   // 16.4%
    plafond: 600_000_00,    // 600 000 FCFA
    prestations: [
      'Allocations familiales',
      'Prestations maternité',
      'Pensions de retraite',
      'Accidents de travail',
      'Assurance invalidité'
    ]
  },
  impotRevenu: {
    nom: 'IR (Impôt sur le Revenu)',
    tranches: [
      { max: 100_000_00, taux: 0.00 },       // 0-100K FCFA: 0%
      { max: 200_000_00, taux: 0.12 },       // 100-200K FCFA: 12%
      { max: 350_000_00, taux: 0.20 },       // 200-350K FCFA: 20%
      { max: 600_000_00, taux: 0.30 },       // 350-600K FCFA: 30%
      { max: Infinity, taux: 0.40 }          // >600K FCFA: 40%
    ],
    abattement: 12_000_00,  // 12 000 FCFA
    deduireCotisations: true
  },
  taxesAdditionnelles: [
    {
      nom: 'Taxe de Formation Professionnelle',
      taux: 0.01,  // 1%
      base: 'brut',
      plafond: null
    }
  ],
  tvaDefaut: 0.18,  // 18%
  langue: 'fr',
  formatDate: 'DD/MM/YYYY',
  fuseauHoraire: 'Africa/Ouagadougou',
  indicatifTelephonique: '+226',
  mobileMoney: ['Orange Money', 'Moov Money']
};

/**
 * Configuration pour le Bénin
 */
export const BENIN: ConfigurationPays = {
  code: 'BJ',
  nom: 'Bénin',
  devise: 'Franc CFA',
  codeDevise: 'XOF',
  symboleDevise: 'FCFA',
  cotisations: {
    organisme: 'CNSS (Caisse Nationale de Sécurité Sociale)',
    tauxEmploye: 0.036,     // 3.6%
    tauxEmployeur: 0.134,   // 13.4%
    plafond: 600_000_00,    // 600 000 FCFA
    prestations: [
      'Allocations familiales',
      'Prestations maternité',
      'Pensions de retraite',
      'Accidents de travail'
    ]
  },
  impotRevenu: {
    nom: 'IR (Impôt sur le Revenu)',
    tranches: [
      { max: 100_000_00, taux: 0.00 },       // 0-100K FCFA: 0%
      { max: 250_000_00, taux: 0.15 },       // 100-250K FCFA: 15%
      { max: 500_000_00, taux: 0.25 },       // 250-500K FCFA: 25%
      { max: Infinity, taux: 0.35 }          // >500K FCFA: 35%
    ],
    abattement: 15_000_00,
    deduireCotisations: true
  },
  taxesAdditionnelles: [],
  tvaDefaut: 0.18,
  langue: 'fr',
  formatDate: 'DD/MM/YYYY',
  fuseauHoraire: 'Africa/Porto-Novo',
  indicatifTelephonique: '+229',
  mobileMoney: ['MTN Money', 'Moov Money']
};

/**
 * Configuration pour le Niger
 */
export const NIGER: ConfigurationPays = {
  code: 'NE',
  nom: 'Niger',
  devise: 'Franc CFA',
  codeDevise: 'XOF',
  symboleDevise: 'FCFA',
  cotisations: {
    organisme: 'CNSS (Caisse Nationale de Sécurité Sociale)',
    tauxEmploye: 0.04,      // 4%
    tauxEmployeur: 0.164,   // 16.4%
    plafond: 400_000_00,    // 400 000 FCFA
    prestations: [
      'Allocations familiales',
      'Prestations maternité',
      'Pensions de retraite',
      'Accidents de travail'
    ]
  },
  impotRevenu: {
    nom: 'IR (Impôt sur le Revenu)',
    tranches: [
      { max: 100_000_00, taux: 0.00 },       // 0-100K FCFA: 0%
      { max: 200_000_00, taux: 0.15 },       // 100-200K FCFA: 15%
      { max: 400_000_00, taux: 0.25 },       // 200-400K FCFA: 25%
      { max: Infinity, taux: 0.40 }          // >400K FCFA: 40%
    ],
    abattement: 10_000_00,
    deduireCotisations: true
  },
  taxesAdditionnelles: [],
  tvaDefaut: 0.18,
  langue: 'fr',
  formatDate: 'DD/MM/YYYY',
  fuseauHoraire: 'Africa/Niamey',
  indicatifTelephonique: '+227',
  mobileMoney: ['Airtel Money', 'Moov Money']
};

// ============================================================================
// REGISTRE DES PAYS
// ============================================================================

/**
 * Registre de tous les pays supportés
 */
export const PAYS_SUPPORTES: Record<string, ConfigurationPays> = {
  'GN': GUINEE,
  'Guinée': GUINEE,
  'SN': SENEGAL,
  'Sénégal': SENEGAL,
  'ML': MALI,
  'Mali': MALI,
  'CI': COTE_DIVOIRE,
  'Côte d\'Ivoire': COTE_DIVOIRE,
  'BF': BURKINA_FASO,
  'Burkina Faso': BURKINA_FASO,
  'BJ': BENIN,
  'Bénin': BENIN,
  'NE': NIGER,
  'Niger': NIGER
};

/**
 * Liste des pays pour l'affichage
 */
export const LISTE_PAYS = [
  { code: 'GN', nom: 'Guinée', devise: 'GNF' },
  { code: 'SN', nom: 'Sénégal', devise: 'XOF' },
  { code: 'ML', nom: 'Mali', devise: 'XOF' },
  { code: 'CI', nom: 'Côte d\'Ivoire', devise: 'XOF' },
  { code: 'BF', nom: 'Burkina Faso', devise: 'XOF' },
  { code: 'BJ', nom: 'Bénin', devise: 'XOF' },
  { code: 'NE', nom: 'Niger', devise: 'XOF' }
];

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Récupère la configuration d'un pays par son code ou nom
 */
export function getConfigPays(codeOuNom: string): ConfigurationPays | null {
  return PAYS_SUPPORTES[codeOuNom] || null;
}

/**
 * Récupère la configuration par défaut (Guinée)
 */
export function getConfigParDefaut(): ConfigurationPays {
  return GUINEE;
}

/**
 * Vérifie si un pays est supporté
 */
export function estPaysSupporte(codeOuNom: string): boolean {
  return codeOuNom in PAYS_SUPPORTES;
}

/**
 * Formate un montant selon la devise du pays
 */
export function formaterMontant(montantCentimes: number, codePays: string): string {
  const config = getConfigPays(codePays) || getConfigParDefaut();
  const montant = montantCentimes / 100;
  
  return new Intl.NumberFormat('fr-' + config.code, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(montant) + ' ' + config.symboleDevise;
}
