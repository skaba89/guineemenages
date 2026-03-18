/**
 * @fileoverview Module de calculs de paie multi-pays
 * 
 * Ce module implémente les calculs de paie pour tous les pays supportés,
 * en utilisant les configurations fiscales définies dans countries.ts.
 * 
 * @module payroll-multi
 * @author GuinéaManager Team
 * @version 2.0.0
 */

import {
  ConfigurationPays,
  getConfigPays,
  getConfigParDefaut,
  formaterMontant
} from '../config/countries';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

/**
 * Paramètres pour le calcul de paie
 */
export interface ParametresPaie {
  /** Salaire de base mensuel en centimes */
  salaireBase: number;
  /** Nombre d'heures supplémentaires */
  heuresSupplementaires?: number;
  /** Taux horaire en centimes */
  tauxHoraire?: number;
  /** Total des primes en centimes */
  primes?: number;
  /** Total des indemnités en centimes */
  indemnites?: number;
  /** Autres avantages en nature en centimes */
  autresAvantages?: number;
  /** Acomptes déjà versés en centimes */
  acomptes?: number;
  /** Autres retenues en centimes */
  autresRetenues?: number;
  /** Nombre de parts fiscales (pour IR) */
  nombreParts?: number;
}

/**
 * Résultat détaillé du calcul de paie
 */
export interface ResultatPaie {
  /** Salaire de base */
  salaireBase: number;
  /** Montant heures supplémentaires */
  montantHeuresSupp: number;
  /** Primes */
  primes: number;
  /** Indemnités */
  indemnites: number;
  /** Autres avantages */
  autresAvantages: number;
  /** Total des gains bruts */
  brutTotal: number;
  /** Base de calcul CNSS (après plafond) */
  baseCNSS: number;
  /** Cotisation sociale employé */
  cotisationEmploye: number;
  /** Cotisation sociale employeur */
  cotisationEmployeur: number;
  /** Base imposable pour l'IR */
  baseImposable: number;
  /** Impôt sur le revenu */
  impotRevenu: number;
  /** Taxes salariales additionnelles */
  taxesAdditionnelles: Array<{
    nom: string;
    montant: number;
  }>;
  /** Total des retenues */
  totalRetenues: number;
  /** Net à payer */
  netAPayer: number;
  /** Coût total employeur */
  coutTotalEmployeur: number;
  /** Détail par tranche d'imposition */
  detailImpot?: Array<{
    tranche: string;
    base: number;
    taux: number;
    impot: number;
  }>;
}

/**
 * Résumé pour masse salariale
 */
export interface ResumeMasseSalariale {
  totalBrut: number;
  totalCotisationsEmploye: number;
  totalCotisationsEmployeur: number;
  totalImpots: number;
  totalNet: number;
  totalCoutEmployeur: number;
  nombreEmployes: number;
}

// ============================================================================
// FONCTIONS DE CALCUL
// ============================================================================

/**
 * Calcule les cotisations sociales selon la configuration du pays
 */
export function calculerCotisationsSociales(
  brutTotal: number,
  config: ConfigurationPays
): { base: number; employe: number; employeur: number } {
  const { cotisations } = config;
  
  // Appliquer le plafond si défini
  const base = cotisations.plafond 
    ? Math.min(brutTotal, cotisations.plafond) 
    : brutTotal;
  
  return {
    base,
    employe: Math.round(base * cotisations.tauxEmploye),
    employeur: Math.round(base * cotisations.tauxEmployeur)
  };
}

/**
 * Calcule l'impôt sur le revenu selon le barème du pays
 */
