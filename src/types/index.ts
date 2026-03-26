// Types pour GuinéaManager ERP

// Plan types - must match backend Prisma schema
export type PlanType = 'petite' | 'moyenne' | 'grande' | 'enterprise';

export interface PlanAbonnement {
  id: PlanType;
  nom: string;
  description?: string;
  prixMensuel: number;
  prixAnnuel: number;
  maxEmployes: number;
  maxUtilisateurs: number;
  maxClients: number;
  maxProduits: number;
  maxFacturesMois: number;
  modules: string;
  support: string;
  sauvegardeAuto: boolean;
  apiAccess: boolean;
  personnalisation: boolean;
  multiSociete: boolean;
  rapportsAvances: boolean;
}

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role: 'ADMIN' | 'MANAGER' | 'COMPTABLE' | 'EMPLOYE';
  companyId: string;
  company?: Company;
  actif: boolean;
  emailVerifie?: boolean;
  createdAt: string;
}

export interface Company {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays: string;
  codePays?: string;
  ninea?: string;
  logo?: string;
  planId: PlanType;
  planAbonnement?: PlanAbonnement;
  devise: string;
  symboleDevise: string;
  dateDebutAbonnement?: string;
  dateFinAbonnement?: string;
}

export interface Client {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays: string;
  type: 'PARTICULIER' | 'ENTREPRISE';
  totalAchats: number;
  createdAt: string;
}

export interface Fournisseur {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays: string;
  totalAchats: number;
  createdAt: string;
}

export interface Produit {
  id: string;
  nom: string;
  description?: string;
  prixUnitaire: number;
  unite: string;
  stockActuel: number;
  stockMin: number;
  categorie?: string;
  actif: boolean;
  createdAt: string;
}

export interface Facture {
  id: string;
  numero: string;
  clientId: string;
  client?: Client;
  dateEmission: string;
  dateEcheance: string;
  lignes: LigneFacture[];
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  statut: 'BROUILLON' | 'ENVOYEE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE';
  modePaiement?: 'ESPECES' | 'VIREMENT' | 'ORANGE_MONEY' | 'MTN_MONEY' | 'CHEQUE';
  notes?: string;
  createdAt: string;
}

export interface LigneFacture {
  id: string;
  produitId?: string;
  produit?: Produit;
  description: string;
  quantite: number;
  prixUnitaire: number;
  tauxTVA: number;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
}

export interface Employe {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: string;
  dateEmbauche: string;
  dateDepart?: string;
  poste: string;
  departement?: string;
  salaireBase: number;
  typeContrat: 'CDI' | 'CDD' | 'APPRENTISSAGE' | 'STAGE';
  actif: boolean;
  createdAt: string;
}

export interface BulletinPaie {
  id: string;
  employeId: string;
  employe?: Employe;
  mois: number;
  annee: number;
  salaireBase: number;
  heuresSupplementaires: number;
  montantHeuresSupp: number;
  primes: number;
  indemnites: number;
  autresAvantages: number;
  brutTotal: number;
  cnssEmploye: number;
  cnssEmployeur: number;
  ipr: number;
  autreRetenues: number;
  acomptes: number;
  netAPayer: number;
  coutTotalEmployeur: number;
  statut: 'BROUILLON' | 'VALIDE' | 'PAYE';
  datePaiement?: string;
  createdAt: string;
}

export interface Depense {
  id: string;
  description: string;
  montant: number;
  categorie: string;
  date: string;
  modePaiement: 'ESPECES' | 'VIREMENT' | 'ORANGE_MONEY' | 'MTN_MONEY' | 'CHEQUE' | 'CARTE';
  fournisseurId?: string;
  fournisseur?: Fournisseur;
  notes?: string;
  recuUrl?: string;
  createdAt: string;
}

export interface DashboardStats {
  caMois: number;
  caAnnee: number;
  facturesEnAttente: number;
  facturesEnRetard: number;
  clientsActifs: number;
  produitsStockBas: number;
  masseSalarialeMois: number;
  depensesMois: number;
}

export interface RapportMensuel {
  mois: string;
  ca: number;
  depenses: number;
  benefice: number;
  factures: number;
  paiements: number;
}

// Form types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ClientFormData {
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays: string;
  type: 'PARTICULIER' | 'ENTREPRISE';
}

export interface ProduitFormData {
  nom: string;
  description?: string;
  prixUnitaire: number;
  unite: string;
  stockActuel: number;
  stockMin: number;
  categorie?: string;
}

export interface FactureFormData {
  clientId: string;
  dateEmission: string;
  dateEcheance: string;
  lignes: {
    produitId?: string;
    description: string;
    quantite: number;
    prixUnitaire: number;
    tauxTVA: number;
  }[];
  modePaiement?: string;
  notes?: string;
}

export interface EmployeFormData {
  matricule: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: string;
  dateEmbauche: string;
  poste: string;
  departement?: string;
  salaireBase: number;
  typeContrat: 'CDI' | 'CDD' | 'APPRENTISSAGE' | 'STAGE';
}

export interface DepenseFormData {
  description: string;
  montant: number;
  categorie: string;
  date: string;
  modePaiement: string;
  fournisseurId?: string;
  notes?: string;
}
