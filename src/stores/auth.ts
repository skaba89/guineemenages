import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Company, AuthResponse, LoginInput, RegisterInput } from "@/types";
import { authApi } from "@/lib/api";

interface AuthState {
  user: User | null;
  company: Company | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (input: LoginInput) => Promise<boolean>;
  register: (input: RegisterInput) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  setUser: (user: User) => void;
  setCompany: (company: Company) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      login: async (input: LoginInput) => {
        set({ isLoading: true, error: null });
        
        const response = await authApi.login(input.email, input.password);
        
        if (!response.success || !response.data) {
          set({ 
            isLoading: false, 
            error: response.error?.message || "Erreur de connexion" 
          });
          return false;
        }

        const { user, company, accessToken, refreshToken } = response.data;
        
        set({
          user,
          company,
          accessToken,
          refreshToken,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
        
        return true;
      },

      register: async (input: RegisterInput) => {
        set({ isLoading: true, error: null });
        
        const response = await authApi.register(input);
        
        if (!response.success || !response.data) {
          set({ 
            isLoading: false, 
            error: response.error?.message || "Erreur lors de l'inscription" 
          });
          return false;
        }

        const { user, company, accessToken, refreshToken } = response.data;
        
        set({
          user,
          company,
          accessToken,
          refreshToken,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
        
        return true;
      },

      logout: async () => {
        const { accessToken } = get();
        
        if (accessToken) {
          await authApi.logout(accessToken);
        }
        
        set({
          user: null,
          company: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          return false;
        }

        const response = await authApi.refresh(refreshToken);
        
        if (!response.success || !response.data) {
          set({
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          return false;
        }

        set({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        });
        
        return true;
      },

      setUser: (user: User) => set({ user }),
      
      setCompany: (company: Company) => set({ company }),
      
      clearError: () => set({ error: null }),

      checkAuth: async () => {
        const { accessToken, refreshToken } = get();
        
        if (!accessToken) {
          set({ isAuthenticated: false });
          return;
        }

        // Try to get current user
        const response = await authApi.me(accessToken);
        
        if (response.success && response.data) {
          set({
            user: response.data.user,
            company: response.data.company,
            isAuthenticated: true,
          });
        } else if (refreshToken) {
          // Try to refresh token
          const refreshed = await get().refreshAuth();
          if (refreshed) {
            const newResponse = await authApi.me(get().accessToken!);
            if (newResponse.success && newResponse.data) {
              set({
                user: newResponse.data.user,
                company: newResponse.data.company,
                isAuthenticated: true,
              });
            }
          } else {
            set({ isAuthenticated: false });
          }
        } else {
          set({ isAuthenticated: false });
        }
      },
    }),
    {
      name: "guineamanager-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        company: state.company,
      }),
    }
  )
);

// Hook to get token
export const useToken = () => useAuthStore((state) => state.accessToken);

// Hook to check if user is authenticated
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);

// Hook to get current user
export const useCurrentUser = () => useAuthStore((state) => state.user);

// Hook to get current company
export const useCurrentCompany = () => useAuthStore((state) => state.company);