export function calculerImpotRevenu(
  baseImposable: number,
  config: ConfigurationPays,
  nombreParts: number = 1
): { impot: number; detail: Array<{ tranche: string; base: number; taux: number; impot: number }> } {
  const { impotRevenu } = config;
  const { tranches, abattement, deduireCotisations } = impotRevenu;
  
  // Appliquer l'abattement par part
  const abattementTotal = abattement * nombreParts;
  let baseCalcul = baseImposable - abattementTotal;
  
  if (baseCalcul <= 0) {
    return { impot: 0, detail: [] };
  }
  
  const detail: Array<{ tranche: string; base: number; taux: number; impot: number }> = [];
  let impot = 0;
  let reste = baseCalcul;
  let precedentMax = 0;
  
  for (const tranche of tranches) {
    if (reste <= 0) break;
    
    const montantTranche = tranche.max === Infinity 
      ? reste 
      : Math.min(reste, tranche.max - precedentMax);
    
    if (montantTranche > 0 && tranche.taux > 0) {
      const impotTranche = montantTranche * tranche.taux;
      impot += impotTranche;
      
      const precedentFormate = precedentMax / 100;
      const maxFormate = tranche.max === Infinity ? '∞' : (tranche.max / 100).toLocaleString('fr-FR');
      
      detail.push({
        tranche: `${precedentFormate.toLocaleString('fr-FR')} - ${maxFormate}`,
        base: montantTranche,
        taux: tranche.taux,
        impot: impotTranche
      });
    }
    
    reste -= montantTranche;
    precedentMax = tranche.max;
  }
  
  return { impot: Math.round(impot), detail };
}

/**
 * Calcule les taxes salariales additionnelles
 */
export function calculerTaxesAdditionnelles(
  brutTotal: number,
  netAPayer: number,
  config: ConfigurationPays
): Array<{ nom: string; montant: number }> {
  return config.taxesAdditionnelles.map(taxe => {
    const base = taxe.base === 'brut' ? brutTotal : netAPayer;
    const baseCalculee = taxe.plafond ? Math.min(base, taxe.plafond) : base;
    return {
      nom: taxe.nom,
      montant: Math.round(baseCalculee * taxe.taux)
    };
  });
}

/**
 * Calcule un bulletin de paie complet pour un pays donné
 */
export function calculerPaieComplete(
  params: ParametresPaie,
  codePays: string = 'GN'
): ResultatPaie {
  const config = getConfigPays(codePays) || getConfigParDefaut();
  
  const {
    salaireBase,
    heuresSupplementaires = 0,
    tauxHoraire = 0,
    primes = 0,
    indemnites = 0,
    autresAvantages = 0,
    acomptes = 0,
    autresRetenues = 0,
    nombreParts = 1
  } = params;
  
  // 1. Calcul du montant des heures supplémentaires
  const montantHeuresSupp = heuresSupplementaires * tauxHoraire;
  
  // 2. Calcul du brut total
  const brutTotal = salaireBase + montantHeuresSupp + primes + indemnites + autresAvantages;
  
  // 3. Calcul des cotisations sociales
  const cotisations = calculerCotisationsSociales(brutTotal, config);
  
  // 4. Calcul de la base imposable
  const baseImposable = config.impotRevenu.deduireCotisations
    ? brutTotal - cotisations.employe
    : brutTotal;
  
  // 5. Calcul de l'impôt sur le revenu
  const { impot: impotRevenu, detail: detailImpot } = calculerImpotRevenu(
    baseImposable,
    config,
    nombreParts
  );
  
  // 6. Net intermédiaire (avant taxes additionnelles)
  const netIntermediaire = brutTotal - cotisations.employe - impotRevenu - acomptes - autresRetenues;
  
  // 7. Calcul des taxes additionnelles
  const taxesAdditionnelles = calculerTaxesAdditionnelles(brutTotal, netIntermediaire, config);
  const totalTaxes = taxesAdditionnelles.reduce((sum, t) => sum + t.montant, 0);
  
  // 8. Net à payer final
  const netAPayer = netIntermediaire - totalTaxes;
  
  // 9. Coût total employeur
  const coutTotalEmployeur = brutTotal + cotisations.employeur + totalTaxes;
  
  // 10. Total des retenues
  const totalRetenues = cotisations.employe + impotRevenu + acomptes + autresRetenues + totalTaxes;
  
  return {
    salaireBase,
    montantHeuresSupp,
    primes,
    indemnites,
    autresAvantages,
    brutTotal,
    baseCNSS: cotisations.base,
    cotisationEmploye: cotisations.employe,
    cotisationEmployeur: cotisations.employeur,
    baseImposable,
    impotRevenu,
    taxesAdditionnelles,
    totalRetenues,
    netAPayer,
    coutTotalEmployeur,
    detailImpot
  };
}

