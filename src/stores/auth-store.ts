import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Company, Client, Produit, Facture, Employe, Depense, DashboardStats } from '@/types';
import { 
  mockUser, 
  mockCompany, 
  mockClients, 
  mockProduits, 
  mockFactures, 
  mockEmployes, 
  mockDepenses,
  mockDashboardStats
} from '@/lib/mock-data';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  // Company
  company: Company | null;
  
  // Clients
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'totalAchats' | 'createdAt'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  // Produits
  produits: Produit[];
  addProduit: (produit: Omit<Produit, 'id' | 'actif' | 'createdAt'>) => void;
  updateProduit: (id: string, produit: Partial<Produit>) => void;
  deleteProduit: (id: string) => void;
  
  // Factures
  factures: Facture[];
  addFacture: (facture: Omit<Facture, 'id' | 'numero' | 'createdAt'>) => void;
  updateFacture: (id: string, facture: Partial<Facture>) => void;
  deleteFacture: (id: string) => void;
  
  // Employés
  employes: Employe[];
  addEmploye: (employe: Omit<Employe, 'id' | 'actif' | 'createdAt'>) => void;
  updateEmploye: (id: string, employe: Partial<Employe>) => void;
  deleteEmploye: (id: string) => void;
  
  // Dépenses
  depenses: Depense[];
  addDepense: (depense: Omit<Depense, 'id' | 'createdAt'>) => void;
  updateDepense: (id: string, depense: Partial<Depense>) => void;
  deleteDepense: (id: string) => void;
  
  // Dashboard
  dashboardStats: DashboardStats;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      
      login: async (email: string, password: string) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Demo login - accept any credentials
        if (email && password) {
          set({ 
            user: { ...mockUser, email },
            isAuthenticated: true,
            company: mockCompany
          });
          return true;
        }
        return false;
      },
      
      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false,
          company: null
        });
      },
      
      // Company
      company: null,
      
      // Clients
      clients: mockClients,
      
      addClient: (clientData) => {
        const newClient: Client = {
          ...clientData,
          id: `cli_${Date.now()}`,
          totalAchats: 0,
          createdAt: new Date().toISOString()
        };
        set(state => ({ clients: [...state.clients, newClient] }));
      },
      
      updateClient: (id, clientData) => {
        set(state => ({
          clients: state.clients.map(c => c.id === id ? { ...c, ...clientData } : c)
        }));
      },
      
      deleteClient: (id) => {
        set(state => ({
          clients: state.clients.filter(c => c.id !== id)
        }));
      },
      
      // Produits
      produits: mockProduits,
      
      addProduit: (produitData) => {
        const newProduit: Produit = {
          ...produitData,
          id: `prod_${Date.now()}`,
          actif: true,
          createdAt: new Date().toISOString()
        };
        set(state => ({ produits: [...state.produits, newProduit] }));
      },
      
      updateProduit: (id, produitData) => {
        set(state => ({
          produits: state.produits.map(p => p.id === id ? { ...p, ...produitData } : p)
        }));
      },
      
      deleteProduit: (id) => {
        set(state => ({
          produits: state.produits.filter(p => p.id !== id)
        }));
      },
      
      // Factures
      factures: mockFactures,
      
      addFacture: (factureData) => {
        const factures = get().factures;
        const currentYear = new Date().getFullYear();
        const count = factures.filter(f => f.numero.startsWith(`FAC-${currentYear}`)).length + 1;
        const numero = `FAC-${currentYear}-${count.toString().padStart(3, '0')}`;
        
        const newFacture: Facture = {
          ...factureData,
          id: `fac_${Date.now()}`,
          numero,
          createdAt: new Date().toISOString()
        };
        set(state => ({ factures: [...state.factures, newFacture] }));
      },
      
      updateFacture: (id, factureData) => {
        set(state => ({
          factures: state.factures.map(f => f.id === id ? { ...f, ...factureData } : f)
        }));
      },
      
      deleteFacture: (id) => {
        set(state => ({
          factures: state.factures.filter(f => f.id !== id)
        }));
      },
      
      // Employés
      employes: mockEmployes,
      
      addEmploye: (employeData) => {
        const newEmploye: Employe = {
          ...employeData,
          id: `emp_${Date.now()}`,
          actif: true,
          createdAt: new Date().toISOString()
        };
        set(state => ({ employes: [...state.employes, newEmploye] }));
      },
      
      updateEmploye: (id, employeData) => {
        set(state => ({
          employes: state.employes.map(e => e.id === id ? { ...e, ...employeData } : e)
        }));
      },
      
      deleteEmploye: (id) => {
        set(state => ({
          employes: state.employes.filter(e => e.id !== id)
        }));
      },
      
      // Dépenses
      depenses: mockDepenses,
      
      addDepense: (depenseData) => {
        const newDepense: Depense = {
          ...depenseData,
          id: `dep_${Date.now()}`,
          createdAt: new Date().toISOString()
        };
        set(state => ({ depenses: [...state.depenses, newDepense] }));
      },
      
      updateDepense: (id, depenseData) => {
        set(state => ({
          depenses: state.depenses.map(d => d.id === id ? { ...d, ...depenseData } : d)
        }));
      },
      
      deleteDepense: (id) => {
        set(state => ({
          depenses: state.depenses.filter(d => d.id !== id)
        }));
      },
      
      // Dashboard
      dashboardStats: mockDashboardStats
    }),
    {
      name: 'guinea-manager-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        company: state.company 
      })
    }
  )
);
