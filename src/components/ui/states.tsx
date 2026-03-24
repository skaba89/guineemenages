'use client';

import { cn } from '@/lib/utils';
import { 
  FileText, 
  Users, 
  Package, 
  ShoppingCart, 
  Target,
  DollarSign,
  Calculator,
  FolderOpen,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ==================== SKELETON COMPONENTS ====================

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('skeleton rounded-md', className)} />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-white p-6 space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="border-b bg-slate-50 p-4">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white border">
          <Skeleton className="h-11 w-11 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ==================== EMPTY STATE COMPONENTS ====================

const iconMap = {
  invoice: FileText,
  client: Users,
  product: Package,
  order: ShoppingCart,
  prospect: Target,
  expense: DollarSign,
  payroll: Calculator,
  default: FolderOpen,
};

interface EmptyStateProps {
  type?: 'invoice' | 'client' | 'product' | 'order' | 'prospect' | 'expense' | 'payroll' | 'default';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ElementType;
}

export function EmptyState({ type = 'default', title, description, action, icon: CustomIcon }: EmptyStateProps) {
  const Icon = CustomIcon || iconMap[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="relative mb-6">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full blur-2xl opacity-50 scale-150" />
        
        {/* Icon container */}
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
          <Icon className="w-10 h-10 text-slate-400" />
        </div>
        
        {/* Decorative dots */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse animation-delay-300" />
      </div>

      <h3 className="text-xl font-semibold text-slate-900 mb-2 text-center">
        {title}
      </h3>
      <p className="text-slate-500 text-center max-w-sm mb-6">
        {description}
      </p>

      {action && (
        <Button 
          onClick={action.onClick}
          className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600"
        >
          <Plus className="w-4 h-4" />
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ==================== LOADING STATE ====================

export function LoadingState({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-12 h-12 rounded-full border-4 border-slate-200" />
        
        {/* Spinning arc */}
        <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
      </div>
      <p className="mt-4 text-slate-500 text-sm animate-pulse">{message}</p>
    </div>
  );
}

// ==================== ERROR STATE ====================

interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export function ErrorState({ title = 'Oups !', message, retry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      
      <h3 className="text-xl font-semibold text-slate-900 mb-2">
        {title}
      </h3>
      <p className="text-slate-500 text-center max-w-sm mb-6">
        {message}
      </p>

      {retry && (
        <Button variant="outline" onClick={retry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}

// ==================== SUCCESS STATE ====================

interface SuccessStateProps {
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function SuccessState({ title, message, action }: SuccessStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-scale-in">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        {/* Success ripple */}
        <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-emerald-400 animate-ping opacity-25" />
      </div>

      <h3 className="text-xl font-semibold text-slate-900 mb-2 text-center">
        {title}
      </h3>
      {message && (
        <p className="text-slate-500 text-center max-w-sm mb-6">
          {message}
        </p>
      )}

      {action && (
        <Button onClick={action.onClick} className="gap-2">
          {action.label}
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
