import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Company, Client, Produit, Facture, Employe, Depense, DashboardStats, BulletinPaie } from '@/types';
import api from '@/lib/api';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: { email: string; password: string; nom: string; prenom: string; companyName: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  
  // Company
  company: Company | null;
  
  // Clients
  clients: Client[];
  fetchClients: () => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'totalAchats' | 'createdAt'>) => Promise<boolean>;
  updateClient: (id: string, client: Partial<Client>) => Promise<boolean>;
  deleteClient: (id: string) => Promise<boolean>;
  
  // Produits
  produits: Produit[];
  fetchProduits: () => Promise<void>;
  addProduit: (produit: Omit<Produit, 'id' | 'actif' | 'createdAt'>) => Promise<boolean>;
  updateProduit: (id: string, produit: Partial<Produit>) => Promise<boolean>;
  deleteProduit: (id: string) => Promise<boolean>;
  
  // Factures
  factures: Facture[];
  fetchFactures: () => Promise<void>;
  addFacture: (facture: any) => Promise<boolean>;
  updateFactureStatut: (id: string, statut: string) => Promise<boolean>;
  deleteFacture: (id: string) => Promise<boolean>;
  
  // Employés
  employes: Employe[];
  fetchEmployes: () => Promise<void>;
  addEmploye: (employe: Omit<Employe, 'id' | 'actif' | 'createdAt'>) => Promise<boolean>;
  updateEmploye: (id: string, employe: Partial<Employe>) => Promise<boolean>;
  deleteEmploye: (id: string) => Promise<boolean>;
  
  // Bulletins de paie
  bulletins: BulletinPaie[];
  fetchBulletins: (mois?: number, annee?: number) => Promise<void>;
  calculerPaie: (data: any) => Promise<any>;
  createBulletin: (data: any) => Promise<boolean>;
  validerBulletin: (id: string) => Promise<boolean>;
  payerBulletin: (id: string) => Promise<boolean>;
  
  // Dépenses
  depenses: Depense[];
  fetchDepenses: () => Promise<void>;
  addDepense: (depense: Omit<Depense, 'id' | 'createdAt'>) => Promise<boolean>;
  updateDepense: (id: string, depense: Partial<Depense>) => Promise<boolean>;
  deleteDepense: (id: string) => Promise<boolean>;
  
  // Dashboard
  dashboardStats: DashboardStats | null;
  fetchDashboardStats: () => Promise<void>;
  fetchAlertes: () => Promise<{ stockBas: any[]; facturesRetard: any[] }>;
  
  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
  
  // API Status
  apiConnected: boolean;
  checkApiConnection: () => Promise<boolean>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      apiConnected: false,

      checkApiConnection: async () => {
        try {
          const response = await api.healthCheck();
          const connected = response.success;
          set({ apiConnected: connected });
          return connected;
        } catch {
          set({ apiConnected: false });
          return false;
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.login(email, password);
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              company: response.data.user.company,
            });
            return { success: true };
          }
          
          set({ isLoading: false });
          return { success: false, message: response.message || 'Email ou mot de passe incorrect' };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, message: 'Erreur de connexion au serveur' };
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.register(data);
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              company: response.data.user.company,
            });
            return { success: true };
          }
          
          set({ isLoading: false });
          return { success: false, message: response.message || 'Erreur lors de l\'inscription' };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, message: 'Erreur de connexion au serveur' };
        }
      },

      logout: () => {
        api.logout();
        set({
          user: null,
          isAuthenticated: false,
          company: null,
          clients: [],
          produits: [],
          factures: [],
          employes: [],
          depenses: [],
          bulletins: [],
          dashboardStats: null,
        });
      },

      checkAuth: async () => {
        try {
          const response = await api.getMe();
          if (response.success && response.data) {
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            api.logout();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch {
          set({ isLoading: false, isAuthenticated: false });
        }
      },

      // Company
      company: null,

      // Clients
      clients: [],

      fetchClients: async () => {
        try {
          const response = await api.getClients();
          if (response.success && response.data) {
            set({ clients: response.data });
          }
        } catch (error) {
          console.error('Error fetching clients:', error);
        }
      },

      addClient: async (clientData) => {
        try {
          const response = await api.createClient(clientData);
          if (response.success && response.data) {
            set(state => ({ clients: [...state.clients, response.data] }));
            return true;
          }
          set({ error: response.message || 'Erreur lors de la création' });
          return false;
        } catch {
          return false;
        }
      },

      updateClient: async (id, clientData) => {
        try {
          const response = await api.updateClient(id, clientData);
          if (response.success && response.data) {
            set(state => ({
              clients: state.clients.map(c => c.id === id ? { ...c, ...response.data } : c)
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      deleteClient: async (id) => {
        try {
          const response = await api.deleteClient(id);
          if (response.success) {
            set(state => ({
              clients: state.clients.filter(c => c.id !== id)
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      // Produits
      produits: [],

      fetchProduits: async () => {
        try {
          const response = await api.getProduits();
          if (response.success && response.data) {
            set({ produits: response.data });
          }
        } catch (error) {
          console.error('Error fetching produits:', error);
        }
      },

      addProduit: async (produitData) => {
        try {
          const response = await api.createProduit(produitData);
          if (response.success && response.data) {
            set(state => ({ produits: [...state.produits, response.data] }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      updateProduit: async (id, produitData) => {
        try {
          const response = await api.updateProduit(id, produitData);
          if (response.success && response.data) {
            set(state => ({
              produits: state.produits.map(p => p.id === id ? { ...p, ...response.data } : p)
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      deleteProduit: async (id) => {
        try {
          const response = await api.deleteProduit(id);
          if (response.success) {
            set(state => ({
              produits: state.produits.filter(p => p.id !== id)
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      // Factures
      factures: [],

      fetchFactures: async () => {
        try {
          const response = await api.getFactures();
          if (response.success && response.data) {
            set({ factures: response.data });
          }
        } catch (error) {
          console.error('Error fetching factures:', error);
        }
      },

      addFacture: async (factureData) => {
        try {
          const response = await api.createFacture(factureData);
          if (response.success && response.data) {
            set(state => ({ factures: [...state.factures, response.data] }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      updateFactureStatut: async (id, statut) => {
        try {
          const response = await api.updateFactureStatut(id, statut);
          if (response.success && response.data) {
            set(state => ({
              factures: state.factures.map(f => f.id === id ? { ...f, statut: response.data.statut } : f)
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      deleteFacture: async (id) => {
        try {
          const response = await api.deleteFacture(id);
          if (response.success) {
            set(state => ({
              factures: state.factures.filter(f => f.id !== id)
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      // Employés
      employes: [],

      fetchEmployes: async () => {
        try {
          const response = await api.getEmployes();
          if (response.success && response.data) {
            set({ employes: response.data });
          }
        } catch (error) {
          console.error('Error fetching employes:', error);
        }
      },

      addEmploye: async (employeData) => {
        try {
          const response = await api.createEmploye(employeData);
          if (response.success && response.data) {
            set(state => ({ employes: [...state.employes, response.data] }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      updateEmploye: async (id, employeData) => {
        try {
          const response = await api.updateEmploye(id, employeData);
          if (response.success && response.data) {
            set(state => ({
              employes: state.employes.map(e => e.id === id ? { ...e, ...response.data } : e)
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      deleteEmploye: async (id) => {
        try {
          const response = await api.deleteEmploye(id);
          if (response.success) {
            set(state => ({
              employes: state.employes.filter(e => e.id !== id)
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      // Bulletins de paie
      bulletins: [],

      fetchBulletins: async (mois, annee) => {
        try {
          const response = await api.getBulletins({ mois, annee });
          if (response.success && response.data) {
            set({ bulletins: response.data });
          }
        } catch (error) {
          console.error('Error fetching bulletins:', error);
        }
      },

      calculerPaie: async (data) => {
        try {
          const response = await api.calculerPaie(data);
          return response.success ? response.data : null;
        } catch {
          return null;
        }
      },

      createBulletin: async (data) => {
        try {
          const response = await api.createBulletin(data);
          if (response.success && response.data) {
            set(state => ({ bulletins: [...state.bulletins, response.data] }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      validerBulletin: async (id) => {
        try {
          const response = await api.validerBulletin(id);
          if (response.success && response.data) {
            set(state => ({
              bulletins: state.bulletins.map(b => b.id === id ? { ...b, statut: 'VALIDE' } : b)
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      payerBulletin: async (id) => {
        try {
          const response = await api.payerBulletin(id);
          if (response.success && response.data) {
            set(state => ({
              bulletins: state.bulletins.map(b => b.id === id ? { ...b, statut: 'PAYE' } : b)
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      // Dépenses
      depenses: [],

      fetchDepenses: async () => {
        try {
          const response = await api.getDepenses();
          if (response.success && response.data) {
            set({ depenses: response.data });
          }
        } catch (error) {
          console.error('Error fetching depenses:', error);
        }
      },

      addDepense: async (depenseData) => {
        try {
          const response = await api.createDepense(depenseData);
          if (response.success && response.data) {
            set(state => ({ depenses: [...state.depenses, response.data] }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      updateDepense: async (id, depenseData) => {
        try {
          const response = await api.updateDepense(id, depenseData);
          if (response.success && response.data) {
            set(state => ({
              depenses: state.depenses.map(d => d.id === id ? { ...d, ...response.data } : d)
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      deleteDepense: async (id) => {
        try {
          const response = await api.deleteDepense(id);
          if (response.success) {
            set(state => ({
              depenses: state.depenses.filter(d => d.id !== id)
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      // Dashboard
      dashboardStats: null,

      fetchDashboardStats: async () => {
        try {
          const response = await api.getDashboardStats();
          if (response.success && response.data) {
            set({ dashboardStats: response.data });
          }
        } catch (error) {
          console.error('Error fetching dashboard stats:', error);
        }
      },

      fetchAlertes: async () => {
        try {
          const response = await api.getAlertes();
          if (response.success && response.data) {
            return response.data;
          }
          return { stockBas: [], facturesRetard: [] };
        } catch {
          return { stockBas: [], facturesRetard: [] };
        }
      },

      // Error handling
      setError: (error) => set({ error }),
    }),
    {
      name: 'guineamanager-storage',
      partialize: (state) => ({
        // Only persist minimal auth state
      })
    }
  )
);
