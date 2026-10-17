import React, { useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { useNotifications, NotificationItem } from '../../context/NotificationContext';

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
  const {
    filteredNotifs,
    unreadCount,
    filter,
    setFilter,
    markAllRead,
    markSingleRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

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

  if (!isOpen) return null;

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
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40 sm:hidden backdrop-blur-sm animate-in fade-in duration-100"
        onClick={onClose}
      />

      {/* Notification Dropdown Container */}
      <div
        ref={dropdownRef}
        className="fixed inset-x-2 top-14 max-w-[420px] mx-auto sm:inset-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-[380px] sm:max-w-none sm:mx-0 bg-white border border-[#DDD7CB] rounded-xl shadow-[0_12px_36px_rgba(26,37,51,0.18)] z-50 overflow-hidden font-sans animate-in fade-in slide-in-from-top-2 duration-150"
      >
        {/* Header */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[#FAF8F5] border-b border-[#EAE4D8] flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-semibold text-slate-900 text-xs sm:text-sm tracking-tight">
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="bg-[#C05D34] text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] sm:text-[11px] font-medium text-[#C05D34] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" /> Mark read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[#8E9AAB] hover:text-[#1A2533] p-1 rounded-md hover:bg-[#EAE4D8]/50 transition cursor-pointer"
              aria-label="Close notifications"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 border-b border-[#F0EBE1] bg-white text-xs overflow-x-auto no-scrollbar">
          {(['all', 'followup', 'payment', 'policy'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-medium capitalize transition cursor-pointer shrink-0 ${
                filter === tab
                  ? 'bg-[#1A2533] text-white font-semibold shadow-2xs'
                  : 'text-[#6F7C8E] hover:bg-[#F2EDE2]'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'followup' ? 'Follow-Ups' : tab === 'payment' ? 'Payments' : 'Policies'}
            </button>
          ))}
        </div>

        {/* Notifications Scroll List */}
        <div className="max-h-[55vh] sm:max-h-[360px] overflow-y-auto divide-y divide-[#F2EDE2]">
          {filteredNotifs.length === 0 ? (
            <div className="py-8 sm:py-10 text-center px-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FAF8F5] border border-[#EAE4D8] mx-auto flex items-center justify-center text-[#A0AAB7] mb-2">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <p className="text-xs font-semibold text-[#1A2533]">All caught up!</p>
              <p className="text-[10px] sm:text-[11px] text-[#8E9AAB] mt-0.5 max-w-[220px] sm:max-w-none mx-auto">
                No active notifications matching your filter.
              </p>
            </div>
          ) : (
            filteredNotifs.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  markSingleRead(item.id);
                  if (onSelectAction) onSelectAction(item.type);
                }}
                className={`p-2.5 sm:p-3.5 hover:bg-[#FAF8F5] transition cursor-pointer flex items-start gap-2.5 sm:gap-3 relative group ${
                  item.unread ? 'bg-[#FCFAF7]' : 'bg-white'
                }`}
              >
                {/* Type Icon */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FAF8F5] border border-[#EAE4D8] flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0 pr-5 sm:pr-6">
                  <div className="flex items-center gap-1.5">
                    <h4
                      className={`text-[11px] sm:text-xs truncate ${
                        item.unread ? 'font-bold text-[#1A2533]' : 'font-medium text-[#445163]'
                      }`}
                    >
                      {item.title}
                    </h4>
                    {item.unread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C05D34] shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#6F7C8E] mt-0.5 leading-snug line-clamp-2">
                    {item.description}
                  </p>
                  <span className="text-[9px] sm:text-[10px] text-[#9EAAB8] font-mono mt-1 block">
                    {item.time}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="absolute right-2 sm:right-3 top-2 sm:top-3 sm:opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(item.id);
                    }}
                    className="p-1 rounded text-[#8E9AAB] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Dismiss notification"
                    aria-label="Dismiss notification"
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
          <div className="p-2 sm:p-2.5 bg-[#FAF8F5] border-t border-[#EAE4D8] flex items-center justify-between text-[10px] sm:text-[11px] text-[#7A8696] px-3 sm:px-4">
            <span>{filteredNotifs.length} total</span>
            <button
              onClick={clearAll}
              className="hover:text-rose-600 text-rose-500 font-medium transition cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </>
  );
};
