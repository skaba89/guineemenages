'use client';

import { useState, useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { useToast } from './use-toast';
import api from '@/lib/api';

// Types
export interface Notification {
  id: string;
  titre: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  lu: boolean;
  actionUrl?: string;
  actionType?: string;
  actionId?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  // Per-type settings
  invoiceCreated: boolean;
  invoicePaid: boolean;
  invoiceReminder: boolean;
  payrollReady: boolean;
  stockAlert: boolean;
  employeeHired: boolean;
  subscriptionExpiring: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isPushSupported: boolean;
  isPushEnabled: boolean;
  vapidPublicKey: string | null;
  preferences: NotificationPreferences;
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
  setPushEnabled: (enabled: boolean) => void;
  setPreferences: (prefs: NotificationPreferences) => void;
}

// Zustand store for notifications
export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isPushSupported: typeof window !== 'undefined' && 'PushManager' in window && 'serviceWorker' in navigator,
  isPushEnabled: false,
  vapidPublicKey: null,
  preferences: {
    email: true,
    sms: false,
    push: true,
    invoiceCreated: true,
    invoicePaid: true,
    invoiceReminder: true,
    payrollReady: true,
    stockAlert: true,
    employeeHired: true,
    subscriptionExpiring: true,
  },
  
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setLoading: (loading) => set({ isLoading: loading }),
  setPushEnabled: (enabled) => set({ isPushEnabled: enabled }),
  setPreferences: (prefs) => set({ preferences: prefs }),
}));

// Main hook for notification management
export function useNotifications() {
  const { toast } = useToast();
  const {
    notifications,
    unreadCount,
    isLoading,
    isPushSupported,
    isPushEnabled,
    preferences,
    setNotifications,
    setUnreadCount,
    setLoading,
    setPushEnabled,
    setPreferences,
  } = useNotificationStore();

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getNotifications();
      if (response.success && response.data) {
        const data = response.data as any;
        setNotifications(data.data || data);
        setUnreadCount(data.unreadCount || (Array.isArray(data) ? data.filter((n: Notification) => !n.lu).length : 0));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [setNotifications, setUnreadCount, setLoading]);

  // Fetch notification preferences
  const fetchPreferences = useCallback(async () => {
    try {
      const response = await api.getNotificationSettings();
      if (response.success && response.data) {
        setPreferences(response.data as NotificationPreferences);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  }, [setPreferences]);

  // Get VAPID public key
  const getVapidKey = useCallback(async (): Promise<string | null> => {
    try {
      const token = localStorage.getItem('guineamanager-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/notifications/vapid-key`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      return data.success ? data.data.publicKey : null;
    } catch (error) {
      console.error('Error getting VAPID key:', error);
      return null;
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported) {
      toast({
        title: 'Non supporté',
        description: 'Les notifications push ne sont pas supportées par ce navigateur.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        return true;
      } else if (permission === 'denied') {
        toast({
          title: 'Permission refusée',
          description: 'Les notifications ont été bloquées. Veuillez les autoriser dans les paramètres de votre navigateur.',
          variant: 'destructive',
        });
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isPushSupported, toast]);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported) return false;

    try {
      // Request permission first
      const hasPermission = await requestPermission();
      if (!hasPermission) return false;

      // Get VAPID public key
      const vapidKey = await getVapidKey();
      if (!vapidKey) {
        toast({
          title: 'Erreur de configuration',
          description: 'Impossible de récupérer la clé de notification.',
          variant: 'destructive',
        });
        return false;
      }

      // Register service worker
      let registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Send subscription to server
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('guineamanager-token')}`,
        },
        body: JSON.stringify(subscription.toJSON()),
      });

      const data = await response.json();
      if (data.success) {
        setPushEnabled(true);
        toast({
          title: 'Notifications activées',
          description: 'Vous recevrez désormais des notifications push.',
        });
        return true;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de s\'abonner aux notifications push.',
        variant: 'destructive',
      });
      return false;
    }
  }, [isPushSupported, requestPermission, getVapidKey, setPushEnabled, toast]);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Get endpoint for server
        const endpoint = subscription.endpoint;
        
        // Unsubscribe locally
        await subscription.unsubscribe();
        
        // Notify server
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/notifications/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('guineamanager-token')}`,
          },
          body: JSON.stringify({ endpoint }),
        });
      }

      setPushEnabled(false);
      toast({
        title: 'Notifications désactivées',
        description: 'Vous ne recevrez plus de notifications push.',
      });
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de se désabonner des notifications push.',
        variant: 'destructive',
      });
      return false;
    }
  }, [isPushSupported, setPushEnabled, toast]);

  // Toggle push notifications
  const togglePush = useCallback(async (): Promise<void> => {
    if (isPushEnabled) {
      await unsubscribeFromPush();
    } else {
      await subscribeToPush();
    }
  }, [isPushEnabled, subscribeToPush, unsubscribeFromPush]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const response = await api.markNotificationRead(notificationId);
      if (response.success) {
        setNotifications(
          notifications.map(n => n.id === notificationId ? { ...n, lu: true } : n)
        );
        setUnreadCount(Math.max(0, unreadCount - 1));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, [notifications, unreadCount, setNotifications, setUnreadCount]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const response = await api.markAllNotificationsRead();
      if (response.success) {
        setNotifications(notifications.map(n => ({ ...n, lu: true })));
        setUnreadCount(0);
        toast({
          title: 'Notifications lues',
          description: 'Toutes les notifications ont été marquées comme lues.',
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }, [notifications, setNotifications, setUnreadCount, toast]);

  // Update notification preferences
  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>): Promise<boolean> => {
    try {
      const response = await api.updateNotificationSettings({ ...preferences, ...newPrefs });
      if (response.success) {
        setPreferences({ ...preferences, ...newPrefs });
        toast({
          title: 'Préférences mises à jour',
          description: 'Vos préférences de notification ont été enregistrées.',
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }, [preferences, setPreferences, toast]);

  // Show notification toast
  const showNotificationToast = useCallback((notification: Notification) => {
    const variant = notification.type === 'ERROR' ? 'destructive' : 
                   notification.type === 'WARNING' ? 'default' : 
                   notification.type === 'SUCCESS' ? 'default' : 'default';

    toast({
      title: notification.titre,
      description: notification.message,
      variant,
    });
  }, [toast]);

  // Check initial push subscription status
  const checkPushStatus = useCallback(async () => {
    if (!isPushSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setPushEnabled(!!subscription);
    } catch (error) {
      console.error('Error checking push status:', error);
    }
  }, [isPushSupported, setPushEnabled]);

  // Initialize on mount
  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
    checkPushStatus();
  }, [fetchNotifications, fetchPreferences, checkPushStatus]);

  // Set up periodic polling for notifications (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    // State
    notifications,
    unreadCount,
    isLoading,
    isPushSupported,
    isPushEnabled,
    preferences,
    
    // Actions
    fetchNotifications,
    subscribeToPush,
    unsubscribeFromPush,
    togglePush,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    showNotificationToast,
  };
}

// Helper: Convert base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default useNotifications;
