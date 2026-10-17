import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { workspaceService } from '../services/workspaceService';
import { socketService } from '../services/socket';

export interface NotificationItem {
  id: string;
  type: 'followup' | 'payment' | 'policy' | 'commission' | 'system';
  title: string;
  description: string;
  time: string;
  timestamp: number;
  unread: boolean;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  filteredNotifs: NotificationItem[];
  unreadCount: number;
  filter: 'all' | 'followup' | 'payment' | 'policy';
  setFilter: (filter: 'all' | 'followup' | 'payment' | 'policy') => void;
  markAllRead: () => void;
  markSingleRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  refresh: () => Promise<void>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function formatRelativeTime(dateInput?: string | number | Date): string {
  if (!dateInput) return 'Recently';
  const now = Date.now();
  const time = new Date(dateInput).getTime();
  const diffSec = Math.floor((now - time) / 1000);
  if (isNaN(diffSec)) return 'Recently';
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'followup' | 'payment' | 'policy'>('all');
  const [isOpen, setIsOpen] = useState(false);

  const storageUserKey = user?.id || 'default_user';
  const CLEARED_AT_KEY = `prosurance_notifs_cleared_at_${storageUserKey}`;
  const DISMISSED_IDS_KEY = `prosurance_notifs_dismissed_${storageUserKey}`;
  const READ_IDS_KEY = `prosurance_notifs_read_${storageUserKey}`;

  // Helper to load dismissed & read IDs
  const getDismissedIds = useCallback((): string[] => {
    try {
      const saved = localStorage.getItem(DISMISSED_IDS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [DISMISSED_IDS_KEY]);

  const getReadIds = useCallback((): string[] => {
    try {
      const saved = localStorage.getItem(READ_IDS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [READ_IDS_KEY]);

  const getClearedAt = useCallback((): number => {
    try {
      const saved = localStorage.getItem(CLEARED_AT_KEY);
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  }, [CLEARED_AT_KEY]);

  // Load real notifications from backend
  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const clearedAt = getClearedAt();
    const dismissedIds = getDismissedIds();
    const readIds = getReadIds();

    try {
      const [followups, policies] = await Promise.all([
        workspaceService.getFollowups().catch(() => []),
        workspaceService.getPolicies().catch(() => []),
      ]);

      const items: NotificationItem[] = [];

      // 1. Follow-ups pending
      if (Array.isArray(followups)) {
        followups.forEach((f: any) => {
          if (f.result !== 'Renewal Confirmed') {
            const notifId = `fol-${f._id}`;
            const timeVal = f.createdAt ? new Date(f.createdAt).getTime() : Date.now();
            if (timeVal > clearedAt && !dismissedIds.includes(notifId)) {
              items.push({
                id: notifId,
                type: 'followup',
                title: f.result || 'Follow-Up Call Due',
                description: `${f.customerId?.name || 'Customer'}: ${f.notes || 'Renewal reminder call pending'}`,
                time: formatRelativeTime(f.createdAt),
                timestamp: timeVal,
                unread: !readIds.includes(notifId),
              });
            }
          }
        });
      }

      // 2. Policies due soon (within 7 days or overdue)
      if (Array.isArray(policies)) {
        const now = Date.now();
        policies.forEach((p: any) => {
          if (!p.expiryDate) return;
          const expiryTime = new Date(p.expiryDate).getTime();
          const daysLeft = Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24));

          if (daysLeft <= 7) {
            const notifId = `pol-due-${p._id}`;
            const timeVal = p.createdAt ? new Date(p.createdAt).getTime() : now;
            if (timeVal > clearedAt && !dismissedIds.includes(notifId)) {
              items.push({
                id: notifId,
                type: 'policy',
                title: daysLeft < 0 ? 'Policy Lapsed / Expired' : `Policy Renewal Due (${daysLeft}d)`,
                description: `${p.customerId?.name || 'Client'} - ${p.insurerId?.name || 'Insurer'} #${p.policyNumber} (₹${Number(p.premium || 0).toLocaleString('en-IN')})`,
                time: daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `In ${daysLeft} days`,
                timestamp: timeVal,
                unread: !readIds.includes(notifId),
              });
            }
          }
        });
      }

      // Sort by newest first
      items.sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(items);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }, [user, getClearedAt, getDismissedIds, getReadIds]);

  // Initial load when user changes
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Real-time WebSocket listeners
  useEffect(() => {
    const unsubPolicy = socketService.on('POLICY_CREATED', (data: any) => {
      const notifId = `live-pol-${data._id || Date.now()}`;
      const newNotif: NotificationItem = {
        id: notifId,
        type: 'policy',
        title: 'New Policy Bound & Active',
        description: `Policy #${data.policyNumber || 'NEW'} registered for ${data.customerId?.name || 'Client'} (₹${Number(data.premium || 0).toLocaleString('en-IN')})`,
        time: 'Just now',
        timestamp: Date.now(),
        unread: true,
      };
      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== notifId)]);
    });

    const unsubCustomer = socketService.on('CUSTOMER_CREATED', (data: any) => {
      const notifId = `live-cust-${data._id || Date.now()}`;
      const newNotif: NotificationItem = {
        id: notifId,
        type: 'system',
        title: 'New Client Contact Added',
        description: `${data.name || 'Client'} (${data.phone || 'No phone'}) added to directory`,
        time: 'Just now',
        timestamp: Date.now(),
        unread: true,
      };
      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== notifId)]);
    });

    const unsubFollowup = socketService.on('FOLLOWUP_CREATED', (data: any) => {
      const notifId = `live-fol-${data._id || Date.now()}`;
      const newNotif: NotificationItem = {
        id: notifId,
        type: 'followup',
        title: 'Client Call Scheduled',
        description: `${data.customerId?.name || 'Customer'}: ${data.notes || 'Follow-up call logged'}`,
        time: 'Just now',
        timestamp: Date.now(),
        unread: true,
      };
      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== notifId)]);
    });

    const unsubPlatform = socketService.on('platform_activity', (data: any) => {
      if (data?.event) {
        const notifId = `live-act-${Date.now()}`;
        const newNotif: NotificationItem = {
          id: notifId,
          type: 'system',
          title: `Platform Event: ${data.event.replace(/_/g, ' ')}`,
          description: `Activity logged in workspace at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          time: 'Just now',
          timestamp: Date.now(),
          unread: true,
        };
        setNotifications((prev) => [newNotif, ...prev]);
      }
    });

    return () => {
      unsubPolicy();
      unsubCustomer();
      unsubFollowup();
      unsubPlatform();
    };
  }, []);

  // Action: Mark all notifications as read
  const markAllRead = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    const readIds = getReadIds();
    const updated = Array.from(new Set([...readIds, ...allIds]));
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(updated));
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, [notifications, getReadIds, READ_IDS_KEY]);

  // Action: Mark single notification as read
  const markSingleRead = useCallback((id: string) => {
    const readIds = getReadIds();
    if (!readIds.includes(id)) {
      localStorage.setItem(READ_IDS_KEY, JSON.stringify([...readIds, id]));
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  }, [getReadIds, READ_IDS_KEY]);

  // Action: Delete single notification
  const deleteNotification = useCallback((id: string) => {
    const dismissed = getDismissedIds();
    if (!dismissed.includes(id)) {
      localStorage.setItem(DISMISSED_IDS_KEY, JSON.stringify([...dismissed, id]));
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, [getDismissedIds, DISMISSED_IDS_KEY]);

  // Action: Clear all notifications (PERSISTENT)
  const clearAll = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(CLEARED_AT_KEY, now.toString());

    // Also mark all current IDs as dismissed so they will never re-appear
    const currentIds = notifications.map((n) => n.id);
    const dismissed = getDismissedIds();
    const merged = Array.from(new Set([...dismissed, ...currentIds]));
    localStorage.setItem(DISMISSED_IDS_KEY, JSON.stringify(merged));

    setNotifications([]);
  }, [CLEARED_AT_KEY, DISMISSED_IDS_KEY, getDismissedIds, notifications]);

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        filteredNotifs,
        unreadCount,
        filter,
        setFilter,
        markAllRead,
        markSingleRead,
        deleteNotification,
        clearAll,
        refresh: loadNotifications,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
