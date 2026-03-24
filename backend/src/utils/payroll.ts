/**
 * @fileoverview Module de calculs de paie pour la Guinée
 * 
 * Ce module implémente les calculs de paie conformément à la législation guinéenne,
 * incluant les cotisations CNSS et l'Impôt sur le Revenu des Personnes Physiques (IPR).
 * 
 * @module payroll
 * @author GuinéaManager Team
 * @version 1.0.0
 * 
 * @description
 * Tous les montants sont exprimés en centimes (entiers) pour éviter
 * les problèmes de précision liés aux nombres à virgule flottante.
 * 
 * @example
 * // Calculer une paie complète
 * import { calculerPaieComplete, formatGNF } from './payroll';
 * 
 * const resultat = calculerPaieComplete({
 *   salaireBase: 500000_00, // 500 000 GNF en centimes
 *   primes: 50000_00,
 *   heuresSupplementaires: 10,
 *   tauxHoraire: 5000_00
 * });
 * 
 * console.log(formatGNF(resultat.netAPayer)); // "520 000 GNF"
 */

// ============================================================================
// CONSTANTES FISCALES ET SOCIALES - GUINÉE
// ============================================================================

/**
 * Plafond de la base de calcul CNSS en centimes.
 * @constant {number}
 * @default 5_000_000_00 (5 000 000 GNF)
 */
const PLAFOND_CNSS = 5_000_000_00;

/**
 * Taux de cotisation CNSS pour l'employé.
 * @constant {number}
 * @default 0.05 (5%)
 */
const TAUX_CNSS_EMPLOYE = 0.05;

/**
 * Taux de cotisation CNSS pour l'employeur.
 * @constant {number}
 * @default 0.18 (18%)
 */
const TAUX_CNSS_EMPLOYEUR = 0.18;

/**
 * Tranches du barème IPR (Impôt sur le Revenu des Personnes Physiques).
 * Les montants sont en centimes.
 * 
 * Barème progressif guinéen :
 * - 0 à 3 000 000 GNF : 0%
 * - 3 000 001 à 5 000 000 GNF : 10%
 * - 5 000 001 à 10 000 000 GNF : 15%
 * - Au-delà de 10 000 000 GNF : 20%
 * 
 * @constant {Array<{max: number, taux: number}>}
 */
const TRANCHES_IPR = [
  { max: 3_000_000_00, taux: 0.00 },     // 0-3M: 0%
  { max: 5_000_000_00, taux: 0.10 },     // 3-5M: 10%
  { max: 10_000_000_00, taux: 0.15 },    // 5-10M: 15%
  { max: Infinity, taux: 0.20 }          // >10M: 20%
];

// ============================================================================
// FONCTIONS DE CALCUL
// ============================================================================

/**
 * Calcule les cotisations CNSS (Caisse Nationale de Sécurité Sociale).
 * 
 * La cotisation CNSS est calculée sur le salaire brut plafonné à 5 000 000 GNF.
 * - Part employé : 5%
 * - Part employeur : 18%
 * 
 * @function calculerCNSS
 * @param {number} brutTotal - Salaire brut total en centimes
 * @returns {{employe: number, employeur: number}} Objet contenant les cotisations
 * @returns {number} returns.employe - Cotisation CNSS employé en centimes
 * @returns {number} returns.employeur - Cotisation CNSS employeur en centimes
 * 
 * @example
 * // Salaire brut de 4 000 000 GNF
 * const cnss = calculerCNSS(4_000_000_00);
 * // cnss.employe = 200_000_00 (200 000 GNF)
 * // cnss.employeur = 720_000_00 (720 000 GNF)
 * 
 * @example
 * // Salaire brut de 6 000 000 GNF (plafonné à 5M)
 * const cnss = calculerCNSS(6_000_000_00);
 * // cnss.employe = 250_000_00 (250 000 GNF)
 * // cnss.employeur = 900_000_00 (900 000 GNF)
 */
