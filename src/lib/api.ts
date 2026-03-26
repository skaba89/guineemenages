// API Client for GuinéaManager Backend
// This file provides the interface between the frontend and the backend API

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('guineamanager-token');
    }
    return null;
  }

  setToken(token: string | null) {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('guineamanager-token', token);
      } else {
        localStorage.removeItem('guineamanager-token');
      }
    }
  }

  logout() {
    this.setToken(null);
  }

  getToken(): string | null {
    return this.getToken();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Erreur serveur',
          errors: data.errors,
        };
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur de connexion au serveur',
      };
    }
  }

  // ============ HEALTH ============
  async healthCheck() {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // ============ AUTH ============
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async register(data: { email: string; password: string; nom: string; prenom: string; companyName: string }) {
    const response = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async getMe() {
    return this.request<{ id: string; email: string; nom: string; prenom: string; role: string; company: any }>('/auth/me');
  }

  // ============ CLIENTS ============
  async getClients(params?: { search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    
    return this.request<any[]>(`/clients?${query.toString()}`);
  }

  async createClient(data: any) {
    return this.request<any>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClient(id: string, data: any) {
    return this.request<any>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClient(id: string) {
    return this.request(`/clients/${id}`, { method: 'DELETE' });
  }

  // ============ PRODUITS ============
  async getProduits(params?: { search?: string; categorie?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.categorie) query.set('categorie', params.categorie);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    
    return this.request<any[]>(`/produits?${query.toString()}`);
  }

  async createProduit(data: any) {
    return this.request<any>('/produits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduit(id: string, data: any) {
    return this.request<any>(`/produits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduit(id: string) {
    return this.request(`/produits/${id}`, { method: 'DELETE' });
  }

  // ============ FACTURES ============
  async getFactures(params?: { statut?: string; clientId?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.statut) query.set('statut', params.statut);
    if (params?.clientId) query.set('clientId', params.clientId);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    
    return this.request<any[]>(`/factures?${query.toString()}`);
  }

  async createFacture(data: any) {
    return this.request<any>('/factures', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFactureStatut(id: string, statut: string) {
    return this.request<any>(`/factures/${id}/statut`, {
      method: 'PUT',
      body: JSON.stringify({ statut }),
    });
  }

  async deleteFacture(id: string) {
    return this.request(`/factures/${id}`, { method: 'DELETE' });
  }

  async getFacturePDF(id: string) {
    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}/factures/${id}/pdf`, { headers });
      
      if (!response.ok) {
        return { success: false, message: 'Erreur lors de la génération du PDF' };
      }

      const blob = await response.blob();
      return { success: true, data: blob };
    } catch (error) {
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  // ============ EMPLOYES ============
  async getEmployes(params?: { departement?: string; search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.departement) query.set('departement', params.departement);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    
    return this.request<any[]>(`/employes?${query.toString()}`);
  }

  async createEmploye(data: any) {
    return this.request<any>('/employes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmploye(id: string, data: any) {
    return this.request<any>(`/employes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEmploye(id: string) {
    return this.request(`/employes/${id}`, { method: 'DELETE' });
  }

  // ============ PAIE ============
  async getBulletins(params?: { mois?: number; annee?: number; employeId?: string }) {
    const query = new URLSearchParams();
    if (params?.mois) query.set('mois', params.mois.toString());
    if (params?.annee) query.set('annee', params.annee.toString());
    if (params?.employeId) query.set('employeId', params.employeId);
    
    return this.request<any[]>(`/paie/bulletins?${query.toString()}`);
  }

  async calculerPaie(data: any) {
    return this.request<any>('/paie/calculer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createBulletin(data: any) {
    return this.request<any>('/paie/bulletins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async validerBulletin(id: string) {
    return this.request<any>(`/paie/bulletins/${id}/valider`, { method: 'PUT' });
  }

  async payerBulletin(id: string) {
    return this.request<any>(`/paie/bulletins/${id}/payer`, { method: 'PUT' });
  }

  // ============ DEPENSES ============
  async getDepenses(params?: { categorie?: string; mois?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.categorie) query.set('categorie', params.categorie);
    if (params?.mois) query.set('mois', params.mois);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    
    return this.request<any[]>(`/depenses?${query.toString()}`);
  }

  async createDepense(data: any) {
    return this.request<any>('/depenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDepense(id: string, data: any) {
    return this.request<any>(`/depenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDepense(id: string) {
    return this.request(`/depenses/${id}`, { method: 'DELETE' });
  }

  // ============ DASHBOARD ============
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  async getFacturesRecentes() {
    return this.request<any[]>('/dashboard/factures-recentes');
  }

  async getAlertes() {
    return this.request<{ stockBas: any[]; facturesRetard: any[] }>('/dashboard/alertes');
  }

  // ============ EXPORTS ============
  async exportClients() {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/exports/clients`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.blob();
  }

  async exportFactures(params?: { statut?: string; startDate?: string; endDate?: string }) {
    const query = new URLSearchParams();
    if (params?.statut) query.set('statut', params.statut);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);

    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/exports/factures?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.blob();
  }

  async exportEmployes() {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/exports/employes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.blob();
  }

  async exportPaie(params?: { mois?: number; annee?: number }) {
    const query = new URLSearchParams();
    if (params?.mois) query.set('mois', params.mois.toString());
    if (params?.annee) query.set('annee', params.annee.toString());

    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/exports/paie?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.blob();
  }

  async exportDepenses(params?: { categorie?: string; startDate?: string; endDate?: string }) {
    const query = new URLSearchParams();
    if (params?.categorie) query.set('categorie', params.categorie);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);

    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/exports/depenses?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.blob();
  }

  // ============ PARAMETRES ============
  async getSociete() {
    return this.request<any>('/parametres/societe');
  }

  async updateSociete(data: any) {
    return this.request<any>('/parametres/societe', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateFiscalConfig(data: any) {
    return this.request<any>('/parametres/societe/fiscal', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getCustomParams() {
    return this.request<Record<string, any>>('/parametres/custom');
  }

  async setCustomParam(cle: string, valeur: any, type?: string, description?: string) {
    return this.request<any>(`/parametres/custom/${cle}`, {
      method: 'PUT',
      body: JSON.stringify({ valeur, type, description }),
    });
  }

  async deleteCustomParam(cle: string) {
    return this.request(`/parametres/custom/${cle}`, { method: 'DELETE' });
  }

  async getPays() {
    return this.request<any[]>('/parametres/pays');
  }

  async getPaysConfig(code: string) {
    return this.request<any>(`/parametres/pays/${code}/config`);
  }

  async getUtilisateurs() {
    return this.request<any[]>('/parametres/utilisateurs');
  }

  async updateUtilisateur(id: string, data: any) {
    return this.request<any>(`/parametres/utilisateurs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getProfil() {
    return this.request<any>('/parametres/profil');
  }

  async updateProfil(data: any) {
    return this.request<any>('/parametres/profil', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(ancienPassword: string, nouveauPassword: string) {
    return this.request<any>('/parametres/profil/password', {
      method: 'PUT',
      body: JSON.stringify({ ancienPassword, nouveauPassword }),
    });
  }

  // ============ PLANS ============
  async getPlans() {
    return this.request<any[]>('/plans');
  }

  async getPlan(id: string) {
    return this.request<any>(`/plans/${id}`);
  }

  async getAbonnementActuel() {
    return this.request<any>('/plans/abonnement/actuel');
  }

  async changerPlan(planId: string, duree: 'mensuel' | 'annuel' = 'mensuel') {
    return this.request<any>('/plans/abonnement/changer', {
      method: 'POST',
      body: JSON.stringify({ planId, duree }),
    });
  }

  async getHistoriqueAbonnement() {
    return this.request<any[]>('/plans/abonnement/historique');
  }

  async getPlansComparaison() {
    return this.request<any>('/plans/comparaison/feature');
  }

  // ============ PAIE MULTI-PAYS ============
  async getPaieConfigPays() {
    return this.request<any>('/paie/config-pays');
  }

  async getPaysSupportes() {
    return this.request<any[]>('/paie/pays-supportes');
  }

  async getRapportCotisations(mois: number, annee: number) {
    return this.request<any>(`/paie/rapport-cotisations?mois=${mois}&annee=${annee}`);
  }

  async getRapportImposition(annee: number) {
    return this.request<any>(`/paie/rapport-imposition?annee=${annee}`);
  }

  // ============ 2FA AUTHENTICATION ============
  async get2FAStatus() {
    return this.request<{ enabled: boolean; method: string | null; phone?: string }>('/auth/2fa/status');
  }

  async initiate2FASetup(method: 'totp' | 'sms') {
    return this.request<{ 
      method: string; 
      qrCodeUrl?: string; 
      secret?: string; 
      recoveryCodes?: string[];
      otp?: string;
    }>('/auth/2fa/setup/initiate', {
      method: 'POST',
      body: JSON.stringify({ method }),
    });
  }

  async verify2FASetup(code: string) {
    return this.request<{ method: string; recoveryCodes?: string[] }>('/auth/2fa/setup/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async disable2FA(password: string) {
    return this.request('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async verify2FALogin(tempToken: string, code: string) {
    return this.request<{ token: string; user: any }>('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ tempToken, code }),
    });
  }

  async resend2FAOTP(tempToken: string) {
    return this.request('/auth/2fa/resend', {
      method: 'POST',
      body: JSON.stringify({ tempToken }),
    });
  }

  // ============ MOBILE MONEY ============
  async getMobileMoneyConfig() {
    return this.request<{
      orangeMoney: {
        enabled: boolean;
        apiKey: string;
        apiSecret: string;
        merchantCode: string;
      };
      mtnMoney: {
        enabled: boolean;
        subscriberKey: string;
        subscriptionKey: string;
      };
    }>('/paiements-mobile/config');
  }

  async saveMobileMoneyConfig(data: any) {
    return this.request('/paiements-mobile/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async initiateOrangeMoneyPayment(data: {
    amount: number;
    orderId: string;
    customerPhone: string;
    customerName?: string;
    description?: string;
    metadata?: any;
  }) {
    return this.request<{
      orderId: string;
      txId: string;
      status: string;
      message: string;
    }>('/paiements-mobile/orange-money/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkPaymentStatus(transactionId: string) {
    return this.request<{
      id: string;
      status: string;
      amount: number;
      completedAt?: string;
    }>(`/paiements-mobile/status/${transactionId}`);
  }

  async getMobileMoneyTransactions(params?: { status?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    return this.request<any[]>(`/paiements-mobile/transactions?${query.toString()}`);
  }

  // ============ NOTIFICATIONS ============
  async getNotificationSettings() {
    return this.request<{
      email: boolean;
      sms: boolean;
      push: boolean;
      invoiceCreated: boolean;
      invoicePaid: boolean;
      invoiceReminder: boolean;
      payrollReady: boolean;
      stockAlert: boolean;
      employeeHired: boolean;
      subscriptionExpiring: boolean;
    }>('/notifications/preferences');
  }

  async updateNotificationSettings(data: any) {
    return this.request('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getNotifications(params?: { page?: number; limit?: number; lu?: boolean; type?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.lu !== undefined) query.set('lu', params.lu.toString());
    if (params?.type) query.set('type', params.type);

    return this.request<{
      data: any[];
      unreadCount: number;
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/notifications?${query.toString()}`);
  }

  async getUnreadCount() {
    return this.request<{ count: number }>('/notifications/unread-count');
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', { method: 'PUT' });
  }

  async deleteNotification(id: string) {
    return this.request(`/notifications/${id}`, { method: 'DELETE' });
  }

  async clearAllNotifications() {
    return this.request('/notifications', { method: 'DELETE' });
  }

  async getVapidPublicKey() {
    return this.request<{ publicKey: string | null }>('/notifications/vapid-key');
  }

  async subscribeToPush(subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }) {
    return this.request('/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
    });
  }

  async unsubscribeFromPush(endpoint: string) {
    return this.request('/notifications/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    });
  }

  // ============ PASSWORD RESET ============
  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async verifyEmail(token: string) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // ============ ENTREPOTS (WAREHOUSES) ============
  async getEntrepots(params?: { actif?: boolean; search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.actif !== undefined) query.set('actif', params.actif.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return this.request<any[]>(`/entrepots?${query.toString()}`);
  }

  async getEntrepot(id: string) {
    return this.request<any>(`/entrepots/${id}`);
  }

  async createEntrepot(data: any) {
    return this.request<any>('/entrepots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEntrepot(id: string, data: any) {
    return this.request<any>(`/entrepots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getStockEntrepot(entrepotId: string, params?: { search?: string; lowStock?: boolean; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.lowStock) query.set('lowStock', 'true');
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return this.request<any[]>(`/entrepots/${entrepotId}/stock?${query.toString()}`);
  }

  async updateStockEntrepot(entrepotId: string, produitId: string, quantite: number, raison?: string) {
    return this.request<any>(`/entrepots/${entrepotId}/stock/${produitId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantite, raison }),
    });
  }

  async getStockSummary() {
    return this.request<any>('/entrepots/stats');
  }

  // ============ STOCK TRANSFERS ============
  async getTransferts(params?: { entrepotId?: string; statut?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.entrepotId) query.set('entrepotId', params.entrepotId);
    if (params?.statut) query.set('statut', params.statut);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return this.request<any[]>(`/entrepots/transferts/history?${query.toString()}`);
  }

  async createTransfert(data: { entrepotSourceId: string; entrepotDestId: string; produits: Array<{ produitId: string; quantite: number; notes?: string }>; notes?: string }) {
    return this.request<any>('/entrepots/transferts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============ FOURNISSEURS (SUPPLIERS) ============
  async getFournisseurs(params?: { actif?: boolean; search?: string; pays?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.actif !== undefined) query.set('actif', params.actif.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.pays) query.set('pays', params.pays);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return this.request<any[]>(`/fournisseurs?${query.toString()}`);
  }

  async getFournisseur(id: string) {
    return this.request<any>(`/fournisseurs/${id}`);
  }

  async createFournisseur(data: any) {
    return this.request<any>('/fournisseurs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFournisseur(id: string, data: any) {
    return this.request<any>(`/fournisseurs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFournisseur(id: string) {
    return this.request(`/fournisseurs/${id}`, { method: 'DELETE' });
  }

  async getFournisseurStats() {
    return this.request<any>('/fournisseurs/stats');
  }

  // ============ COMMANDES FOURNISSEURS (PURCHASE ORDERS) ============
  async getCommandesFournisseur(params?: { fournisseurId?: string; statut?: string; startDate?: string; endDate?: string; search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.fournisseurId) query.set('fournisseurId', params.fournisseurId);
    if (params?.statut) query.set('statut', params.statut);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return this.request<any[]>(`/fournisseurs/commandes/all?${query.toString()}`);
  }

  async getCommandeFournisseur(id: string) {
    return this.request<any>(`/fournisseurs/commandes/${id}`);
  }

  async createCommandeFournisseur(data: any) {
    return this.request<any>('/fournisseurs/commandes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCommandeFournisseurStatus(id: string, statut: string) {
    return this.request<any>(`/fournisseurs/commandes/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ statut }),
    });
  }

  async recevoirCommandeFournisseur(id: string, data: { lignes: Array<{ ligneId: string; quantiteRecue: number }>; notes?: string }) {
    return this.request<any>(`/fournisseurs/commandes/${id}/reception`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelCommandeFournisseur(id: string, raison?: string) {
    return this.request(`/fournisseurs/commandes/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ raison }),
    });
  }

  // ============ INVENTAIRES (INVENTORY COUNTS) ============
  async getInventaires(params?: { statut?: string; entrepotId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.statut) query.set('statut', params.statut);
    if (params?.entrepotId) query.set('entrepotId', params.entrepotId);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return this.request<any[]>(`/inventaires?${query.toString()}`);
  }

  async getInventaire(id: string) {
    return this.request<any>(`/inventaires/${id}`);
  }

  async createInventaire(data: { entrepotId?: string; notes?: string; produits?: string[] }) {
    return this.request<any>('/inventaires', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLigneInventaire(inventaireId: string, ligneId: string, data: { stockReel: number; notes?: string }) {
    return this.request<any>(`/inventaires/${inventaireId}/ligne/${ligneId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async finalizeInventaire(id: string) {
    return this.request<any>(`/inventaires/${id}/finalize`, {
      method: 'PUT',
    });
  }

  async cancelInventaire(id: string, raison?: string) {
    return this.request(`/inventaires/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ raison }),
    });
  }

  async getInventaireStats() {
    return this.request<any>('/inventaires/stats/summary');
  }

  // ============ STOCK ALERTS ============
  async getStockAlerts() {
    return this.request<any[]>('/stock/alerts');
  }

  async getLowStockProducts() {
    return this.request<any[]>('/stock/low-stock');
  }

  async getStockHistory(params?: { produitId?: string; type?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.produitId) query.set('produitId', params.produitId);
    if (params?.type) query.set('type', params.type);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return this.request<any[]>(`/stock/history?${query.toString()}`);
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
