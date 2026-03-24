'use client';

import * as React from 'react';
import { LucideIcon, FileText, Users, Package, ShoppingCart, FileSpreadsheet, FolderOpen, Search, AlertCircle, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Types prédéfinis pour les états vides courants
export type EmptyStateType = 
  | 'invoices' 
  | 'clients' 
  | 'products' 
  | 'orders' 
  | 'employees'
  | 'documents'
  | 'search'
  | 'error'
  | 'default';

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor: string;
  iconBgColor: string;
}

const emptyStateConfigs: Record<EmptyStateType, EmptyStateConfig> = {
  invoices: {
    icon: FileText,
    title: 'Aucune facture',
    description: 'Commencez par créer votre première facture pour suivre vos ventes.',
    iconColor: 'text-emerald-600',
    iconBgColor: 'bg-emerald-100',
  },
  clients: {
    icon: Users,
    title: 'Aucun client',
    description: 'Ajoutez vos premiers clients pour commencer à gérer vos relations commerciales.',
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-100',
  },
  products: {
    icon: Package,
    title: 'Aucun produit',
    description: 'Créez votre catalogue de produits pour commencer à vendre.',
    iconColor: 'text-amber-600',
    iconBgColor: 'bg-amber-100',
  },
  orders: {
    icon: ShoppingCart,
    title: 'Aucune commande',
    description: 'Les commandes de vos clients apparaîtront ici.',
    iconColor: 'text-purple-600',
    iconBgColor: 'bg-purple-100',
  },
  employees: {
    icon: Users,
    title: 'Aucun employé',
    description: 'Ajoutez vos collaborateurs pour gérer votre équipe.',
    iconColor: 'text-indigo-600',
    iconBgColor: 'bg-indigo-100',
  },
  documents: {
    icon: FolderOpen,
    title: 'Aucun document',
    description: 'Importez vos documents pour les retrouver facilement.',
    iconColor: 'text-slate-600',
    iconBgColor: 'bg-slate-100',
  },
  search: {
    icon: Search,
    title: 'Aucun résultat',
    description: 'Essayez de modifier vos critères de recherche.',
    iconColor: 'text-slate-500',
    iconBgColor: 'bg-slate-100',
  },
  error: {
    icon: AlertCircle,
    title: 'Une erreur est survenue',
    description: 'Impossible de charger les données. Veuillez réessayer.',
    iconColor: 'text-red-600',
    iconBgColor: 'bg-red-100',
  },
  default: {
    icon: Inbox,
    title: 'Aucune donnée',
    description: 'Les données apparaîtront ici une fois disponibles.',
    iconColor: 'text-slate-500',
    iconBgColor: 'bg-slate-100',
  },
};

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  type = 'default',
  title,
  description,
  icon: CustomIcon,
  iconColor,
  iconBgColor,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const config = emptyStateConfigs[type];
  const Icon = CustomIcon || config.icon;
  
  const sizeClasses = {
    sm: {
      container: 'py-6',
      icon: 'h-12 w-12',
      iconContainer: 'p-2',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      icon: 'h-14 w-14',
      iconContainer: 'p-3',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'py-20',
      icon: 'h-20 w-20',
      iconContainer: 'p-4',
      title: 'text-xl',
      description: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center animate-fade-in',
      sizes.container,
      className
    )}>
      {/* Icône avec animation */}
      <div className={cn(
        'rounded-full mb-4 animate-scale-in',
        sizes.iconContainer,
        iconBgColor || config.iconBgColor
      )}>
        <Icon className={cn(
          sizes.icon,
          iconColor || config.iconColor,
          'animate-float'
        )} />
      </div>

      {/* Titre */}
      <h3 className={cn(
        'font-semibold text-slate-900 mb-2',
        sizes.title
      )}>
        {title || config.title}
      </h3>

      {/* Description */}
      <p className={cn(
        'text-slate-500 max-w-sm mb-6',
        sizes.description
      )}>
        {description || config.description}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {action && (
          <Button
            onClick={action.onClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
          >
            {action.icon && <action.icon className="w-4 h-4 mr-2" />}
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            className="transition-all hover:-translate-y-0.5"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

// Composant pour état vide dans un tableau
export function TableEmptyState({
  type = 'default',
  title,
  description,
  action,
  colSpan = 1,
}: EmptyStateProps & { colSpan?: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <EmptyState
          type={type}
          title={title}
          description={description}
          action={action}
          size="sm"
        />
      </td>
    </tr>
  );
}

// Composant pour état vide dans une carte
export function CardEmptyState({
  type = 'default',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border bg-card p-8">
      <EmptyState
        type={type}
        title={title}
        description={description}
        action={action}
        size="sm"
      />
    </div>
  );
}

// Composant pour état de recherche vide
export function SearchEmptyState({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <EmptyState
      type="search"
      title={`Aucun résultat pour "${query}"`}
      description="Vérifiez l'orthographe ou essayez avec d'autres termes."
      action={{
        label: 'Effacer la recherche',
        onClick: onClear,
      }}
    />
  );
}

// Composant pour erreur de chargement
export function ErrorState({
  onRetry,
  message,
}: {
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <EmptyState
      type="error"
      description={message || 'Impossible de charger les données. Veuillez réessayer.'}
      action={onRetry ? {
        label: 'Réessayer',
        onClick: onRetry,
      } : undefined}
    />
  );
}

export default EmptyState;
