// Données de démonstration pour GuinéaManager
import { User, Company, Client, Produit, Facture, Employe, BulletinPaie, Depense, DashboardStats } from '@/types';

export const mockCompany: Company = {
  id: 'comp_001',
  nom: 'Commerce Plus SARL',
  email: 'contact@commerceplus-gn.com',
  telephone: '+224 620 00 00 00',
  adresse: 'Avenue de la République',
  ville: 'Conakry',
  pays: 'Guinée',
  ninea: 'GN-CON-2024-00123',
  plan: 'STANDARD',
  devise: 'GNF'
};

export const mockUser: User = {
  id: 'user_001',
  email: 'admin@commerceplus-gn.com',
  nom: 'Diallo',
  prenom: 'Mamadou',
  telephone: '+224 620 11 11 11',
  role: 'ADMIN',
  companyId: 'comp_001',
  company: mockCompany,
  actif: true,
  createdAt: '2024-01-15T10:00:00Z'
};

export const mockClients: Client[] = [
  {
    id: 'cli_001',
    nom: 'Alpha Condé',
    email: 'alpha.conde@email.com',
    telephone: '+224 622 22 22 22',
    adresse: 'Kaloum',
    ville: 'Conakry',
    pays: 'Guinée',
    type: 'PARTICULIER',
    totalAchats: 15000000,
    createdAt: '2024-02-01T10:00:00Z'
  },
  {
    id: 'cli_002',
    nom: 'Société Minière de Guinée',
    email: 'contact@smg-gn.com',
    telephone: '+224 623 33 33 33',
    adresse: 'Hamdallaye',
    ville: 'Conakry',
    pays: 'Guinée',
    type: 'ENTREPRISE',
    totalAchats: 85000000,
    createdAt: '2024-01-20T10:00:00Z'
  },
  {
    id: 'cli_003',
    nom: 'Fatou Boubou Bah',
    email: 'fatou.bah@email.com',
    telephone: '+224 624 44 44 44',
    adresse: 'Niger',
    ville: 'Conakry',
    pays: 'Guinée',
    type: 'PARTICULIER',
    totalAchats: 5200000,
    createdAt: '2024-03-10T10:00:00Z'
  },
  {
    id: 'cli_004',
    nom: 'Bureau Plus Guinée',
    email: 'ventes@bureauplus-gn.com',
    telephone: '+224 625 55 55 55',
    adresse: 'Taouyah',
    ville: 'Conakry',
    pays: 'Guinée',
    type: 'ENTREPRISE',
    totalAchats: 42000000,
    createdAt: '2024-02-15T10:00:00Z'
  },
  {
    id: 'cli_005',
    nom: 'Ibrahima Sow',
    email: 'ibrahima.sow@email.com',
    telephone: '+224 626 66 66 66',
    adresse: 'Dixinn',
    ville: 'Conakry',
    pays: 'Guinée',
    type: 'PARTICULIER',
    totalAchats: 8900000,
    createdAt: '2024-03-20T10:00:00Z'
  }
];

