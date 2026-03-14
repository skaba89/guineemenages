/**
 * Calculs de paie pour la Guinée
 * Tous les montants sont en centimes (entiers) pour éviter les problèmes de précision float
 */

// Plafond CNSS : 5 000 000 GNF (en centimes)
const PLAFOND_CNSS = 5_000_000_00;

// Taux CNSS
const TAUX_CNSS_EMPLOYE = 0.05;  // 5%
const TAUX_CNSS_EMPLOYEUR = 0.18; // 18%

// Tranches IPR (en centimes)
const TRANCHES_IPR = [
  { max: 3_000_000_00, taux: 0.00 },     // 0-3M: 0%
  { max: 5_000_000_00, taux: 0.10 },     // 3-5M: 10%
  { max: 10_000_000_00, taux: 0.15 },    // 5-10M: 15%
  { max: Infinity, taux: 0.20 }          // >10M: 20%
];

/**
 * Calculer la cotisation CNSS
 */
export function calculerCNSS(brutTotal: number): { employe: number; employeur: number } {
  const baseCalcul = Math.min(brutTotal, PLAFOND_CNSS);
  return {
    employe: Math.round(baseCalcul * TAUX_CNSS_EMPLOYE),
    employeur: Math.round(baseCalcul * TAUX_CNSS_EMPLOYEUR)
  };
}

/**
 * Calculer l'IPR (Impôt sur le Revenu des Personnes Physiques)
 * Barème progressif guinéen
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
 * Calculer le bulletin de paie complet
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

  // Calcul du brut total
  const brutTotal = salaireBase + montantHeuresSupp + primes + indemnites + autresAvantages;

  // Calcul CNSS
  const cnss = calculerCNSS(brutTotal);

  // Base imposable = Brut - CNSS Employé
  const baseImposable = brutTotal - cnss.employe;

  // Calcul IPR
  const ipr = calculerIPR(baseImposable);

  // Net à payer
  const netAPayer = brutTotal - cnss.employe - ipr - acomptes - autresRetenues;

  // Coût total employeur
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
 * Calculer la masse salariale totale
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
 * Formater un montant en GNF
 */
export function formatGNF(montantCentimes: number): string {
  const montantGNF = montantCentimes / 100;
  return new Intl.NumberFormat('fr-GN', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(montantGNF) + ' GNF';
}
