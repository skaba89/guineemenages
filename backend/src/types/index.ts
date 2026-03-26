import { Request } from 'express';

// ============================================================================
// User & Auth Types
// ============================================================================

export interface UserPayload {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  companyId: string;
}

export interface AuthUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  companyId: string;
  actif: boolean;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'COMPTABLE' | 'EMPLOYE' | 'RH' | 'OWNER' | 'ACCOUNTANT';

// ============================================================================
// Request Types
// ============================================================================

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  company?: CompanyInfo;
  userId?: string;
  companyId?: string;
  userRole?: UserRole;
}

export interface CompanyInfo {
  id: string;
  nom: string;
  plan: string;
  devise: string;
  planAbonnement?: {
    id: string;
    nom: string;
    maxEmployes: number;
    maxUtilisateurs: number;
    maxClients: number;
    maxFacturesMois: number;
  } | null;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationInput {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface ClientFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'PARTICULIER' | 'ENTREPRISE';
}

export interface FactureFilterParams {
  page?: number;
  limit?: number;
  statut?: string;
  clientId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface EmployeFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  departement?: string;
  actif?: boolean;
}

export interface ProduitFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  categorie?: string;
  actif?: boolean;
}

// ============================================================================
// Plan Limits
// ============================================================================

export interface PlanLimit {
  maxUsers: number;
  maxInvoices: number;
  maxEmployees: number;
  maxClients: number;
  maxProducts: number;
  features: {
    crm: boolean;
    accounting: boolean;
    payroll: boolean;
    inventory: boolean;
    multiCurrency: boolean;
    api: boolean;
    exports: boolean;
  };
}

export const PLAN_LIMITS: Record<string, PlanLimit> = {
  FREE: {
    maxUsers: 1,
    maxInvoices: 50,
    maxEmployees: 5,
    maxClients: 50,
    maxProducts: 100,
    features: {
      crm: false,
      accounting: false,
      payroll: false,
      inventory: false,
      multiCurrency: false,
      api: false,
      exports: false,
    },
  },
  STANDARD: {
    maxUsers: 5,
    maxInvoices: -1,
    maxEmployees: 20,
    maxClients: 200,
    maxProducts: 500,
    features: {
      crm: true,
      accounting: false,
      payroll: true,
      inventory: true,
      multiCurrency: false,
      api: false,
      exports: true,
    },
  },
  ENTERPRISE: {
    maxUsers: -1,
    maxInvoices: -1,
    maxEmployees: -1,
    maxClients: -1,
    maxProducts: -1,
    features: {
      crm: true,
      accounting: true,
      payroll: true,
      inventory: true,
      multiCurrency: true,
      api: true,
      exports: true,
    },
  },
};

// ============================================================================
// Payroll Types
// ============================================================================

export interface CalculPaie {
  salaireBase: number;
  heuresSupplementaires: number;
  montantHeuresSupp: number;
  primes: number;
  indemnites: number;
  autresAvantages: number;
  brutTotal: number;
  cnssEmploye: number;
  cnssEmployeur: number;
  baseImposable: number;
  ipr: number;
  autresRetenues: number;
  acomptes: number;
  netAPayer: number;
  coutTotalEmployeur: number;
}

// ============================================================================
// Dashboard Stats
// ============================================================================

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

export interface MonthlyStats {
  mois: number;
  annee: number;
  chiffreAffaires: number;
  depenses: number;
  masseSalariale: number;
  nombreFactures: number;
}