export const mockProduits: Produit[] = [
  {
    id: 'prod_001',
    nom: 'Papier A4 Premium',
    description: 'Ramette de 500 feuilles papier A4 80g/m²',
    prixUnitaire: 75000,
    unite: 'Ramette',
    stockActuel: 150,
    stockMin: 20,
    categorie: 'Fournitures de bureau',
    actif: true,
    createdAt: '2024-01-10T10:00:00Z'
  },
  {
    id: 'prod_002',
    nom: 'Stylo Bic Cristal',
    description: 'Stylo à bille bleu pack de 50',
    prixUnitaire: 125000,
    unite: 'Pack',
    stockActuel: 80,
    stockMin: 10,
    categorie: 'Fournitures de bureau',
    actif: true,
    createdAt: '2024-01-10T10:00:00Z'
  },
  {
    id: 'prod_003',
    nom: 'Imprimante HP LaserJet Pro',
    description: 'Imprimante laser monochrome professionnelle',
    prixUnitaire: 3500000,
    unite: 'Unité',
    stockActuel: 12,
    stockMin: 3,
    categorie: 'Matériel informatique',
    actif: true,
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'prod_004',
    nom: 'Cartouche HP 26A',
    description: 'Cartouche toner noire pour HP LaserJet',
    prixUnitaire: 450000,
    unite: 'Unité',
    stockActuel: 8,
    stockMin: 5,
    categorie: 'Consommables',
    actif: true,
    createdAt: '2024-01-20T10:00:00Z'
  },
  {
    id: 'prod_005',
    nom: 'Chaise de bureau ergonomique',
    description: 'Chaise avec soutien lombaire et accoudoirs',
    prixUnitaire: 1200000,
    unite: 'Unité',
    stockActuel: 5,
    stockMin: 2,
    categorie: 'Mobilier',
    actif: true,
    createdAt: '2024-02-01T10:00:00Z'
  },
  {
    id: 'prod_006',
    nom: 'Ordinateur Dell Inspiron',
    description: 'Laptop 15.6" Intel Core i5, 8Go RAM, 256Go SSD',
    prixUnitaire: 8500000,
    unite: 'Unité',
    stockActuel: 3,
    stockMin: 2,
    categorie: 'Matériel informatique',
    actif: true,
    createdAt: '2024-02-10T10:00:00Z'
  },
  {
    id: 'prod_007',
    nom: 'Classeur à levier A4',
    description: 'Classeur 4 anneaux capacité 350 feuilles',
    prixUnitaire: 25000,
    unite: 'Unité',
    stockActuel: 200,
    stockMin: 30,
    categorie: 'Fournitures de bureau',
    actif: true,
    createdAt: '2024-02-15T10:00:00Z'
  }
];

export const mockFactures: Facture[] = [
  {
    id: 'fac_001',
    numero: 'FAC-2024-001',
    clientId: 'cli_002',
    client: mockClients.find(c => c.id === 'cli_002'),
    dateEmission: '2024-03-01',
    dateEcheance: '2024-03-31',
    lignes: [],
    montantHT: 8500000,
    montantTVA: 1700000,
    montantTTC: 10200000,
    statut: 'PAYEE',
    modePaiement: 'VIREMENT',
    createdAt: '2024-03-01T10:00:00Z'
  },
  {
    id: 'fac_002',
    numero: 'FAC-2024-002',
    clientId: 'cli_001',
    client: mockClients.find(c => c.id === 'cli_001'),
    dateEmission: '2024-03-05',
    dateEcheance: '2024-04-05',
    lignes: [],
    montantHT: 2500000,
    montantTVA: 500000,
    montantTTC: 3000000,
    statut: 'ENVOYEE',
    createdAt: '2024-03-05T10:00:00Z'
  },
  {
    id: 'fac_003',
    numero: 'FAC-2024-003',
    clientId: 'cli_004',
    client: mockClients.find(c => c.id === 'cli_004'),
    dateEmission: '2024-03-10',
    dateEcheance: '2024-03-25',
    lignes: [],
    montantHT: 12000000,
    montantTVA: 2400000,
    montantTTC: 14400000,
    statut: 'EN_RETARD',
    createdAt: '2024-03-10T10:00:00Z'
  },
  {
    id: 'fac_004',
    numero: 'FAC-2024-004',
    clientId: 'cli_003',
    client: mockClients.find(c => c.id === 'cli_003'),
    dateEmission: '2024-03-15',
    dateEcheance: '2024-04-15',
    lignes: [],
    montantHT: 1800000,
    montantTVA: 360000,
    montantTTC: 2160000,
    statut: 'BROUILLON',
    createdAt: '2024-03-15T10:00:00Z'
  },
  {
    id: 'fac_005',
    numero: 'FAC-2024-005',
    clientId: 'cli_005',
    client: mockClients.find(c => c.id === 'cli_005'),
    dateEmission: '2024-03-18',
    dateEcheance: '2024-04-18',
    lignes: [],
    montantHT: 4250000,
    montantTVA: 850000,
    montantTTC: 5100000,
    statut: 'ENVOYEE',
    modePaiement: 'ORANGE_MONEY',
    createdAt: '2024-03-18T10:00:00Z'
  }
];

