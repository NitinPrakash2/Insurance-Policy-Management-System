import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutGrid,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  PhoneCall,
  Percent,
  FolderOpen,
  Shield,
  LogOut,
  CreditCard,
  CalendarClock,
  Building2,
  KeyRound,
  UserCheck,
  FileText,
  Plus,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentSection: string;
  onSelectSection: (section: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpen = false,
  onClose,
}) => {
  const { user, company, logout } = useAuth();

  // 1. Platform Super Admin (6 Sections)
  const superAdminNav = [
    { id: 'sa-overview', label: 'Platform Overview', icon: LayoutGrid },
    { id: 'sa-companies', label: 'Companies Directory', icon: Building2 },
    { id: 'sa-create-company', label: 'Create Company', icon: Plus },
    { id: 'sa-company-details', label: 'Company Administration', icon: ShieldCheck },
    { id: 'sa-slots', label: 'Slot Capacity Manager', icon: KeyRound },
    { id: 'sa-audit-logs', label: 'Platform Logs', icon: FileSpreadsheet },
  ];

  // 2. Company Admin (12 Sections - Aligned with Prototype)
  const companyAdminNav = [
    { id: 'ca-dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'ca-reports', label: 'Business reports', icon: FileSpreadsheet },
    { id: 'ca-policies', label: 'Insurance policies', icon: ShieldCheck },
    { id: 'ca-renewals', label: 'Renewal reminders', icon: CalendarClock },
    { id: 'ca-documents', label: 'Policy/document uploads', icon: FolderOpen },
    { id: 'ca-customers', label: 'Customers', icon: Users },
    { id: 'ca-insurers', label: 'Insurance companies', icon: Building2 },
    { id: 'ca-employees', label: 'Salespersons & Team', icon: Users },
    { id: 'ca-commissions', label: 'Salesperson commissions', icon: Percent },
    { id: 'ca-payments', label: 'Payments & EMI Records', icon: CreditCard },
    { id: 'ca-followups', label: 'Follow-ups & Reminders', icon: PhoneCall },
    { id: 'ca-roles', label: 'Roles & Permissions', icon: KeyRound },
  ];

  // 3. Office Staff (8 Sections)
  const staffNav = [
    { id: 'os-today', label: "Today's Work", icon: LayoutGrid },
    { id: 'os-customers', label: 'Customers', icon: Users },
    { id: 'os-policies', label: 'Policies', icon: ShieldCheck },
    { id: 'os-payments', label: 'Payments & EMI Records', icon: CreditCard },
    { id: 'os-renewals', label: 'Renewals & Due Dates', icon: CalendarClock },
    { id: 'os-followups', label: 'Follow-ups', icon: PhoneCall },
    { id: 'os-documents', label: 'Documents & KYC', icon: FolderOpen },
    { id: 'os-reports', label: 'Reports & Register', icon: FileSpreadsheet },
  ];

  // 4. Salesman / Agent (7 Sections)
  const salesmanNav = [
    { id: 'sm-dashboard', label: 'My Dashboard', icon: LayoutGrid },
    { id: 'sm-customers', label: 'My Customers', icon: Users },
    { id: 'sm-policies', label: 'My Policies', icon: ShieldCheck },
    { id: 'sm-renewals', label: 'My Renewals', icon: CalendarClock },
    { id: 'sm-followups', label: 'My Follow-ups', icon: PhoneCall },
    { id: 'sm-commissions', label: 'My Commission', icon: Percent },
    { id: 'sm-profile', label: 'My Profile & Docs', icon: UserCheck },
  ];

  const navItems =
    user?.role === 'SUPER_ADMIN'
      ? superAdminNav
      : user?.role === 'COMPANY_ADMIN'
      ? companyAdminNav
      : user?.role === 'OFFICE_STAFF'
      ? staffNav
      : salesmanNav;

  const displayName = user?.name || 'Anjali Deshmukh';
  const displayRole = user?.role === 'COMPANY_ADMIN' ? 'Company Admin' : user?.role.replace('_', ' ');

  // Dynamic Workspace Label & Section Header per role
  const getRoleWorkspaceInfo = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          subtitle: 'Super Admin Console',
          section: 'PLATFORM CONTROL',
        };
      case 'OFFICE_STAFF':
        return {
          subtitle: 'Operations Workspace',
          section: 'DAILY OPERATIONS',
        };
      case 'SALESMAN':
        return {
          subtitle: 'Salesman Workspace',
          section: 'AGENT BOOK',
        };
      case 'COMPANY_ADMIN':
      default:
        return {
          subtitle: 'Broker Workspace',
          section: 'WORKSPACE',
        };
    }
  };

  const { subtitle: workspaceSubtitle, section: sectionHeading } = getRoleWorkspaceInfo(user?.role);

  // Compute initials dynamically from name
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AD';

  // Dynamic page title sync
  React.useEffect(() => {
    document.title = `ProSurance · ${workspaceSubtitle}`;
  }, [workspaceSubtitle]);

  // Lock background scroll when mobile sidebar drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile Drawer Backdrop with Premium Frosted Blur */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#1A2533]/35 backdrop-blur-[6px] z-40 lg:hidden transition-all duration-300 animate-in fade-in"
          onClick={onClose}
          onTouchMove={(e) => e.preventDefault()}
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-[270px] sm:w-[260px] bg-[#FBF9F5] text-slate-700 flex flex-col h-[100dvh] max-h-[100dvh] fixed top-0 left-0 z-50 border-r border-[#E7E2D6] font-sans transition-transform duration-300 ease-in-out shadow-2xl overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-[#EAE4D8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C05D34] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Shield className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <div className="font-bold text-[15px] text-slate-900 leading-none tracking-tight">ProSurance</div>
              <div className="text-[10.5px] text-slate-500 font-medium tracking-wide mt-1">
                {workspaceSubtitle}
              </div>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#F2ECE1] transition cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - min-h-0 enables smooth scrolling inside flex container */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2.5 py-3 space-y-1 touch-pan-y">
          <div className="px-3 pt-1 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {sectionHeading}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full group flex items-center justify-between px-2 py-2.5 rounded-md text-[14px] transition-colors text-left ${
                  active
                    ? 'text-[#1A2533] font-semibold'
                    : 'text-[#4A5666] font-normal hover:text-[#1A2533] hover:bg-[#F2ECE1]/50'
                }`}
              >
              <div className="flex items-center gap-2.5">
                {/* Vertical Pill Indicator (Figma 1:1) */}
                <span
                  className={`w-[3.5px] h-[18px] rounded-full transition-opacity ${
                    active ? 'bg-[#C05D34] opacity-100' : 'opacity-0'
                  }`}
                />
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                    active ? 'text-[#C05D34] stroke-[2.2]' : 'text-[#647284] stroke-[1.8] group-hover:text-[#1A2533]'
                  }`}
                />
                <span className="leading-none">{item.label}</span>
              </div>
              {(item as any).badge ? (
                <span className="px-2 py-0.5 rounded-full bg-[#EDE6D8] text-[#1A2533] text-[11px] font-bold flex items-center justify-center font-mono mr-1">
                  {(item as any).badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Profile Footer (Matching Figma 1:1) */}
      <div className="p-3 border-t border-[#EAE4D8] bg-[#FBF9F5] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-semibold text-[11px] flex items-center justify-center shrink-0 border border-slate-300">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-[#1A2533] truncate leading-tight">
              {displayName}
            </div>
            <div className="text-[10.5px] text-[#7E8B9C] truncate">
              {displayRole}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="p-1 text-[#8E9AAB] hover:text-[#C05D34] hover:bg-[#F2ECE1] rounded transition"
          title="Sign out"
        >
          <LogOut className="w-4 h-4 stroke-[1.8]" />
        </button>
      </div>
    </aside>
  </>
);
};
