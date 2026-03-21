'use client';

import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  UserCog, 
  Calculator, 
  Receipt, 
  BarChart3,
  Settings,
  LogOut,
  Building2,
  ShoppingCart,
  Warehouse,
  Truck,
  BookOpen,
  Target,
  DollarSign,
  Landmark
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/auth-store';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'produits', label: 'Produits', icon: Package },
  { id: 'factures', label: 'Factures', icon: FileText },
  { id: 'devis', label: 'Devis', icon: FileText },
  { id: 'commandes', label: 'Commandes', icon: ShoppingCart },
  { id: 'stock', label: 'Stock', icon: Warehouse },
  { id: 'fournisseurs', label: 'Fournisseurs', icon: Truck },
  { id: 'crm', label: 'CRM', icon: Target },
  { id: 'employes', label: 'Employés', icon: UserCog },
  { id: 'paie', label: 'Paie', icon: Calculator },
  { id: 'depenses', label: 'Dépenses', icon: Receipt },
  { id: 'comptabilite', label: 'Comptabilité OHADA', icon: BookOpen },
  { id: 'devises', label: 'Multi-Devises', icon: DollarSign },
  { id: 'rapports', label: 'Rapports', icon: BarChart3 },
];

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const { user, company, logout } = useAppStore();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900 text-white flex flex-col">
      {/* Logo & Company */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg">GuinéaManager</h1>
            <p className="text-xs text-slate-400">ERP pour PME</p>
          </div>
        </div>
        {company && (
          <div className="text-xs text-slate-400 bg-slate-800 rounded px-2 py-1 truncate">
            {company.nom}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-3 border-t border-slate-700 space-y-1">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 text-sm">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center font-semibold">
              {user.prenom[0]}{user.nom[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.prenom} {user.nom}</p>
              <p className="text-xs text-slate-400 truncate">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => onPageChange('settings')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            currentPage === 'settings'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          )}
        >
          <Settings className="w-5 h-5" />
          Paramètres
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
