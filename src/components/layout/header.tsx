'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Plus,
  Command,
  FileText,
  Users,
  Package,
  Calculator,
  Settings,
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Building2,
  Target,
  DollarSign,
  BookOpen,
  X,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  currentPage?: string;
  onPageChange?: (page: string) => void;
}

const pageNames: Record<string, string> = {
  dashboard: 'Tableau de bord',
  clients: 'Clients',
  produits: 'Produits',
  factures: 'Factures',
  devis: 'Devis',
  commandes: 'Commandes',
  stock: 'Stock',
  fournisseurs: 'Fournisseurs',
  crm: 'CRM',
  employes: 'Employés',
  paie: 'Paie',
  depenses: 'Dépenses',
  comptabilite: 'Comptabilité OHADA',
  devises: 'Multi-Devises',
  rapports: 'Rapports',
  settings: 'Paramètres',
};

const quickActions = [
  { id: 'new-invoice', label: 'Nouvelle facture', icon: FileText, page: 'factures', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { id: 'new-client', label: 'Nouveau client', icon: Users, page: 'clients', color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 'new-product', label: 'Nouveau produit', icon: Package, page: 'produits', color: 'text-purple-600', bg: 'bg-purple-100' },
  { id: 'new-quote', label: 'Nouveau devis', icon: Receipt, page: 'devis', color: 'text-amber-600', bg: 'bg-amber-100' },
  { id: 'new-order', label: 'Nouvelle commande', icon: ShoppingCart, page: 'commandes', color: 'text-pink-600', bg: 'bg-pink-100' },
  { id: 'new-prospect', label: 'Nouveau prospect', icon: Target, page: 'crm', color: 'text-indigo-600', bg: 'bg-indigo-100' },
];

const allPages = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, description: 'Vue d\'ensemble' },
  { id: 'clients', label: 'Clients', icon: Users, description: 'Gérer vos clients' },
  { id: 'produits', label: 'Produits', icon: Package, description: 'Catalogue et stocks' },
  { id: 'factures', label: 'Factures', icon: FileText, description: 'Facturation et paiements' },
  { id: 'devis', label: 'Devis', icon: Receipt, description: 'Gestion des devis' },
  { id: 'commandes', label: 'Commandes', icon: ShoppingCart, description: 'Suivi des commandes' },
  { id: 'stock', label: 'Stock', icon: Package, description: 'Gestion avancée' },
  { id: 'fournisseurs', label: 'Fournisseurs', icon: Building2, description: 'Gestion des fournisseurs' },
  { id: 'crm', label: 'CRM', icon: Target, description: 'Prospects et opportunités' },
  { id: 'employes', label: 'Employés', icon: Users, description: 'Gestion du personnel' },
  { id: 'paie', label: 'Paie', icon: Calculator, description: 'Bulletins de paie' },
  { id: 'depenses', label: 'Dépenses', icon: Receipt, description: 'Suivi des dépenses' },
  { id: 'comptabilite', label: 'Comptabilité OHADA', icon: BookOpen, description: 'Plan comptable' },
  { id: 'devises', label: 'Multi-Devises', icon: DollarSign, description: 'Taux de change' },
  { id: 'rapports', label: 'Rapports', icon: FileText, description: 'Analyses et stats' },
  { id: 'settings', label: 'Paramètres', icon: Settings, description: 'Configuration' },
];

export function Header({ currentPage = 'dashboard', onPageChange }: HeaderProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShortcut, setSelectedShortcut] = useState(0);

  const pageName = pageNames[currentPage] || currentPage;

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
      if (e.key === 'Escape') {
        setCommandOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter results
  const filteredPages = searchQuery 
    ? allPages.filter(p => 
        p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allPages;

  const filteredActions = searchQuery
    ? quickActions.filter(a =>
        a.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : quickActions;

  const handleSelect = (page: string) => {
    if (onPageChange) {
      onPageChange(page);
    }
    setCommandOpen(false);
    setSearchQuery('');
    setSelectedShortcut(0);
  };

  return (
    <>
      <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1 text-sm">
            <button 
              onClick={() => handleSelect('dashboard')}
              className="text-slate-500 hover:text-slate-900 transition-colors"
            >
              Accueil
            </button>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-900">{pageName}</span>
          </div>
          <span className="lg:hidden font-semibold text-slate-900">{pageName}</span>
        </div>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Command Palette Button */}
          <Button
            variant="outline"
            className="hidden md:flex items-center gap-2 px-3 h-9 text-slate-500 hover:text-slate-900 bg-slate-50/50 hover:bg-slate-100 border-slate-200"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="w-4 h-4" />
            <span className="text-sm hidden lg:inline">Rechercher...</span>
            <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-slate-100 rounded border border-slate-200">
              <Command className="w-3 h-3" />
              K
            </kbd>
          </Button>

          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="w-5 h-5" />
          </Button>

          {/* Quick Add Button */}
          <Button 
            className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-500/25"
            size="sm"
            onClick={() => setCommandOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Actions rapides</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
        </div>
      </header>

      {/* Command Palette Dialog */}
      <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogContent className="p-0 gap-0 max-w-xl top-[10%] translate-y-0">
          {/* Search Input */}
          <div className="flex items-center border-b px-4">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une page, une action..."
              className="border-0 focus-visible:ring-0 text-base h-12"
              autoFocus
            />
            <kbd className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {/* Quick Actions */}
            {filteredActions.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Actions rapides
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {filteredActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleSelect(action.page)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-slate-100"
                      >
                        <div className={cn('p-2 rounded-lg', action.bg)}>
                          <Icon className={cn('w-4 h-4', action.color)} />
                        </div>
                        <span className="font-medium text-sm">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pages */}
            {filteredPages.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Pages
                </div>
                <div className="space-y-0.5">
                  {filteredPages.map((page) => {
                    const Icon = page.icon;
                    return (
                      <button
                        key={page.id}
                        onClick={() => handleSelect(page.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-slate-400" />
                          <div>
                            <span className="font-medium text-sm">{page.label}</span>
                            <p className="text-xs text-slate-400">{page.description}</p>
                          </div>
                        </div>
                        {currentPage === page.id && (
                          <Badge variant="secondary" className="text-xs">Actif</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchQuery && filteredPages.length === 0 && filteredActions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Search className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-900">Aucun résultat</p>
                <p className="text-xs text-slate-500 mt-1">Essayez avec d'autres termes</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-slate-400 bg-slate-50/50">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white rounded border">↓</kbd>
                pour naviguer
              </span>
              <span className="hidden sm:flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border">↵</kbd>
                pour sélectionner
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Recherche intelligente</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