export const mockEmployes: Employe[] = [
  {
    id: 'emp_001',
    matricule: 'EMP-001',
    nom: 'Diallo',
    prenom: 'Aissatou',
    email: 'aissatou.diallo@commerceplus-gn.com',
    telephone: '+224 620 22 22 22',
    adresse: 'Kaloum, Conakry',
    dateNaissance: '1990-05-15',
    dateEmbauche: '2020-01-15',
    poste: 'Comptable',
    departement: 'Finance',
    salaireBase: 3500000,
    typeContrat: 'CDI',
    actif: true,
    createdAt: '2020-01-15T10:00:00Z'
  },
  {
    id: 'emp_002',
    matricule: 'EMP-002',
    nom: 'Touré',
    prenom: 'Ibrahima',
    email: 'ibrahima.toure@commerceplus-gn.com',
    telephone: '+224 620 33 33 33',
    adresse: 'Hamdallaye, Conakry',
    dateNaissance: '1985-08-20',
    dateEmbauche: '2019-06-01',
    poste: 'Directeur Commercial',
    departement: 'Commercial',
    salaireBase: 5500000,
    typeContrat: 'CDI',
    actif: true,
    createdAt: '2019-06-01T10:00:00Z'
  },
  {
    id: 'emp_003',
    matricule: 'EMP-003',
    nom: 'Bangoura',
    prenom: 'Mariama',
    email: 'mariama.bangoura@commerceplus-gn.com',
    telephone: '+224 620 44 44 44',
    adresse: 'Niger, Conakry',
    dateNaissance: '1995-03-10',
    dateEmbauche: '2022-09-01',
    poste: 'Assistante Administrative',
    departement: 'Administration',
    salaireBase: 2000000,
    typeContrat: 'CDI',
    actif: true,
    createdAt: '2022-09-01T10:00:00Z'
  },
  {
    id: 'emp_004',
    matricule: 'EMP-004',
    nom: 'Condé',
    prenom: 'Sékou',
    email: 'sekou.conde@commerceplus-gn.com',
    telephone: '+224 620 55 55 55',
    adresse: 'Dixinn, Conakry',
    dateNaissance: '1988-11-25',
    dateEmbauche: '2021-03-15',
    poste: 'Magasinier',
    departement: 'Logistique',
    salaireBase: 2500000,
    typeContrat: 'CDI',
    actif: true,
    createdAt: '2021-03-15T10:00:00Z'
  },
  {
    id: 'emp_005',
    matricule: 'EMP-005',
    nom: 'Sylla',
    prenom: 'Fatoumata',
    email: 'fatoumata.sylla@commerceplus-gn.com',
    telephone: '+224 620 66 66 66',
    adresse: 'Taouyah, Conakry',
    dateNaissance: '1992-07-08',
    dateEmbauche: '2023-01-10',
    poste: 'Vendeuse',
    departement: 'Commercial',
    salaireBase: 1800000,
    typeContrat: 'CDD',
    actif: true,
    createdAt: '2023-01-10T10:00:00Z'
  }
];

export const mockBulletinsPaie: BulletinPaie[] = [
  {
    id: 'bp_001',
    employeId: 'emp_001',
    employe: mockEmployes.find(e => e.id === 'emp_001'),
    mois: 3,
    annee: 2024,
    salaireBase: 3500000,
    heuresSupplementaires: 8,
    montantHeuresSupp: 175000,
    primes: 200000,
    indemnites: 100000,
    autresAvantages: 0,
    brutTotal: 3975000,
    cnssEmploye: 198750,
    cnssEmployeur: 715500,
    ipr: 97500,
    autreRetenues: 0,
    acomptes: 0,
    netAPayer: 3678750,
    coutTotalEmployeur: 4690500,
    statut: 'PAYE',
    datePaiement: '2024-03-31',
    createdAt: '2024-03-30T10:00:00Z'
  },
  {
    id: 'bp_002',
    employeId: 'emp_002',
    employe: mockEmployes.find(e => e.id === 'emp_002'),
    mois: 3,
    annee: 2024,
    salaireBase: 5500000,
    heuresSupplementaires: 0,
    montantHeuresSupp: 0,
    primes: 500000,
    indemnites: 150000,
    autresAvantages: 200000,
    brutTotal: 6350000,
    cnssEmploye: 250000,
    cnssEmployeur: 1143000,
    ipr: 255000,
    autreRetenues: 0,
    acomptes: 500000,
    netAPayer: 5345000,
    coutTotalEmployeur: 7493000,
    statut: 'PAYE',
    datePaiement: '2024-03-31',
    createdAt: '2024-03-30T10:00:00Z'
  }
];

