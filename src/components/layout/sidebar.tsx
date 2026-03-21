'use client';

import { useState, useEffect } from 'react';
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
  Menu,
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, color: 'text-emerald-500' },
  { id: 'clients', label: 'Clients', icon: Users, color: 'text-blue-500' },
  { id: 'produits', label: 'Produits', icon: Package, color: 'text-purple-500' },
  { id: 'factures', label: 'Factures', icon: FileText, color: 'text-emerald-500' },
  { id: 'devis', label: 'Devis', icon: FileText, color: 'text-amber-500' },
  { id: 'commandes', label: 'Commandes', icon: ShoppingCart, color: 'text-pink-500' },
  { id: 'stock', label: 'Stock', icon: Warehouse, color: 'text-orange-500' },
  { id: 'fournisseurs', label: 'Fournisseurs', icon: Truck, color: 'text-teal-500' },
  { id: 'crm', label: 'CRM', icon: Target, color: 'text-indigo-500' },
  { id: 'employes', label: 'Employés', icon: UserCog, color: 'text-cyan-500' },
  { id: 'paie', label: 'Paie', icon: Calculator, color: 'text-green-500' },
  { id: 'depenses', label: 'Dépenses', icon: Receipt, color: 'text-red-500' },
  { id: 'comptabilite', label: 'Comptabilité OHADA', icon: BookOpen, color: 'text-violet-500' },
  { id: 'devises', label: 'Multi-Devises', icon: DollarSign, color: 'text-yellow-500' },
  { id: 'rapports', label: 'Rapports', icon: BarChart3, color: 'text-slate-500' },
];

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const { user, company, logout } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close sidebar on page change (mobile)
  const handlePageChange = (page: string) => {
    onPageChange(page);
    setIsOpen(false);
  };

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 ease-out',
        // Desktop: always visible
        'lg:translate-x-0',
        isCollapsed ? 'lg:w-20' : 'lg:w-64',
        // Mobile: slide in/out
        isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'
      )}>
        {/* Logo & Company */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900 flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div className={cn(
              'flex-1 min-w-0 transition-opacity',
              isCollapsed && 'lg:opacity-0 lg:hidden'
            )}>
              <h1 className="font-bold text-lg truncate">GuinéaManager</h1>
              <p className="text-xs text-slate-400">ERP pour PME</p>
            </div>
            
            {/* Mobile close button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Desktop collapse button */}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                'hidden lg:flex p-2 hover:bg-slate-800 rounded-lg transition-all',
                isCollapsed && 'rotate-180'
              )}
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          {company && !isCollapsed && (
            <div className="mt-3 text-xs text-slate-400 bg-slate-800/50 rounded-lg px-2.5 py-1.5 truncate">
              {company.nom}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                  isCollapsed && 'lg:justify-center lg:px-2'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={cn(
                  'w-5 h-5 flex-shrink-0',
                  isActive ? 'text-white' : item.color,
                  'group-hover:scale-110 transition-transform'
                )} />
                <span className={cn(
                  'truncate',
                  isCollapsed && 'lg:hidden'
                )}>
                  {item.label}
                </span>
                {isActive && !isCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User & Logout */}
        <div className="p-3 border-t border-slate-700/50 space-y-1">
          {user && (
            <div className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm rounded-xl bg-slate-800/50',
              isCollapsed && 'lg:justify-center lg:px-2'
            )}>
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center font-semibold text-sm shadow-lg">
                {user.prenom[0]}{user.nom[0]}
              </div>
              <div className={cn(
                'flex-1 min-w-0',
                isCollapsed && 'lg:hidden'
              )}>
                <p className="font-medium truncate">{user.prenom} {user.nom}</p>
                <p className="text-xs text-slate-400 truncate">{user.role}</p>
              </div>
            </div>
          )}
          
          <button
            onClick={() => handlePageChange('settings')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              currentPage === 'settings'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white',
              isCollapsed && 'lg:justify-center lg:px-2'
            )}
          >
            <Settings className="w-5 h-5" />
            <span className={cn(isCollapsed && 'lg:hidden')}>Paramètres</span>
          </button>
          
          <button
            onClick={logout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all duration-200',
              isCollapsed && 'lg:justify-center lg:px-2'
            )}
          >
            <LogOut className="w-5 h-5" />
            <span className={cn(isCollapsed && 'lg:hidden')}>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Spacer for desktop */}
      <div className={cn(
        'hidden lg:block flex-shrink-0 transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )} />
    </>
  );
}