export function calculerCNSS(brutTotal: number): { employe: number; employeur: number } {
  const baseCalcul = Math.min(brutTotal, PLAFOND_CNSS);
  return {
    employe: Math.round(baseCalcul * TAUX_CNSS_EMPLOYE),
    employeur: Math.round(baseCalcul * TAUX_CNSS_EMPLOYEUR)
  };
}

/**
 * Calcule l'IPR (Impôt sur le Revenu des Personnes Physiques) selon le barème progressif.
 * 
 * L'IPR est calculé selon un barème progressif par tranches :
 * - Tranche 1 (0 - 3 000 000 GNF) : 0%
 * - Tranche 2 (3 000 001 - 5 000 000 GNF) : 10%
 * - Tranche 3 (5 000 001 - 10 000 000 GNF) : 15%
 * - Tranche 4 (au-delà de 10 000 000 GNF) : 20%
 * 
 * @function calculerIPR
 * @param {number} baseImposable - Base imposable en centimes (brut - CNSS employé)
 * @returns {number} Montant de l'IPR en centimes
 * 
 * @example
 * // Base imposable de 4 000 000 GNF
 * const ipr = calculerIPR(4_000_000_00);
 * // IPR = 0 sur les 3 premiers millions + 10% sur le reste (1M) = 100 000 GNF
 * // ipr = 100_000_00
 * 
 * @example
 * // Base imposable de 8 000 000 GNF
 * const ipr = calculerIPR(8_000_000_00);
 * // 0-3M: 0 | 3-5M: 200K | 5-8M: 450K = 650 000 GNF
 * // ipr = 650_000_00
 */
export function calculerIPR(baseImposable: number): number {
  if (baseImposable <= TRANCHES_IPR[0].max) {
    return 0;
  }

  let ipr = 0;
  let reste = baseImposable;
  let precedentMax = 0;

  for (const tranche of TRANCHES_IPR) {
    if (reste <= 0) break;
    
    const baseTranche = Math.min(reste, tranche.max - precedentMax);
    ipr += baseTranche * tranche.taux;
    reste -= baseTranche;
    precedentMax = tranche.max;
  }

  return Math.round(ipr);
}

/**
 * @typedef {Object} ParametresPaie
 * @property {number} salaireBase - Salaire de base mensuel en centimes
 * @property {number} [heuresSupplementaires=0] - Nombre d'heures supplémentaires
 * @property {number} [tauxHoraire=0] - Taux horaire en centimes
 * @property {number} [primes=0] - Total des primes en centimes
 * @property {number} [indemnites=0] - Total des indemnités en centimes
 * @property {number} [autresAvantages=0] - Autres avantages en nature en centimes
 * @property {number} [acomptes=0] - Acomptes déjà versés en centimes
 * @property {number} [autresRetenues=0] - Autres retenues en centimes
 */

/**
 * @typedef {Object} ResultatPaie
 * @property {number} brutTotal - Total des gains bruts en centimes
 * @property {number} cnssEmploye - Cotisation CNSS employé en centimes
 * @property {number} cnssEmployeur - Cotisation CNSS employeur en centimes
 * @property {number} ipr - Impôt sur le revenu en centimes
 * @property {number} netAPayer - Net à payer après déductions en centimes
 * @property {number} coutTotalEmployeur - Coût total pour l'employeur en centimes
 */

