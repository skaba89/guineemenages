'use client';

import * as React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Bell,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

// Variants pour les différents types de toast
const toastVariants = cva(
  'group relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 shadow-lg transition-all duration-300',
  {
    variants: {
      variant: {
        success: 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-white',
        error: 'border-red-200 bg-gradient-to-r from-red-50 to-white',
        warning: 'border-amber-200 bg-gradient-to-r from-amber-50 to-white',
        info: 'border-blue-200 bg-gradient-to-r from-blue-50 to-white',
        default: 'border-slate-200 bg-white',
        announcement: 'border-purple-200 bg-gradient-to-r from-purple-50 to-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const iconVariants = cva(
  'flex-shrink-0 w-5 h-5',
  {
    variants: {
      variant: {
        success: 'text-emerald-600',
        error: 'text-red-600',
        warning: 'text-amber-600',
        info: 'text-blue-600',
        default: 'text-slate-600',
        announcement: 'text-purple-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const progressBarVariants = cva(
  'absolute bottom-0 left-0 h-1 transition-all ease-linear',
  {
    variants: {
      variant: {
        success: 'bg-emerald-500',
        error: 'bg-red-500',
        warning: 'bg-amber-500',
        info: 'bg-blue-500',
        default: 'bg-slate-500',
        announcement: 'bg-purple-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Icônes par défaut selon le type
const defaultIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  default: Bell,
  announcement: Sparkles,
} as const;

export interface CustomToastProps extends VariantProps<typeof toastVariants> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  duration?: number;
  showProgress?: boolean;
  className?: string;
}

export function CustomToast({
  variant = 'default',
  title,
  description,
  icon,
  action,
  onClose,
  duration = 5000,
  showProgress = true,
  className,
}: CustomToastProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLeaving, setIsLeaving] = React.useState(false);
  const [progress, setProgress] = React.useState(100);
  
  const DefaultIcon = defaultIcons[variant || 'default'];

  React.useEffect(() => {
    // Animation d'entrée
    requestAnimationFrame(() => setIsVisible(true));

    // Auto-fermeture avec durée
    if (duration > 0) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
        
        if (remaining === 0) {
          clearInterval(interval);
          handleClose();
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  return (
    <div
      className={cn(
        toastVariants({ variant }),
        'transform transition-all duration-300 ease-out',
        isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0',
        className
      )}
      role="alert"
    >
      {/* Icône */}
      <div className={cn(iconVariants({ variant }))}>
        {icon || <DefaultIcon className="w-5 h-5" />}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">
          {title}
        </p>
        {description && (
          <p className="mt-1 text-sm text-slate-600">
            {description}
          </p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Bouton fermer */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Barre de progression */}
      {showProgress && duration > 0 && (
        <div 
          className={cn(progressBarVariants({ variant }))}
          style={{ width: `${progress}%` }}
        />
      )}
    </div>
  );
}

// Container pour les toasts
export interface ToastContainerProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

export function ToastContainer({ 
  children, 
  position = 'top-right',
  className 
}: ToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={cn(
        'fixed z-[100] flex flex-col gap-2 w-full max-w-sm p-4',
        positionClasses[position],
        className
      )}
    >
      {children}
    </div>
  );
}

// Hook pour gérer les toasts
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'default' | 'announcement';
  title: string;
  description?: string;
  duration?: number;
}

export function useCustomToast() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = React.useMemo(() => ({
    success: (title: string, description?: string) => 
      addToast({ type: 'success', title, description }),
    error: (title: string, description?: string) => 
      addToast({ type: 'error', title, description }),
    warning: (title: string, description?: string) => 
      addToast({ type: 'warning', title, description }),
    info: (title: string, description?: string) => 
      addToast({ type: 'info', title, description }),
    announce: (title: string, description?: string) => 
      addToast({ type: 'announcement', title, description }),
  }), [addToast]);

  return { toasts, addToast, removeToast, toast };
}

// Composant pour afficher une liste de toasts
export function ToastList({ 
  toasts, 
  onRemove 
}: { 
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}) {
  return (
    <ToastContainer>
      {toasts.map(toast => (
        <CustomToast
          key={toast.id}
          variant={toast.type}
          title={toast.title}
          description={toast.description}
          duration={toast.duration}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </ToastContainer>
  );
}

// Export d'un composant simplifié pour usage rapide
export function showToast(
  type: ToastMessage['type'],
  title: string,
  description?: string
) {
  // Cette fonction est un helper statique
  // Pour une utilisation complète, utilisez useCustomToast hook
  console.log(`[Toast ${type}] ${title}: ${description}`);
}

export default CustomToast;
