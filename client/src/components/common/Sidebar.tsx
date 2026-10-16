import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  PhoneCall,
  Percent,
  FolderOpen,
  HelpCircle,
  Shield,
  LogOut,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';

interface SidebarProps {
  currentSection: string;
  onSelectSection: (section: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentSection, onSelectSection }) => {
  const { user, company, logout } = useAuth();

  // Company Admin Navigation (Matching Figma 1:1)
  const companyAdminNav = [
    { id: 'ca-dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'ca-customers', label: 'Customers', icon: Users },
    { id: 'ca-policies', label: 'Policies', icon: ShieldCheck },
    { id: 'ca-followups', label: 'Follow-ups', icon: PhoneCall, badge: 3 },
    { id: 'ca-commissions', label: 'Commissions', icon: Percent },
    { id: 'ca-documents', label: 'Documents', icon: FolderOpen },
    { id: 'ca-reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'ca-employees', label: 'Employees', icon: Users },
  ];

  // Super Admin Navigation
  const superAdminNav = [
    { id: 'sa-overview', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'sa-companies', label: 'Companies Directory', icon: Users },
    { id: 'sa-create-company', label: 'Create Company', icon: Users },
    { id: 'sa-company-details', label: 'Company Administration', icon: ShieldCheck },
    { id: 'sa-slots', label: 'Slot Capacity Manager', icon: Users },
    { id: 'sa-audit-logs', label: 'Platform Logs', icon: FileSpreadsheet },
  ];

  // Staff Navigation
  const staffNav = [
    { id: 'os-today', label: "Today's Work", icon: LayoutDashboard },
    { id: 'os-customers', label: 'Customers', icon: Users },
    { id: 'os-policies', label: 'Policies', icon: ShieldCheck },
    { id: 'os-documents', label: 'Documents', icon: FolderOpen },
  ];

  // Salesman Navigation
  const salesmanNav = [
    { id: 'sm-dashboard', label: 'My Dashboard', icon: LayoutDashboard },
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

  return (
    <aside className="w-[230px] bg-[#FBF9F5] text-slate-700 flex flex-col h-screen fixed top-0 left-0 z-30 border-r border-[#E7E2D6] font-sans">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-[#EAE4D8] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#C05D34] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Shield className="w-4.5 h-4.5 stroke-[2.2]" />
        </div>
        <div>
          <div className="font-serif font-bold text-[13px] text-[#1A2533] leading-none">Broker</div>
          <div className="font-serif font-bold text-[13px] text-[#1A2533] leading-tight">Workspace</div>
        </div>
      </div>

      {/* YOUR COMPANY Box (Matching Figma 1:1) */}
      <div className="px-5 py-3.5 border-b border-[#EAE4D8] bg-[#F8F5F0]/70">
        <div className="text-[9.5px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono">
          YOUR COMPANY
        </div>
        <div className="font-serif font-bold text-[13px] text-[#1A2533] mt-0.5 truncate leading-tight">
          Shree Insurance Advisors
        </div>
        <div className="text-[11px] text-[#717E90] mt-0.5">
          Pune · Private workspace
        </div>
      </div>

      {/* Navigation (Matching Figma 1:1) */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <div className="px-2 py-1 text-[9.5px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono">
          WORKSPACE
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                active
                  ? 'bg-[#F2ECE1] text-[#C05D34] font-bold'
                  : 'text-[#4E5B6D] hover:bg-[#F2ECE1]/60 hover:text-[#1A2533]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#C05D34]' : 'text-[#8492A4]'}`} />
                <span>{item.label}</span>
              </div>
              {(item as any).badge ? (
                <span className="w-4 h-4 rounded-full bg-[#E5DDD0] text-[#1A2533] text-[10px] font-bold flex items-center justify-center font-mono">
                  {(item as any).badge}
                </span>
              ) : null}

            </button>
          );
        })}
      </div>

      {/* Need a hand? Card (Matching Figma 1:1) */}
      <div className="p-3.5 mx-3 mb-3 rounded-lg bg-white border border-[#E7E2D6] text-xs space-y-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-1.5 font-bold text-[#1A2533] text-[11.5px]">
          <HelpCircle className="w-3.5 h-3.5 text-[#C05D34]" />
          <span>Need a hand?</span>
        </div>
        <p className="text-[10.5px] text-[#6F7C8E] leading-relaxed">
          Simple guides for your everyday work.
        </p>
        <button
          onClick={() => alert('Broker Workspace Help Centre')}
          className="text-[10.5px] font-semibold text-[#C05D34] hover:underline pt-0.5 flex items-center gap-0.5"
        >
          <span>Open help centre</span>
          <ArrowUpRight className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Profile Footer (Matching Figma 1:1) */}
      <div className="p-3 border-t border-[#EAE4D8] bg-[#FBF9F5] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-[#E8E1D3] text-[#1A2533] font-serif font-bold text-[11px] flex items-center justify-center shrink-0 border border-[#D5CDBC]">
            AD
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#1A2533] truncate leading-tight">
              {displayName}
            </div>
            <div className="text-[10px] text-[#7E8B9C] truncate">
              {displayRole}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="p-1 text-[#8E9AAB] hover:text-[#C05D34] hover:bg-[#F2ECE1] rounded transition"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
