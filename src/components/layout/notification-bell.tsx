'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Clock, FileText, Package, Users, Wallet, AlertTriangle, X, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useNotifications, type Notification } from '@/hooks/use-notifications';

interface NotificationBellProps {
  onNavigate?: (url: string) => void;
}

// Icon mapping for notification types
const notificationIcons: Record<string, React.ReactNode> = {
  FACTURE: <FileText className="w-4 h-4" />,
  STOCK: <Package className="w-4 h-4" />,
  PAIE: <Wallet className="w-4 h-4" />,
  EMPLOYE: <Users className="w-4 h-4" />,
  PAIEMENT: <Wallet className="w-4 h-4" />,
  SUBSCRIPTION: <Clock className="w-4 h-4" />,
  SUMMARY: <FileText className="w-4 h-4" />,
};

// Type colors
const typeColors: Record<string, string> = {
  INFO: 'text-blue-600 bg-blue-100',
  WARNING: 'text-amber-600 bg-amber-100',
  SUCCESS: 'text-emerald-600 bg-emerald-100',
  ERROR: 'text-red-600 bg-red-100',
};

export function NotificationBell({ onNavigate }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.lu) {
      await markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      if (onNavigate) {
        onNavigate(notification.actionUrl);
      }
      setIsOpen(false);
    }
  };

  // Format relative time
  const formatRelativeTime = (date: string): string => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return notificationDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Get recent notifications (last 10)
  const recentNotifications = notifications.slice(0, 10);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
      >
        <Bell className={cn(
          "w-5 h-5 transition-colors",
          unreadCount > 0 ? "text-emerald-600" : "text-slate-600"
        )} />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs h-8 px-2"
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1" />
                  Tout marquer lu
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="max-h-96">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">
                <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-emerald-600 rounded-full mx-auto mb-2" />
                Chargement...
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Aucune notification</p>
                <p className="text-slate-400 text-xs mt-1">
                  Les nouvelles notifications apparaîtront ici
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "p-4 cursor-pointer transition-colors hover:bg-slate-50",
                      !notification.lu && "bg-emerald-50/50"
                    )}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                        typeColors[notification.type] || typeColors.INFO
                      )}>
                        {notificationIcons[notification.actionType || ''] || <Bell className="w-4 h-4" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            !notification.lu && "text-slate-900",
                            notification.lu && "text-slate-600"
                          )}>
                            {notification.titre}
                          </p>
                          {!notification.lu && (
                            <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-400">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                          {notification.actionUrl && (
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <>
              <Separator />
              <div className="p-3 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-600"
                  onClick={() => {
                    // Navigate to notifications page
                    if (onNavigate) {
                      onNavigate('/notifications');
                    }
                    setIsOpen(false);
                  }}
                >
                  Voir toutes les notifications
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
