'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useCallback,
  type ReactNode 
} from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const toastIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: {
    bg: 'bg-gradient-to-r from-emerald-50 to-green-50',
    border: 'border-emerald-200',
    icon: 'text-emerald-600',
    title: 'text-emerald-900',
    description: 'text-emerald-700',
    progress: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-gradient-to-r from-red-50 to-rose-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    title: 'text-red-900',
    description: 'text-red-700',
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
    border: 'border-amber-200',
    icon: 'text-amber-600',
    title: 'text-amber-900',
    description: 'text-amber-700',
    progress: 'bg-amber-500',
  },
  info: {
    bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    description: 'text-blue-700',
    progress: 'bg-blue-500',
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const styles = toastStyles[toast.type];
  const Icon = toastIcons[toast.type];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border shadow-lg',
        'animate-slide-in-right',
        styles.bg,
        styles.border
      )}
    >
      <div className="p-4 flex items-start gap-3">
        <div className={cn('mt-0.5', styles.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('font-semibold text-sm', styles.title)}>
            {toast.title}
          </p>
          {toast.description && (
            <p className={cn('text-xs mt-0.5', styles.description)}>
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={onRemove}
          className={cn(
            'p-1 rounded-lg transition-colors',
            'hover:bg-black/5 active:bg-black/10'
          )}
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
      {/* Progress bar */}
      <div 
        className={cn('h-1 progress-bar', styles.progress)}
        style={{ 
          animation: `shrink ${toast.duration || 5000}ms linear forwards` 
        }}
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((title: string, description?: string) => {
    addToast({ type: 'success', title, description });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    addToast({ type: 'error', title, description });
  }, [addToast]);

  const warning = useCallback((title: string, description?: string) => {
    addToast({ type: 'warning', title, description });
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    addToast({ type: 'info', title, description });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
