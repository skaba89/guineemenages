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
import { useAppStore } from '@/stores/auth-store';

const pageConfig: Record<string, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Tableau de bord', subtitle: 'Vue d\'ensemble de votre activité' },
  clients: { title: 'Clients', subtitle: 'Gestion de vos clients' },
  produits: { title: 'Produits', subtitle: 'Catalogue et stocks' },
  factures: { title: 'Factures', subtitle: 'Facturation et paiements' },
  employes: { title: 'Employés', subtitle: 'Gestion du personnel' },
  paie: { title: 'Paie', subtitle: 'Bulletins de paie et salaires' },
  depenses: { title: 'Dépenses', subtitle: 'Suivi des dépenses' },
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
      case 'employes':
        return <EmployesPage />;
      case 'paie':
        return <PaiePage />;
      case 'depenses':
        return <DepensesPage />;
      case 'rapports':
        return <RapportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  const config = pageConfig[currentPage] || pageConfig.dashboard;

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="ml-64">
        <Header title={config.title} subtitle={config.subtitle} />
        <main className="p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
