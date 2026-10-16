import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Sparkles, Bell } from 'lucide-react';
import { UserRole } from '../../types';
import { NotificationDropdown } from './NotificationDropdown';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const { user, quickLoginAs } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="w-full flex items-center justify-between pb-4 pt-1 border-b border-[#EAE4D8] mb-6 font-sans">
      {/* Top Left: Ledger - Warm Title indicator (matching Figma top indicator) */}
      <div className="flex items-center gap-2 text-xs text-[#7A8696]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1A2533]" />
          <span className="w-2 h-2 rounded-full bg-[#C05D34]" />
        </div>
        <span className="font-serif font-bold text-[#1A2533] text-sm tracking-wide">Ledger — Warm</span>
        <span className="text-[11px] text-[#A0AAB7] hidden sm:inline">A little more human</span>
      </div>

      {/* Top Right: Search Bar & Notifications (Matching Figma top right) */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9AAB]" />
          <input
            type="text"
            placeholder="Find customer or policy"
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-white border border-[#DDD7CB] rounded-md text-xs text-[#1A2533] placeholder:text-[#9AA6B7] focus:outline-none focus:border-[#C05D34] w-56 sm:w-64 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          />
        </div>

        {/* Proper Notification Popup Container */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`w-8 h-8 rounded-md bg-white border ${
              showNotifications
                ? 'border-[#C05D34] text-[#C05D34] shadow-sm'
                : 'border-[#DDD7CB] text-[#6B7889] hover:border-[#C05D34] hover:text-[#C05D34]'
            } flex items-center justify-center transition shadow-[0_1px_2px_rgba(0,0,0,0.02)] relative`}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#C05D34] rounded-full border-2 border-white ring-1 ring-[#C05D34]/30 animate-pulse" />
          </button>

          <NotificationDropdown
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>

        {/* Discrete role switcher for pair testing */}
        <div className="hidden xl:flex items-center gap-1 bg-white border border-[#DDD7CB] rounded-md px-2 py-1 text-xs shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <span className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider flex items-center gap-1 pr-1">
            <Sparkles className="w-2.5 h-2.5 text-[#C05D34]" /> Role:
          </span>
          {(['COMPANY_ADMIN', 'OFFICE_STAFF', 'SALESMAN', 'SUPER_ADMIN'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => quickLoginAs(r)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition ${
                user?.role === r
                  ? 'bg-[#1A2533] text-white font-bold'
                  : 'text-[#5B6675] hover:bg-[#F2EDE2]'
              }`}
            >
              {r === 'COMPANY_ADMIN' ? 'Admin' : r === 'OFFICE_STAFF' ? 'Staff' : r === 'SALESMAN' ? 'Sales' : 'Super'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
