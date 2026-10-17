import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { UserRole } from '../../types';

interface LoginPageProps {
  onBackToLanding?: () => void;
  initialRole?: 'COMPANY_ADMIN' | 'OFFICE_STAFF' | 'SALESMAN' | 'SUPER_ADMIN';
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToLanding, initialRole }) => {
  const { login, quickLoginAs } = useAuth();
  
  // State for login mode: 'company' vs 'super_admin'
  const [loginMode, setLoginMode] = useState<'company' | 'super_admin'>('company');
  const [activeRoleTab, setActiveRoleTab] = useState<'COMPANY_ADMIN' | 'OFFICE_STAFF' | 'SALESMAN' | 'SUPER_ADMIN'>(
    initialRole || 'COMPANY_ADMIN'
  );
  
  const [email, setEmail] = useState('admin@prosurance.com');
  const [password, setPassword] = useState('Admin@123');
  const [keepSigned, setKeepSigned] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRole) {
      handleRoleTabChange(initialRole);
    }
  }, [initialRole]);

  const handleRoleTabChange = (role: 'COMPANY_ADMIN' | 'OFFICE_STAFF' | 'SALESMAN' | 'SUPER_ADMIN') => {
    setActiveRoleTab(role);
    setError(null);
    if (role === 'SUPER_ADMIN') {
      setLoginMode('super_admin');
      setEmail('superadmin@prosurance.com');
      setPassword('SuperAdmin@123');
    } else {
      setLoginMode('company');
      if (role === 'COMPANY_ADMIN') {
        setEmail('admin@prosurance.com');
        setPassword('Admin@123');
      } else if (role === 'OFFICE_STAFF') {
        setEmail('staff@prosurance.com');
        setPassword('Staff@123');
      } else if (role === 'SALESMAN') {
        setEmail('arjun@prosurance.com');
        setPassword('Salesman@123');
      }
    }
  };

  const switchToSuperAdmin = () => {
    handleRoleTabChange('SUPER_ADMIN');
  };

  const switchToCompany = () => {
    handleRoleTabChange('COMPANY_ADMIN');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError("Email or password didn't match. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBypass = () => {
    quickLoginAs(activeRoleTab);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F7F4EE] font-sans text-slate-800">
      {/* LEFT COLUMN: Brand & Value Pillars (45% width on large screens) */}
      <div className="lg:w-[46%] p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#E7E2D6] bg-[#FBF9F5]">
        <div>
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="inline-flex items-center gap-1.5 text-xs text-[#5E6877] hover:text-[#C05D34] font-medium mb-8 transition cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to ProSurance Overview</span>
            </button>
          )}

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#C05D34] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="font-bold text-xl text-slate-900 leading-none tracking-tight">ProSurance</div>
              <div className="text-[11px] text-slate-500 font-semibold tracking-wide mt-1">BROKER WORKSPACE</div>
            </div>
          </div>

          {/* Subheading tag */}
          <div className="mt-14 sm:mt-20">
            <span className="text-[11px] font-bold text-slate-600 tracking-[0.14em] uppercase">
              ENTERPRISE BROKER PLATFORM
            </span>

            {/* Headline */}
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-[40px] font-bold text-slate-900 leading-[1.18] tracking-tight">
              People, policies,<br />
              and portfolios.<br />
              All in one workspace.
            </h1>

            {/* Description */}
            <p className="mt-5 text-sm text-slate-600 leading-relaxed max-w-md">
              Keep your agency's records organized, manage renewals, and streamline client operations seamlessly.
            </p>
          </div>

          {/* Value Cards */}
          <div className="mt-10 sm:mt-12 space-y-3.5 max-w-md">
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
              <div className="text-[13px] font-semibold text-slate-900">
                Tenant Data Isolation
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-normal">
                Your agency's customers, policies, and financial documents stay strictly private and isolated.
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
              <div className="text-[13px] font-semibold text-slate-900">
                Ledgers & Real-time Records
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-normal">
                Record underwriting receipts and track agent payouts across all institutional carriers.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-[11.5px] text-slate-400 font-sans">
          ProSurance · Enterprise Broker Workspace
        </div>
      </div>

      {/* RIGHT COLUMN: Sign In Cards (54% width) */}
      <div className="flex-1 p-6 sm:p-12 lg:p-16 flex flex-col justify-center items-center bg-slate-50/70">
        <div className="w-full max-w-[480px]">
          {/* Header row */}
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4">
            <span>SECURE ACCESS</span>
            <button
              onClick={handleDemoBypass}
              className="text-slate-700 hover:text-slate-900 underline flex items-center gap-1 font-medium normal-case text-xs cursor-pointer"
            >
              Fill Demo Login
            </button>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Sign in to your account
          </h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Enter your credentials to access your organization's workspace.
          </p>

          {/* MAIN CARD: Single Unified Login for all 4 Roles */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-7 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base text-slate-900">
                {activeRoleTab === 'SUPER_ADMIN' ? 'Platform Super Admin Console' : 'Company Workspace Login'}
              </h3>
              <span className="text-[10px] bg-[#F7F4EE] border border-[#E7E2D6] text-[#6E7B8D] font-mono font-medium px-2 py-0.5 rounded shrink-0">
                {activeRoleTab.replace('_', ' ')}
              </span>
            </div>

            {/* Full-Width 4-Role Segmented Control (Responsive 2x2 on mobile, 4-cols on sm+) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#F5F1E9] border border-[#E5DFD3] rounded-lg mb-5 text-xs font-medium text-[#5E6877]">
              <button
                type="button"
                onClick={() => handleRoleTabChange('COMPANY_ADMIN')}
                className={`py-2 sm:py-1.5 px-2 rounded-md text-center transition cursor-pointer truncate ${
                  activeRoleTab === 'COMPANY_ADMIN'
                    ? 'bg-white text-[#C05D34] font-bold shadow-xs'
                    : 'hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                Company Admin
              </button>
              <button
                type="button"
                onClick={() => handleRoleTabChange('OFFICE_STAFF')}
                className={`py-2 sm:py-1.5 px-2 rounded-md text-center transition cursor-pointer truncate ${
                  activeRoleTab === 'OFFICE_STAFF'
                    ? 'bg-white text-[#C05D34] font-bold shadow-xs'
                    : 'hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                Office Staff
              </button>
              <button
                type="button"
                onClick={() => handleRoleTabChange('SALESMAN')}
                className={`py-2 sm:py-1.5 px-2 rounded-md text-center transition cursor-pointer truncate ${
                  activeRoleTab === 'SALESMAN'
                    ? 'bg-white text-[#C05D34] font-bold shadow-xs'
                    : 'hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                Salesman
              </button>
              <button
                type="button"
                onClick={() => handleRoleTabChange('SUPER_ADMIN')}
                className={`py-2 sm:py-1.5 px-2 rounded-md text-center transition cursor-pointer truncate ${
                  activeRoleTab === 'SUPER_ADMIN'
                    ? 'bg-white text-[#C05D34] font-bold shadow-xs'
                    : 'hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                Super Admin
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A2533] mb-1.5">
                  {activeRoleTab === 'SUPER_ADMIN' ? 'Platform administrator email' : 'Work email'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#D5CEBF] rounded-md text-xs sm:text-sm text-[#1A2533] placeholder:text-slate-400 focus:outline-none focus:border-[#C05D34] focus:ring-1 focus:ring-[#C05D34] transition bg-white"
                  placeholder={activeRoleTab === 'SUPER_ADMIN' ? 'superadmin@prosurance.com' : 'e.g. admin@prosurance.com'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A2533] mb-1.5">
                  {activeRoleTab === 'SUPER_ADMIN' ? 'Root master password' : 'Password'}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-md text-xs sm:text-sm text-[#1A2533] focus:outline-none transition bg-white ${
                    error ? 'border-[#C05D34] focus:border-[#C05D34]' : 'border-[#D5CEBF] focus:border-[#C05D34] focus:ring-1 focus:ring-[#C05D34]'
                  }`}
                  placeholder="••••••••••••"
                />
                {error && (
                  <div className="text-[11px] text-[#C05D34] mt-1.5 font-medium leading-tight">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="keep-signed"
                  checked={keepSigned}
                  onChange={(e) => setKeepSigned(e.target.checked)}
                  className="w-4 h-4 rounded border-[#D5CEBF] text-[#C05D34] focus:ring-[#C05D34] cursor-pointer"
                />
                <label htmlFor="keep-signed" className="text-xs text-[#556172] cursor-pointer">
                  Keep me signed in on this device
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C05D34] hover:bg-[#A94F2B] text-white font-semibold py-2.5 px-4 rounded-md text-xs sm:text-sm transition duration-150 shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <span>
                  {loading
                    ? 'Authenticating...'
                    : activeRoleTab === 'SUPER_ADMIN'
                    ? 'Sign in to Platform Console'
                    : 'Sign in to company workspace'}
                </span>
              </button>

              <div className="pt-2 text-center">
                <span className="text-xs text-[#7A8696]">
                  Forgot password? Contact your platform/company administrator.
                </span>
              </div>

              <div className="pt-3 border-t border-[#F0EBE1] text-[11px] text-[#7A8696] leading-relaxed text-center">
                {activeRoleTab === 'SUPER_ADMIN'
                  ? 'Root master credentials grant multi-tenant supervision and tenant provisioning access.'
                  : 'Need an account? Ask your Company Admin. Only the platform Super Admin creates companies.'}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
