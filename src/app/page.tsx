'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { LoginPage } from '@/components/pages/login-page';
import { RegisterPage } from '@/components/pages/register-page';
import { DashboardPage } from '@/components/pages/dashboard-page';
import { ClientsPage } from '@/components/pages/clients-page';
import { ProduitsPage } from '@/components/pages/produits-page';
import { FacturesPage } from '@/components/pages/factures-page';
import { EmployesPage } from '@/components/pages/employes-page';
import { PaiePage } from '@/components/pages/paie-page';
import { DepensesPage } from '@/components/pages/depenses-page';
import { RapportsPage } from '@/components/pages/rapports-page';
import { SettingsPage } from '@/components/pages/settings-page';
import { DevisPage } from '@/components/pages/devis-page';
import { CommandesPage } from '@/components/pages/commandes-page';
import { StockPage } from '@/components/pages/stock-page';
import { FournisseursPage } from '@/components/pages/fournisseurs-page';
import { ComptabilitePage } from '@/components/pages/comptabilite-page';
import { CRMPage } from '@/components/pages/crm-page';
import { DevisesPage } from '@/components/pages/devises-page';
import { useAppStore } from '@/stores/auth-store';

const pageConfig: Record<string, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Tableau de bord', subtitle: 'Vue d\'ensemble de votre activité' },
  clients: { title: 'Clients', subtitle: 'Gestion de vos clients' },
  produits: { title: 'Produits', subtitle: 'Catalogue et stocks' },
  factures: { title: 'Factures', subtitle: 'Facturation et paiements' },
  devis: { title: 'Devis', subtitle: 'Gestion des devis clients' },
  commandes: { title: 'Commandes', subtitle: 'Suivi des commandes clients' },
  stock: { title: 'Stock', subtitle: 'Gestion avancée des stocks' },
  fournisseurs: { title: 'Fournisseurs', subtitle: 'Gestion des fournisseurs' },
  crm: { title: 'CRM', subtitle: 'Gestion des prospects et opportunités' },
  employes: { title: 'Employés', subtitle: 'Gestion du personnel' },
  paie: { title: 'Paie', subtitle: 'Bulletins de paie et salaires' },
  depenses: { title: 'Dépenses', subtitle: 'Suivi des dépenses' },
  comptabilite: { title: 'Comptabilité OHADA', subtitle: 'Plan comptable Syscohada révisé' },
  devises: { title: 'Multi-Devises', subtitle: 'Taux de change et conversions' },
  rapports: { title: 'Rapports', subtitle: 'Analyses et statistiques' },
  settings: { title: 'Paramètres', subtitle: 'Configuration du compte' },
};

export default function Home() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { isAuthenticated, login, register } = useAppStore();

  const handleLogin = async (email: string, password: string) => {
    const result = await login(email, password);
    return result;
  };

  const handleRegister = async (data: { email: string; password: string; nom: string; prenom: string; companyName: string }) => {
    const result = await register(data);
    return result;
  };

  if (!isAuthenticated) {
    if (authMode === 'register') {
      return (
        <RegisterPage
          onRegister={handleRegister}
          onSwitchToLogin={() => setAuthMode('login')}
        />
      );
    }
    return (
      <LoginPage
        onLogin={handleLogin}
        onSwitchToRegister={() => setAuthMode('register')}
      />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'clients':
        return <ClientsPage />;
      case 'produits':
        return <ProduitsPage />;
      case 'factures':
        return <FacturesPage />;
      case 'devis':
        return <DevisPage />;
      case 'commandes':
        return <CommandesPage />;
      case 'stock':
        return <StockPage />;
      case 'fournisseurs':
        return <FournisseursPage />;
      case 'crm':
        return <CRMPage />;
      case 'employes':
        return <EmployesPage />;
      case 'paie':
        return <PaiePage />;
      case 'depenses':
        return <DepensesPage />;
      case 'comptabilite':
        return <ComptabilitePage />;
      case 'devises':
        return <DevisesPage />;
      case 'rapports':
        return <RapportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header 
          title="" 
          subtitle="" 
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
