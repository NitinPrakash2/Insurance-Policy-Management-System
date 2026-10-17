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
} from 'lucide-react';

interface SidebarProps {
  currentSection: string;
  onSelectSection: (section: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentSection, onSelectSection }) => {
  const { user, company, logout } = useAuth();

  // Company Admin Navigation (Matching Figma 1:1)
  const companyAdminNav = [
    { id: 'ca-dashboard', label: 'Overview', icon: LayoutGrid },
    { id: 'ca-customers', label: 'Customers', icon: Users },
    { id: 'ca-policies', label: 'Policies', icon: ShieldCheck },
    { id: 'ca-followups', label: 'Follow-ups', icon: PhoneCall, badge: 8 },
    { id: 'ca-commissions', label: 'Commissions', icon: Percent },
    { id: 'ca-documents', label: 'Documents', icon: FolderOpen },
    { id: 'ca-reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'ca-employees', label: 'Employees', icon: Users },
  ];

  // Super Admin Navigation
  const superAdminNav = [
    { id: 'sa-overview', label: 'Platform Overview', icon: LayoutGrid },
    { id: 'sa-companies', label: 'Companies Directory', icon: Users },
    { id: 'sa-create-company', label: 'Create Company', icon: Users },
    { id: 'sa-company-details', label: 'Company Administration', icon: ShieldCheck },
    { id: 'sa-slots', label: 'Slot Capacity Manager', icon: Users },
    { id: 'sa-audit-logs', label: 'Platform Logs', icon: FileSpreadsheet },
  ];

  // Staff Navigation
  const staffNav = [
    { id: 'os-today', label: "Today's Work", icon: LayoutGrid },
    { id: 'os-customers', label: 'Customers', icon: Users },
    { id: 'os-policies', label: 'Policies', icon: ShieldCheck },
    { id: 'os-documents', label: 'Documents', icon: FolderOpen },
  ];

  // Salesman Navigation
  const salesmanNav = [
    { id: 'sm-dashboard', label: 'My Dashboard', icon: LayoutGrid },
    { id: 'sm-customers', label: 'My Customers', icon: Users },
    { id: 'sm-policies', label: 'My Policies', icon: ShieldCheck },
    { id: 'sm-commissions', label: 'My Commission', icon: Percent },
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

  return (
    <aside className="w-[245px] bg-[#FBF9F5] text-slate-700 flex flex-col h-screen fixed top-0 left-0 z-30 border-r border-[#E7E2D6] font-sans">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-[#EAE4D8] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#C05D34] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Shield className="w-4.5 h-4.5 stroke-[2.2]" />
        </div>
        <div>
          <div className="font-serif font-bold text-[16px] text-[#1A2533] leading-none tracking-tight">ProSurance</div>
          <div className="text-[10px] text-[#717E90] font-sans font-semibold tracking-wider uppercase mt-1">
            {workspaceSubtitle}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        <div className="px-3 pt-1 pb-2 text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono">
          {sectionHeading}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
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
      <div className="p-3 border-t border-[#EAE4D8] bg-[#FBF9F5] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-[#E8E1D3] text-[#1A2533] font-serif font-bold text-[11.5px] flex items-center justify-center shrink-0 border border-[#D5CDBC]">
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
  );
};
