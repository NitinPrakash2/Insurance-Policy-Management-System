import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  Trash2,
  PhoneCall,
  CreditCard,
  FileCheck2,
  TrendingUp,
  Sparkles,
  X,
  ExternalLink,
} from 'lucide-react';
import { socketService } from '../../services/socket';

export interface NotificationItem {
  id: string;
  type: 'followup' | 'payment' | 'policy' | 'commission' | 'system';
  title: string;
  description: string;
  time: string;
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'followup',
    title: 'Renewal Call Due Today',
    description: 'Vikram Malhotra - Bajaj Allianz Health Policy expiring in 3 days. Action needed.',
    time: '12m ago',
    unread: true,
  },
  {
    id: 'notif-2',
    type: 'payment',
    title: 'Premium Payment Received',
    description: '₹18,500 instalment credited for Policy #POL-2026-9042 (HDFC ERGO).',
    time: '45m ago',
    unread: true,
  },
  {
    id: 'notif-3',
    type: 'policy',
    title: 'New Policy Bound & Active',
    description: 'Comprehensive Commercial Motor #POL-2026-4412 issued for Priya Sharma.',
    time: '2h ago',
    unread: true,
  },
  {
    id: 'notif-4',
    type: 'commission',
    title: 'Sales Commission Credited',
    description: '₹1,240 payout logged in ledger for Sales Agent Rajesh Verma.',
    time: '5h ago',
    unread: false,
  },
  {
    id: 'notif-5',
    type: 'system',
    title: 'Real-Time Sync Active',
    description: 'Connected to Shree Insurance Advisors workspace real-time stream.',
    time: 'Today',
    unread: false,
  },
];

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (type: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'followup' | 'payment' | 'policy'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Listen for live WebSocket notifications
  useEffect(() => {
    const unsubPolicy = socketService.on('POLICY_CREATED', (data: any) => {
      const newNotif: NotificationItem = {
        id: `live-pol-${Date.now()}`,
        type: 'policy',
        title: 'Live: New Policy Issued',
        description: `Policy #${data.policyNumber || 'NEW'} registered for ₹${Number(data.premium || 0).toLocaleString('en-IN')}`,
        time: 'Just now',
        unread: true,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    });

    const unsubFollowup = socketService.on('FOLLOWUP_CREATED', (data: any) => {
      const newNotif: NotificationItem = {
        id: `live-fol-${Date.now()}`,
        type: 'followup',
        title: 'Live: Follow-Up Scheduled',
        description: `Call scheduled for customer: ${data.notes || 'Renewal reminder'}`,
        time: 'Just now',
        unread: true,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    });

    const unsubPlatform = socketService.on('platform_activity', (data: any) => {
      if (data?.event) {
        const newNotif: NotificationItem = {
          id: `live-act-${Date.now()}`,
          type: 'system',
          title: `Real-time: ${data.event.replace('_', ' ').toUpperCase()}`,
          description: `Activity detected in workspace stream at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          time: 'Just now',
          unread: true,
        };
        setNotifications((prev) => [newNotif, ...prev]);
      }
    });

    return () => {
      unsubPolicy();
      unsubFollowup();
      unsubPlatform();
    };
  }, []);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => n.unread).length;
  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markSingleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'followup':
        return <PhoneCall className="w-4 h-4 text-[#C05D34]" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'policy':
        return <FileCheck2 className="w-4 h-4 text-blue-600" />;
      case 'commission':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'system':
      default:
        return <Sparkles className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[340px] sm:w-[400px] bg-white border border-[#DDD7CB] rounded-xl shadow-[0_12px_36px_rgba(26,37,51,0.12)] z-50 overflow-hidden font-sans animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-[#FAF8F5] border-b border-[#EAE4D8] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-[#1A2533] text-sm tracking-tight">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="bg-[#C05D34] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] font-medium text-[#C05D34] hover:underline flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Mark read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[#8E9AAB] hover:text-[#1A2533] p-1 rounded-md hover:bg-[#EAE4D8]/50 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#F0EBE1] bg-white text-xs">
        {(['all', 'followup', 'payment', 'policy'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition ${
              filter === tab
                ? 'bg-[#1A2533] text-white font-semibold'
                : 'text-[#6F7C8E] hover:bg-[#F2EDE2]'
            }`}
          >
            {tab === 'all' ? 'All' : tab === 'followup' ? 'Follow-ups' : tab === 'payment' ? 'Payments' : 'Policies'}
          </button>
        ))}
      </div>

      {/* Notifications Scroll List */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-[#F2EDE2]">
        {filteredNotifs.length === 0 ? (
          <div className="py-10 text-center px-4">
            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#EAE4D8] mx-auto flex items-center justify-center text-[#A0AAB7] mb-2">
              <Bell className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-[#1A2533]">All caught up!</p>
            <p className="text-[11px] text-[#8E9AAB] mt-0.5">
              No notifications matching your filter.
            </p>
          </div>
        ) : (
          filteredNotifs.map((item) => (
            <div
              key={item.id}
              onClick={() => markSingleRead(item.id)}
              className={`p-3.5 hover:bg-[#FAF8F5] transition cursor-pointer flex items-start gap-3 relative group ${
                item.unread ? 'bg-[#FCFAF7]' : 'bg-white'
              }`}
            >
              {/* Type Icon */}
              <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#EAE4D8] flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-1.5">
                  <h4
                    className={`text-xs truncate ${
                      item.unread ? 'font-bold text-[#1A2533]' : 'font-medium text-[#445163]'
                    }`}
                  >
                    {item.title}
                  </h4>
                  {item.unread && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C05D34] shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-[#6F7C8E] mt-0.5 leading-snug line-clamp-2">
                  {item.description}
                </p>
                <span className="text-[10px] text-[#9EAAB8] font-mono mt-1 block">
                  {item.time}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(item.id);
                  }}
                  className="p-1 rounded text-[#8E9AAB] hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Dismiss notification"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {filteredNotifs.length > 0 && (
        <div className="p-2.5 bg-[#FAF8F5] border-t border-[#EAE4D8] flex items-center justify-between text-[11px] text-[#7A8696] px-4">
          <button
            onClick={clearAll}
            className="hover:text-rose-600 transition font-medium"
          >
            Clear all
          </button>
          <span className="text-[10px] text-[#A0AAB7]">
            Real-time feed via WebSockets
          </span>
        </div>
      )}
    </div>
  );
};
