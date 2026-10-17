import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, Menu } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { useNotifications } from '../../context/NotificationContext';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onOpenMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, onOpenMobileSidebar }) => {
  const { user } = useAuth();
  const { unreadCount, isOpen: showNotifications, setIsOpen: setShowNotifications } = useNotifications();

  const getWorkspaceTitle = () => {
    switch (user?.role) {
      case 'SUPER_ADMIN':
        return 'Platform Console';
      case 'OFFICE_STAFF':
        return 'Operations Desk';
      case 'SALESMAN':
        return 'Agent Portal';
      case 'COMPANY_ADMIN':
      default:
        return 'Broker Workspace';
    }
  };

  return (
    <header className="w-full flex items-center justify-between pb-3.5 pt-1 border-b border-slate-200/80 mb-6 font-sans gap-2">
      {/* Workspace Breadcrumb & Mobile Hamburger */}
      <div className="flex items-center gap-2.5 text-xs min-w-0">
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition cursor-pointer shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-semibold text-slate-800 truncate text-xs sm:text-sm">
            {user?.role === 'SUPER_ADMIN' ? 'ProSurance' : 'Shree Insurance Advisors'}
          </span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <span className="text-slate-500 font-medium truncate hidden sm:inline">
            {getWorkspaceTitle()}
          </span>
        </div>
      </div>

      {/* Top Right: Search Bar & Notification Bell */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="relative hidden sm:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 w-44 md:w-64 lg:w-72 shadow-2xs transition"
          />
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`w-8 h-8 rounded-lg bg-white border ${
              showNotifications
                ? 'border-slate-400 text-slate-900 bg-slate-50'
                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
            } flex items-center justify-center transition shadow-2xs relative cursor-pointer`}
            title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
            aria-label="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 bg-[#C05D34] text-white text-[9px] font-bold rounded-full border border-white flex items-center justify-center shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>
      </div>
    </header>
  );
};