/**
 * Calcule un bulletin de paie complet selon la législation guinéenne.
 * 
 * Cette fonction effectue tous les calculs nécessaires pour établir un bulletin
 * de paie conforme à la réglementation guinéenne :
 * 
 * 1. Calcul du brut total (salaire base + heures supp + primes + indemnités + avantages)
 * 2. Calcul des cotisations CNSS (plafonnées à 5M GNF)
 * 3. Calcul de l'IPR sur la base imposable (brut - CNSS employé)
 * 4. Calcul du net à payer (brut - CNSS employé - IPR - acomptes - retenues)
 * 5. Calcul du coût total employeur (brut + CNSS employeur)
 * 
 * @function calculerPaieComplete
 * @param {ParametresPaie} params - Paramètres de calcul de la paie
 * @returns {ResultatPaie} Résultat complet du calcul de paie
 * 
 * @example
 * // Calcul de paie simple (salaire de base uniquement)
 * const resultat = calculerPaieComplete({
 *   salaireBase: 3_000_000_00 // 3 000 000 GNF
 * });
 * // resultat.netAPayer = 2_850_000_00 (après CNSS, IPR = 0)
 * 
 * @example
 * // Calcul de paie avec heures supplémentaires et primes
 * const resultat = calculerPaieComplete({
 *   salaireBase: 5_000_000_00,
 *   heuresSupplementaires: 20,
 *   tauxHoraire: 50_000_00, // 50 000 GNF/heure
 *   primes: 200_000_00,
 *   acomptes: 500_000_00
 * });
 */
export function calculerPaieComplete(params: {
  salaireBase: number;
  heuresSupplementaires?: number;
  tauxHoraire?: number;
  primes?: number;
  indemnites?: number;
  autresAvantages?: number;
  acomptes?: number;
  autresRetenues?: number;
}): {
  brutTotal: number;
  cnssEmploye: number;
  cnssEmployeur: number;
  ipr: number;
  netAPayer: number;
  coutTotalEmployeur: number;
} {
  const {
    salaireBase,
    heuresSupplementaires = 0,
    tauxHoraire = 0,
    primes = 0,
    indemnites = 0,
    autresAvantages = 0,
    acomptes = 0,
    autresRetenues = 0
  } = params;

  // Calcul du montant des heures supplémentaires
  const montantHeuresSupp = heuresSupplementaires * tauxHoraire;

  // Calcul du brut total (somme de tous les gains)
  const brutTotal = salaireBase + montantHeuresSupp + primes + indemnites + autresAvantages;

  // Calcul des cotisations CNSS
  const cnss = calculerCNSS(brutTotal);

  // Base imposable = Brut - CNSS Employé (déductible)
  const baseImposable = brutTotal - cnss.employe;

  // Calcul de l'IPR sur la base imposable
  const ipr = calculerIPR(baseImposable);

  // Net à payer = Brut - CNSS employé - IPR - Acomptes - Autres retenues
  const netAPayer = brutTotal - cnss.employe - ipr - acomptes - autresRetenues;

  // Coût total employeur = Brut + CNSS employeur
  const coutTotalEmployeur = brutTotal + cnss.employeur;

  return {
    brutTotal,
    cnssEmploye: cnss.employe,
    cnssEmployeur: cnss.employeur,
    ipr,
    netAPayer,
    coutTotalEmployeur
  };
}

/**
 * @typedef {Object} BulletinResume
 * @property {number} netAPayer - Net à payer en centimes
 * @property {number} coutTotalEmployeur - Coût total employeur en centimes
 */

/**
 * @typedef {Object} MasseSalariale
 * @property {number} totalNet - Total des nets à payer en centimes
 * @property {number} totalCoutEmployeur - Total des coûts employeur en centimes
 */

/**
 * Calcule la masse salariale totale à partir d'une liste de bulletins.
 * 
 * Cette fonction agrège les données de plusieurs bulletins de paie pour
 * obtenir les totaux de la masse salariale.
 * 
 * @function calculerMasseSalariale
 * @param {Array<BulletinResume>} bulletins - Liste des bulletins de paie
 * @returns {MasseSalariale} Totaux de la masse salariale
 * 
 * @example
 * const bulletins = [
 *   { netAPayer: 2_850_000_00, coutTotalEmployeur: 3_400_000_00 },
 *   { netAPayer: 3_200_000_00, coutTotalEmployeur: 3_800_000_00 }
 * ];
 * 
 * const masse = calculerMasseSalariale(bulletins);
 * // masse.totalNet = 6_050_000_00
 * // masse.totalCoutEmployeur = 7_200_000_00
 */