/**
 * Calcule la masse salariale totale
 */
export function calculerMasseSalariale(
  bulletins: Array<{ netAPayer: number; coutTotalEmployeur: number; brutTotal: number }>
): ResumeMasseSalariale {
  if (bulletins.length === 0) {
    return {
      totalBrut: 0,
      totalCotisationsEmploye: 0,
      totalCotisationsEmployeur: 0,
      totalImpots: 0,
      totalNet: 0,
      totalCoutEmployeur: 0,
      nombreEmployes: 0
    };
  }
  
  return bulletins.reduce((acc, b) => ({
    totalBrut: acc.totalBrut + (b.brutTotal || 0),
    totalCotisationsEmploye: acc.totalCotisationsEmploye + 0,
    totalCotisationsEmployeur: acc.totalCotisationsEmployeur + 0,
    totalImpots: acc.totalImpots + 0,
    totalNet: acc.totalNet + b.netAPayer,
    totalCoutEmployeur: acc.totalCoutEmployeur + b.coutTotalEmployeur,
    nombreEmployes: acc.nombreEmployes + 1
  }), {
    totalBrut: 0,
    totalCotisationsEmploye: 0,
    totalCotisationsEmployeur: 0,
    totalImpots: 0,
    totalNet: 0,
    totalCoutEmployeur: 0,
    nombreEmployes: 0
  });
}

/**
 * Génère un rapport de cotisations sociales mensuelles
 */
export function genererRapportCotisations(
  bulletins: Array<{
    employe: { nom: string; prenom: string; matricule: string };
    brutTotal: number;
    cotisationEmploye: number;
    cotisationEmployeur: number;
  }>,
  config: ConfigurationPays
): {
  details: Array<{
    matricule: string;
    nom: string;
    brut: number;
    cotisationEmploye: number;
    cotisationEmployeur: number;
    total: number;
  }>;
  totaux: {
    totalBrut: number;
    totalCotisationEmploye: number;
    totalCotisationEmployeur: number;
    totalGeneral: number;
  };
  organisme: string;
} {
  const details = bulletins.map(b => ({
    matricule: b.employe.matricule,
    nom: `${b.employe.prenom} ${b.employe.nom}`,
    brut: b.brutTotal,
    cotisationEmploye: b.cotisationEmploye,
    cotisationEmployeur: b.cotisationEmployeur,
    total: b.cotisationEmploye + b.cotisationEmployeur
  }));
  
  const totaux = {
    totalBrut: details.reduce((sum, d) => sum + d.brut, 0),
    totalCotisationEmploye: details.reduce((sum, d) => sum + d.cotisationEmploye, 0),
    totalCotisationEmployeur: details.reduce((sum, d) => sum + d.cotisationEmployeur, 0),
    totalGeneral: details.reduce((sum, d) => sum + d.total, 0)
  };
  
  return {
    details,
    totaux,
    organisme: config.cotisations.organisme
  };
}

/**
 * Génère un rapport d'imposition annuelle
 */
export function genererRapportImposition(
  bulletins: Array<{
    employe: { nom: string; prenom: string; matricule: string };
    brutTotal: number;
    baseImposable: number;
    impotRevenu: number;
  }>,
  config: ConfigurationPays
): {
  details: Array<{
    matricule: string;
    nom: string;
    brutAnnuel: number;
    baseImposable: number;
    impot: number;
  }>;
  totaux: {
    totalBrut: number;
    totalBaseImposable: number;
    totalImpot: number;
  };
} {
  const details = bulletins.map(b => ({
    matricule: b.employe.matricule,
    nom: `${b.employe.prenom} ${b.employe.nom}`,
    brutAnnuel: b.brutTotal,
    baseImposable: b.baseImposable,
    impot: b.impotRevenu
  }));
  
  return {
    details,
    totaux: {
      totalBrut: details.reduce((sum, d) => sum + d.brutAnnuel, 0),
      totalBaseImposable: details.reduce((sum, d) => sum + d.baseImposable, 0),
      totalImpot: details.reduce((sum, d) => sum + d.impot, 0)
    }
  };
}

// Réexporter la fonction de formatage
export { formaterMontant };