export const mockDepenses: Depense[] = [
  {
    id: 'dep_001',
    description: 'Loyer bureau mars 2024',
    montant: 5000000,
    categorie: 'Loyer',
    date: '2024-03-01',
    modePaiement: 'VIREMENT',
    notes: 'Loyer mensuel bureau Hamdallaye',
    createdAt: '2024-03-01T10:00:00Z'
  },
  {
    id: 'dep_002',
    description: 'Facture électricité',
    montant: 850000,
    categorie: 'Énergie',
    date: '2024-03-05',
    modePaiement: 'ORANGE_MONEY',
    notes: 'EDG - Consommation février',
    createdAt: '2024-03-05T10:00:00Z'
  },
  {
    id: 'dep_003',
    description: 'Carburant véhicules',
    montant: 1200000,
    categorie: 'Transport',
    date: '2024-03-10',
    modePaiement: 'ESPECES',
    createdAt: '2024-03-10T10:00:00Z'
  },
  {
    id: 'dep_004',
    description: 'Fournitures de bureau',
    montant: 450000,
    categorie: 'Fournitures',
    date: '2024-03-15',
    modePaiement: 'ORANGE_MONEY',
    createdAt: '2024-03-15T10:00:00Z'
  },
  {
    id: 'dep_005',
    description: 'Maintenance informatique',
    montant: 750000,
    categorie: 'Maintenance',
    date: '2024-03-20',
    modePaiement: 'VIREMENT',
    createdAt: '2024-03-20T10:00:00Z'
  }
];

export const mockDashboardStats: DashboardStats = {
  caMois: 34860000,
  caAnnee: 125000000,
  facturesEnAttente: 2,
  facturesEnRetard: 1,
  clientsActifs: 5,
  produitsStockBas: 2,
  masseSalarialeMois: 15300000,
  depensesMois: 8250000
};

// Catégories de dépenses
export const categoriesDepenses = [
  'Loyer',
  'Énergie',
  'Transport',
  'Fournitures',
  'Maintenance',
  'Salaires',
  'Marketing',
  'Télécommunications',
  'Assurance',
  'Fiscalité',
  'Autres'
];

// Calculs de paie guinéens
export function calculerCNSS(salaireBrut: number): { employe: number; employeur: number } {
  const plafondCNSS = 5000000; // 5M GNF
  const baseCalcul = Math.min(salaireBrut, plafondCNSS);
  return {
    employe: Math.round(baseCalcul * 0.05), // 5% employé
    employeur: Math.round(baseCalcul * 0.18) // 18% employeur
  };
}

export function calculerIPR(salaireBrut: number, cnssEmploye: number): number {
  const baseImposable = salaireBrut - cnssEmploye;
  
  if (baseImposable <= 3000000) return 0; // 0-3M: 0%
  if (baseImposable <= 5000000) {
    return Math.round((baseImposable - 3000000) * 0.10); // 3-5M: 10%
  }
  if (baseImposable <= 10000000) {
    return Math.round(200000 + (baseImposable - 5000000) * 0.15); // 5-10M: 15%
  }
  return Math.round(950000 + (baseImposable - 10000000) * 0.20); // >10M: 20%
}

// Formater en GNF
export function formatGNF(montant: number): string {
  return new Intl.NumberFormat('fr-GN', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(montant) + ' GNF';
}

// Formater date
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