export function calculerMasseSalariale(bulletins: Array<{ netAPayer: number; coutTotalEmployeur: number }>): {
  totalNet: number;
  totalCoutEmployeur: number;
} {
  return bulletins.reduce((acc, b) => ({
    totalNet: acc.totalNet + b.netAPayer,
    totalCoutEmployeur: acc.totalCoutEmployeur + b.coutTotalEmployeur
  }), { totalNet: 0, totalCoutEmployeur: 0 });
}

/**
 * Formate un montant en centimes en chaîne GNF lisible.
 * 
 * Utilise le formatage locale français-guinée avec séparateur de milliers.
 * 
 * @function formatGNF
 * @param {number} montantCentimes - Montant en centimes
 * @returns {string} Montant formaté en GNF (ex: "1 500 000 GNF")
 * 
 * @example
 * formatGNF(1_500_000_00); // "1 500 000 GNF"
 * formatGNF(3_000_000_00); // "3 000 000 GNF"
 */
export function formatGNF(montantCentimes: number): string {
  const montantGNF = montantCentimes / 100;
  return new Intl.NumberFormat('fr-GN', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(montantGNF) + ' GNF';
}

/**
 * Standard monthly working hours (173.33 hours based on 2080 hours/year)
 */
export const STANDARD_MONTHLY_HOURS = 173.33;

/**
 * Calculate hourly rate from monthly salary
 * @param salaireMensuel - Monthly salary in centimes
 * @returns Hourly rate in centimes
 */
export function calculateHourlyRate(salaireMensuel: number): number {
  return Math.round(salaireMensuel / STANDARD_MONTHLY_HOURS);
}

/**
 * Alias for calculerPaieComplete (English naming) - use calculatePayrollExtended for full version
 */
export const calculatePayroll = calculerPaieComplete;

/**
 * Extended payroll calculation with additional fields
 */
export function calculatePayrollExtended(params: {
  salaireBase: number;
  heuresSupplementaires?: number;
  tauxHoraire?: number;
  primes?: number;
  indemnites?: number;
  autresAvantages?: number;
  acomptes?: number;
  autreRetenues?: number;
}): {
  salaireBase: number;
  brutTotal: number;
  cnssEmploye: number;
  cnssEmployeur: number;
  baseImposable: number;
  ipr: number;
  autresRetenues: number;
  acomptes: number;
  netAPayer: number;
  coutTotalEmployeur: number;
  montHeuresSupp: number;
  primes: number;
  indemnites: number;
  autresAvantages: number;
} {
  const result = calculerPaieComplete({
    salaireBase: params.salaireBase,
    heuresSupplementaires: params.heuresSupplementaires || 0,
    tauxHoraire: params.tauxHoraire || 0,
    primes: params.primes || 0,
    indemnites: params.indemnites || 0,
    autresAvantages: params.autresAvantages || 0,
    acomptes: params.acomptes || 0,
    autresRetenues: params.autreRetenues || 0,
  });

  return {
    salaireBase: params.salaireBase,
    brutTotal: result.brutTotal,
    cnssEmploye: result.cnssEmploye,
    cnssEmployeur: result.cnssEmployeur,
    baseImposable: result.brutTotal - result.cnssEmploye,
    ipr: result.ipr,
    autresRetenues: params.autreRetenues || 0,
    acomptes: params.acomptes || 0,
    netAPayer: result.netAPayer,
    coutTotalEmployeur: result.coutTotalEmployeur,
    montHeuresSupp: (params.heuresSupplementaires || 0) * (params.tauxHoraire || 0),
    primes: params.primes || 0,
    indemnites: params.indemnites || 0,
    autresAvantages: params.autresAvantages || 0,
  };
}
