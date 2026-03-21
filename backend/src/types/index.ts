export interface UserPayload {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  companyId: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Payroll types
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

// Dashboard stats
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
