import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const { login, quickLoginAs } = useAuth();
  
  // State for login mode: 'company' vs 'super_admin'
  const [loginMode, setLoginMode] = useState<'company' | 'super_admin'>('company');
  const [activeRoleTab, setActiveRoleTab] = useState<'COMPANY_ADMIN' | 'OFFICE_STAFF' | 'SALESMAN'>('COMPANY_ADMIN');
  
  const [email, setEmail] = useState('admin@prosurance.com');
  const [password, setPassword] = useState('Admin@123');
  const [keepSigned, setKeepSigned] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleTabChange = (role: 'COMPANY_ADMIN' | 'OFFICE_STAFF' | 'SALESMAN') => {
    setActiveRoleTab(role);
    setLoginMode('company');
    setError(null);
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
  };

  const switchToSuperAdmin = () => {
    setLoginMode('super_admin');
    setEmail('superadmin@prosurance.com');
    setPassword('SuperAdmin@123');
    setError(null);
  };

  const switchToCompany = () => {
    setLoginMode('company');
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
    if (loginMode === 'super_admin') {
      quickLoginAs('SUPER_ADMIN');
    } else {
      quickLoginAs(activeRoleTab);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F7F4EE] font-sans text-slate-800">
      {/* LEFT COLUMN: Brand & Value Pillars (45% width on large screens) */}
      <div className="lg:w-[46%] p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#E7E2D6] bg-[#FBF9F5]">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#C05D34] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="font-serif font-bold text-lg text-[#1A2533] leading-none">Broker</div>
              <div className="font-serif font-bold text-lg text-[#1A2533] leading-tight">Workspace</div>
            </div>
          </div>

          {/* Subheading tag */}
          <div className="mt-14 sm:mt-20">
            <span className="text-[11px] font-bold text-[#C05D34] tracking-[0.14em] uppercase font-sans">
              YOUR EVERYDAY BROKER WORKSPACE
            </span>

            {/* Headline */}
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-[42px] font-serif font-bold text-[#1A2533] leading-[1.18] tracking-tight">
              People, policies,<br />
              and promises.<br />
              All in one place.
            </h1>

            {/* Description */}
            <p className="mt-5 text-sm text-[#5B6675] leading-relaxed max-w-md">
              Keep your agency's records organized, know what is due, and give every customer a thoughtful follow-up.
            </p>
          </div>

          {/* Value Cards */}
          <div className="mt-10 sm:mt-12 space-y-3.5 max-w-md">
            <div className="bg-white border border-[#E8E3D7] rounded-lg p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="text-[13px] font-bold text-[#1A2533]">
                Private to your company
              </div>
              <p className="text-xs text-[#5E6877] mt-1 leading-normal">
                Your company's customers, policies and documents stay separate from every other company.
              </p>
            </div>

            <div className="bg-white border border-[#E8E3D7] rounded-lg p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="text-[13px] font-bold text-[#1A2533]">
                Records, not transactions
              </div>
              <p className="text-xs text-[#5E6877] mt-1 leading-normal">
                Record payments and commissions. Broker Workspace does not collect or transfer money.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-[11.5px] text-[#8C95A3] font-sans">
          Broker Workspace · Responsive web workspace
        </div>
      </div>

      {/* RIGHT COLUMN: Sign In Cards (54% width) */}
      <div className="flex-1 p-6 sm:p-12 lg:p-16 flex flex-col justify-center items-center bg-[#F7F4EE]">
        <div className="w-full max-w-[480px]">
          {/* Header row */}
          <div className="flex justify-between items-center text-[10.5px] font-bold text-[#8C95A3] tracking-[0.14em] uppercase mb-4">
            <span>SECURE ACCESS / ENGLISH</span>
            <button
              onClick={handleDemoBypass}
              className="text-[#C05D34] hover:underline flex items-center gap-1 font-semibold normal-case text-xs tracking-normal"
            >
              <Sparkles className="w-3.5 h-3.5" /> Instant Demo Mode
            </button>
          </div>

          <h2 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight">
            Welcome back
          </h2>
          <p className="text-xs text-[#636F80] mt-1.5 mb-6">
            Sign in with the account provided by your administrator.
          </p>

          {/* MAIN CARD 1: Company Admin & Employees */}
          {loginMode === 'company' ? (
            <div className="bg-white border border-[#E3DDCF] rounded-xl p-6 sm:p-7 shadow-[0_2px_8px_rgba(27,37,51,0.04)]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1A2533]">
                    Company Admin & employees
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11.5px] text-[#697587]">
                    <button
                      type="button"
                      onClick={() => handleRoleTabChange('COMPANY_ADMIN')}
                      className={`hover:text-[#C05D34] transition ${activeRoleTab === 'COMPANY_ADMIN' ? 'font-bold text-[#C05D34] underline underline-offset-4' : ''}`}
                    >
                      Company Admin
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => handleRoleTabChange('OFFICE_STAFF')}
                      className={`hover:text-[#C05D34] transition ${activeRoleTab === 'OFFICE_STAFF' ? 'font-bold text-[#C05D34] underline underline-offset-4' : ''}`}
                    >
                      Office Staff
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => handleRoleTabChange('SALESMAN')}
                      className={`hover:text-[#C05D34] transition ${activeRoleTab === 'SALESMAN' ? 'font-bold text-[#C05D34] underline underline-offset-4' : ''}`}
                    >
                      Salesman
                    </button>
                  </div>
                </div>

                <span className="text-[10px] bg-[#F7F4EE] border border-[#E7E2D6] text-[#6E7B8D] font-mono font-medium px-2 py-0.5 rounded">
                  {activeRoleTab.replace('_', ' ')}
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2533] mb-1.5">
                    Work email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#D5CEBF] rounded-md text-xs sm:text-sm text-[#1A2533] placeholder:text-slate-400 focus:outline-none focus:border-[#C05D34] focus:ring-1 focus:ring-[#C05D34] transition bg-white"
                    placeholder="e.g. anjali@shreeadvisors.in"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A2533] mb-1.5">
                    Password
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
                    className="w-4 h-4 rounded border-[#D5CEBF] text-[#C05D34] focus:ring-[#C05D34]"
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
                  <span>{loading ? 'Authenticating...' : 'Sign in to company workspace'}</span>
                </button>

                <div className="pt-2 text-center">
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please ask your Company Admin to reset your password.'); }} className="text-xs text-[#C05D34] hover:underline font-medium">
                    Forgot your password?
                  </a>
                </div>

                <div className="pt-3 border-t border-[#F0EBE1] text-[11px] text-[#7A8696] leading-relaxed text-center">
                  Need an account? Ask your Company Admin. Only the platform Super Admin creates companies.
                </div>
              </form>
            </div>
          ) : (
            /* Super Admin Mode Form */
            <div className="bg-white border-2 border-purple-200 rounded-xl p-6 sm:p-7 shadow-[0_2px_8px_rgba(27,37,51,0.04)]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-purple-950">
                    Platform Super Admin Console
                  </h3>
                  <p className="text-[11.5px] text-purple-700 mt-0.5">
                    Multi-tenant root controls and company provisioning
                  </p>
                </div>
                <button
                  onClick={switchToCompany}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Back to Company Login
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Platform Administrator Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-purple-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Root Master Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-purple-600 bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-900 hover:bg-purple-950 text-white font-semibold py-2.5 px-4 rounded-md text-xs sm:text-sm transition duration-150 shadow-xs cursor-pointer"
                >
                  {loading ? 'Authenticating...' : 'Sign in to Platform Console'}
                </button>
              </form>
            </div>
          )}

          {/* CARD 2: Super Admin Box (Matching Figma bottom box) */}
          {loginMode === 'company' && (
            <div className="mt-5 bg-white border border-[#E3DDCF] rounded-xl p-5 sm:p-6 shadow-[0_1px_4px_rgba(27,37,51,0.03)]">
              <h3 className="font-serif font-bold text-[14px] text-[#1A2533]">
                Super Admin
              </h3>
              <p className="text-xs text-[#5D6979] mt-1 leading-normal">
                Manage companies and employee account capacity in the separate platform console.
              </p>

              <button
                type="button"
                onClick={switchToSuperAdmin}
                className="mt-3.5 w-full py-2.5 px-4 border border-[#CEC7B8] hover:border-[#1A2533] bg-[#FDFBF7] hover:bg-white text-xs sm:text-[13px] font-semibold text-[#1A2533] rounded-md transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Super Admin sign in</span>
              </button>

              <div className="text-[11px] text-[#8C95A3] mt-3">
                Platform access never opens company customer or policy records.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
