import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Layers,
  Clock,
  Coins,
  PhoneCall,
  CheckCircle2,
  Users,
  Lock,
  Building2,
  FileCheck,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronUp,
  Calculator,
  Check,
  X,
  HelpCircle,
  Car,
  HeartPulse,
  HeartHandshake,
  Briefcase,
  Zap,
  Menu,
} from 'lucide-react';

interface LandingPageProps {
  onLaunchApp: () => void;
  onQuickRoleLogin?: (role: 'COMPANY_ADMIN' | 'OFFICE_STAFF' | 'SALESMAN' | 'SUPER_ADMIN') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp, onQuickRoleLogin }) => {
  // Mobile nav state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Dynamic Commission Calculator State
  const [premiumAmount, setPremiumAmount] = useState<number>(45000);
  const [selectedLOB, setSelectedLOB] = useState<'Motor Private' | 'Commercial' | 'Health Floater' | 'Life Term'>('Motor Private');
  const [selectedCarrier, setSelectedCarrier] = useState<'ICICI Lombard' | 'HDFC ERGO' | 'Star Health' | 'Tata AIG'>('ICICI Lombard');

  // Interactive Live Calculation
  const calculation = useMemo(() => {
    let odRate = 0.15;
    let tpRate = 0.025;
    if (selectedLOB === 'Health Floater') {
      odRate = 0.18;
      tpRate = 0;
    } else if (selectedLOB === 'Commercial') {
      odRate = 0.12;
      tpRate = 0.025;
    } else if (selectedLOB === 'Life Term') {
      odRate = 0.25;
      tpRate = 0;
    }

    const netBase = Math.round(premiumAmount / 1.18);
    const gst = premiumAmount - netBase;
    const odCommission = Math.round(netBase * 0.7 * odRate);
    const tpCommission = Math.round(netBase * 0.3 * tpRate);
    const totalBrokerage = odCommission + tpCommission;
    const agentPayout = Math.round(totalBrokerage * 0.65);
    const agencyRetained = totalBrokerage - agentPayout;

    return {
      netBase,
      gst,
      odCommission,
      tpCommission,
      totalBrokerage,
      agentPayout,
      agencyRetained,
    };
  }, [premiumAmount, selectedLOB, selectedCarrier]);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A2533] font-sans selection:bg-[#FBECE6] selection:text-[#C05D34]">
      {/* =========================================================================
          1. STANDARD SAAS FIXED HEADER (Clean h-16 on desktop, responsive mobile drawer)
          ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E7E2D6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => {
              setMobileNavOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-[#C05D34] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="font-serif font-bold text-lg text-[#0F2947] tracking-tight">ProSurance</span>
          </div>

          {/* Standard SaaS Navigation */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[#5E6877]">
            <a href="#workflow" className="hover:text-[#0F2947] transition-colors">How It Works</a>
            <a href="#features" className="hover:text-[#0F2947] transition-colors">Platform Modules</a>
            <a href="#calculator" className="hover:text-[#0F2947] transition-colors">Commission Engine</a>
            <a href="#insurers" className="hover:text-[#0F2947] transition-colors">Insurers</a>
            <a href="#comparison" className="hover:text-[#0F2947] transition-colors">Comparison</a>
            <a href="#faq" className="hover:text-[#0F2947] transition-colors">FAQ</a>
          </nav>

          {/* Actions & Mobile Hamburger */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onLaunchApp}
              className="px-3.5 sm:px-4 py-1.5 rounded-md bg-[#C05D34] hover:bg-[#A94F2B] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-1.5 rounded-lg border border-[#E7E2D6] text-[#1A2533] hover:bg-[#F2ECE1] md:hidden transition cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-[#E7E2D6] bg-[#FAF8F5]/98 backdrop-blur-md px-5 py-4 shadow-lg">
            <nav className="flex flex-col space-y-3 text-sm font-medium text-[#0F2947]">
              <a
                href="#workflow"
                onClick={() => setMobileNavOpen(false)}
                className="py-1.5 hover:text-[#C05D34] transition-colors border-b border-[#F0EBE1]"
              >
                How It Works
              </a>
              <a
                href="#features"
                onClick={() => setMobileNavOpen(false)}
                className="py-1.5 hover:text-[#C05D34] transition-colors border-b border-[#F0EBE1]"
              >
                Platform Modules
              </a>
              <a
                href="#calculator"
                onClick={() => setMobileNavOpen(false)}
                className="py-1.5 hover:text-[#C05D34] transition-colors border-b border-[#F0EBE1]"
              >
                Commission Engine
              </a>
              <a
                href="#insurers"
                onClick={() => setMobileNavOpen(false)}
                className="py-1.5 hover:text-[#C05D34] transition-colors border-b border-[#F0EBE1]"
              >
                Insurers
              </a>
              <a
                href="#comparison"
                onClick={() => setMobileNavOpen(false)}
                className="py-1.5 hover:text-[#C05D34] transition-colors border-b border-[#F0EBE1]"
              >
                Comparison
              </a>
              <a
                href="#faq"
                onClick={() => setMobileNavOpen(false)}
                className="py-1.5 hover:text-[#C05D34] transition-colors border-b border-[#F0EBE1]"
              >
                FAQ
              </a>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    onLaunchApp();
                  }}
                  className="w-full py-2.5 rounded-lg bg-[#C05D34] hover:bg-[#A94F2B] text-white text-xs font-semibold shadow-xs transition-colors text-center cursor-pointer"
                >
                  Sign In to Broker Workspace
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Header Spacer (64px) */}
      <div className="h-16" />

      {/* =========================================================================
          2. HERO SECTION
          ========================================================================= */}
      <section className="relative pt-14 pb-16 lg:pt-20 lg:pb-24 border-b border-[#E7E2D6] bg-gradient-to-b from-[#FAF8F5] via-[#FAF8F5] to-[#F5EFE6]/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF3EC] border border-[#EAC8B9] text-[#C05D34] text-xs font-semibold mb-6">
            <Zap className="w-3.5 h-3.5" />
            <span>Built for Modern Insurance Brokerages & Intermediaries</span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#0F2947] font-bold tracking-tight leading-[1.15] max-w-4xl mx-auto">
            People, Policies, and Portfolios.
            <br />
            <span className="text-[#C05D34] italic font-serif">All in One Unified Workspace.</span>
          </h1>

          {/* Meaningful Product Description */}
          <p className="mt-5 text-sm sm:text-base text-[#5E6877] max-w-2xl mx-auto leading-relaxed">
            The authoritative operations operating system for independent insurance agencies—unifying customer records, multi-insurer policy issuance, 30/15/7-day automated renewals, and broker commission settlements with zero data leaks.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onLaunchApp}
              className="px-6 py-3 rounded-lg bg-[#C05D34] hover:bg-[#A94F2B] text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Launch Broker Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <a
              href="#workflow"
              className="px-5 py-3 rounded-lg bg-white border border-[#D5CEBF] hover:border-[#0F2947] text-[#0F2947] font-semibold text-xs shadow-2xs hover:bg-[#FAF8F5] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explore How It Works</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#5E6877]" />
            </a>
          </div>

          {/* Metric Bar */}
          <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="p-4 bg-white rounded-xl border border-[#E7E2D6] shadow-2xs">
              <div className="text-2xl font-serif font-bold text-[#0F2947]">₹140 Cr+</div>
              <div className="text-xs text-[#7A8696] mt-0.5 font-medium">Annual Premium Flow</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-[#E7E2D6] shadow-2xs">
              <div className="text-2xl font-serif font-bold text-[#0F2947]">99.98%</div>
              <div className="text-xs text-[#7A8696] mt-0.5 font-medium">Enterprise Uptime SLA</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-[#E7E2D6] shadow-2xs">
              <div className="text-2xl font-serif font-bold text-[#0F2947]">&lt; 200ms</div>
              <div className="text-xs text-[#7A8696] mt-0.5 font-medium">WebSocket Event Sync</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-[#E7E2D6] shadow-2xs">
              <div className="text-2xl font-serif font-bold text-[#0F2947]">100%</div>
              <div className="text-xs text-[#7A8696] mt-0.5 font-medium">Tenant Data Privacy</div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          3. HOW IT WORKS (The 4-Step Operational Lifecycle)
          ========================================================================= */}
      <section id="workflow" className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#C05D34] uppercase tracking-widest">
            OPERATIONAL WORKFLOW
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0F2947] mt-2">
            How ProSurance Runs Your Agency
          </h2>
          <p className="text-xs sm:text-sm text-[#5E6877] mt-3">
            From the initial prospect inquiry to commission settlement, every policy flows through an automated four-stage pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-xl bg-white border border-[#E7E2D6] shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-[#FAF3EC] text-[#C05D34] font-serif font-bold text-sm flex items-center justify-center mb-4">
                01
              </div>
              <h3 className="font-serif font-bold text-base text-[#0F2947]">Client & KYC Vault</h3>
              <p className="text-xs text-[#5E6877] mt-2 leading-relaxed">
                Capture insured details, PAN/Aadhaar compliance records, vehicle registration numbers, and previous policy history in one unified client profile.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F0EBE1] text-[11px] font-semibold text-[#C05D34]">
              Instant deduplication & search
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-xl bg-white border border-[#E7E2D6] shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-serif font-bold text-sm flex items-center justify-center mb-4">
                02
              </div>
              <h3 className="font-serif font-bold text-base text-[#0F2947]">Multi-Insurer Binding</h3>
              <p className="text-xs text-[#5E6877] mt-2 leading-relaxed">
                Log underwritten policies across ICICI Lombard, HDFC ERGO, Star Health, and Tata AIG with instant calculation of OD/TP splits and GST.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F0EBE1] text-[11px] font-semibold text-emerald-700">
              Motor, Health, Life & Commercial
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-xl bg-white border border-[#E7E2D6] shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 font-serif font-bold text-sm flex items-center justify-center mb-4">
                03
              </div>
              <h3 className="font-serif font-bold text-base text-[#0F2947]">Automated Renewals</h3>
              <p className="text-xs text-[#5E6877] mt-2 leading-relaxed">
                Policies automatically enter 30-day, 15-day, and 7-day urgency queues. Office staff logs call outcomes with sub-second WebSocket broadcaser to field agents.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F0EBE1] text-[11px] font-semibold text-amber-700">
              96.4% policy retention rate
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-xl bg-white border border-[#E7E2D6] shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-serif font-bold text-sm flex items-center justify-center mb-4">
                04
              </div>
              <h3 className="font-serif font-bold text-base text-[#0F2947]">Commission Settlement</h3>
              <p className="text-xs text-[#5E6877] mt-2 leading-relaxed">
                Automatically reconcile incoming insurer brokerage disbursements against sales representative commissions, TDS deductions, and agency net retained profit.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F0EBE1] text-[11px] font-semibold text-blue-700">
              Automated PDF payout vouchers
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. CORE PLATFORM MODULES (Detailed Informational Breakdown)
          ========================================================================= */}
      <section id="features" className="py-20 bg-[#F4EFE6] border-y border-[#E7E2D6]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#C05D34] uppercase tracking-widest">
              ENTERPRISE CAPABILITIES
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0F2947] mt-2">
              Engineered for Insurance Intermediaries
            </h2>
            <p className="text-xs sm:text-sm text-[#5E6877] mt-3">
              Explore the specialized modules built specifically to eliminate manual paperwork and spreadsheet errors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl bg-white border border-[#E7E2D6] shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-[#FAF3EC] text-[#C05D34] flex items-center justify-center mb-4">
                <FileCheck className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#0F2947]">Policy Lifecycle Management</h3>
              <p className="text-xs text-[#5E6877] mt-2 leading-relaxed">
                Centralized repository for active, expired, and renewed policies. Stores digital policy document PDFs, endorsement amendments, and nominee details.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-[#4A5565]">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Digital PDF storage & instant dispatch</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Endorsement & RC transfer tracking</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Premium payment instalment schedules</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl bg-white border border-[#E7E2D6] shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#0F2947]">Automated Renewal Pipeline</h3>
              <p className="text-xs text-[#5E6877] mt-2 leading-relaxed">
                Prevents lapses with proactive 30-day, 15-day, and 7-day notification queues. Telecallers record call logs with one-click follow-up scheduling.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-[#4A5565]">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Expiring motor & health countdowns</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Call outcome tracking (Callback, Lost, Won)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Real-time renewal status broadcaser</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl bg-white border border-[#E7E2D6] shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
                <Coins className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#0F2947]">Commission & Brokerage Ledger</h3>
              <p className="text-xs text-[#5E6877] mt-2 leading-relaxed">
                Segregates Own Damage (OD) from Third Party (TP) premium cuts. Manages agent payout splits, TDS withholdings, and carrier disbursements.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-[#4A5565]">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> OD vs TP commission tiered slabs</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Sales representative payout vouchers</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Carrier balance sheet reconciliation</li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl bg-white border border-[#E7E2D6] shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-[#0F2947]/10 text-[#0F2947] flex items-center justify-center mb-4">
                <Layers className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#0F2947]">Multi-Tenant Tenant Isolation</h3>
              <p className="text-xs text-[#5E6877] mt-2 leading-relaxed">
                Strict database and schema isolation guarantees that client lists, commission percentages, and operational notes never cross agency boundaries.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-[#4A5565]">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 100% agency data confidentiality</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Zero cross-agency data bleed</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Dedicated broker agency workspace URL</li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-xl bg-white border border-[#E7E2D6] shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                <Users className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#0F2947]">Role-Based Access Governance</h3>
              <p className="text-xs text-[#5E6877] mt-2 leading-relaxed">
                Pre-configured workspaces for Company Admins, Operations Desk Staff, Field Sales Representatives, and System Super Administrators.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-[#4A5565]">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Granular read/write permissions</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Field agents only view their own leads</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Telecallers locked out of financial ledgers</li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-xl bg-white border border-[#E7E2D6] shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#0F2947]">IRDAI Compliance & Audit Vault</h3>
              <p className="text-xs text-[#5E6877] mt-2 leading-relaxed">
                Cryptographically stamps every policy modification, user login, and premium deletion to provide an immutable trail for IRDAI inspections.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-[#4A5565]">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Immutable event audit logs</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 256-bit AES database encryption</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> India data residency compliance</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. INTERACTIVE LIVE COMMISSION ENGINE (Real Tool on the Page)
          ========================================================================= */}
      <section id="calculator" className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-[#C05D34] uppercase tracking-widest">
            LIVE FINANCIAL SIMULATOR
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0F2947] mt-2">
            Brokerage & Commission Calculator
          </h2>
          <p className="text-xs sm:text-sm text-[#5E6877] mt-3">
            Simulate how ProSurance calculates base premiums, 18% GST, OD/TP commission splits, and sales representative payouts in real time.
          </p>
        </div>

        <div className="rounded-xl border border-[#D5CEBF] bg-white p-6 sm:p-8 shadow-xs max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Controls */}
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-[#0F2947] mb-2">
                  <span>Gross Premium (Inclusive of 18% GST)</span>
                  <span className="text-base font-bold text-[#C05D34]">₹{premiumAmount.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="300000"
                  step="5000"
                  value={premiumAmount}
                  onChange={(e) => setPremiumAmount(Number(e.target.value))}
                  className="w-full accent-[#C05D34] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-[#7A8696] mt-1 font-mono">
                  <span>₹10,000</span>
                  <span>₹1,50,000</span>
                  <span>₹3,00,000</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F2947] mb-1.5">Insurance Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Motor Private', 'Commercial', 'Health Floater', 'Life Term'] as const).map((lob) => (
                    <button
                      key={lob}
                      type="button"
                      onClick={() => setSelectedLOB(lob)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition cursor-pointer ${
                        selectedLOB === lob
                          ? 'bg-[#FAF3EC] border-[#C05D34] text-[#C05D34] font-semibold'
                          : 'bg-[#FAF8F5] border-[#E7E2D6] text-[#5E6877] hover:border-[#0F2947]'
                      }`}
                    >
                      {lob}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F2947] mb-1.5">Underwriting Carrier</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['ICICI Lombard', 'HDFC ERGO', 'Star Health', 'Tata AIG'] as const).map((carrier) => (
                    <button
                      key={carrier}
                      type="button"
                      onClick={() => setSelectedCarrier(carrier)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition cursor-pointer ${
                        selectedCarrier === carrier
                          ? 'bg-[#FAF3EC] border-[#C05D34] text-[#C05D34] font-semibold'
                          : 'bg-[#FAF8F5] border-[#E7E2D6] text-[#5E6877] hover:border-[#0F2947]'
                      }`}
                    >
                      {carrier}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Output Ledger Card */}
            <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E7E2D6] flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#0F2947] uppercase tracking-wider mb-4 pb-2 border-b border-[#E7E2D6]">
                  Real-Time Accrual Breakdown
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-[#5E6877]">
                    <span>Net Base Premium (ex-GST)</span>
                    <span className="font-semibold text-[#0F2947]">₹{calculation.netBase.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#5E6877]">
                    <span>Government GST (18%)</span>
                    <span className="font-semibold text-[#0F2947]">₹{calculation.gst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-px bg-[#E7E2D6] my-2" />
                  <div className="flex justify-between text-[#5E6877]">
                    <span>OD Commission Cut</span>
                    <span className="font-semibold text-[#0F2947]">₹{calculation.odCommission.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#5E6877]">
                    <span>TP Commission Cut</span>
                    <span className="font-semibold text-[#0F2947]">₹{calculation.tpCommission.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#0F2947] font-bold pt-1">
                    <span>Total Brokerage Accrual</span>
                    <span className="text-emerald-700">₹{calculation.totalBrokerage.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#5E6877]">
                    <span>Sales Rep Commission (65%)</span>
                    <span className="font-semibold text-[#0F2947]">₹{calculation.agentPayout.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E7E2D6] flex justify-between items-center">
                <div>
                  <div className="text-[11px] text-[#7A8696] font-medium">Agency Net Retained Margin</div>
                  <div className="text-xl font-serif font-bold text-[#C05D34]">
                    ₹{calculation.agencyRetained.toLocaleString('en-IN')}
                  </div>
                </div>
                <button
                  onClick={onLaunchApp}
                  className="px-4 py-2 rounded-lg bg-[#C05D34] hover:bg-[#A94F2B] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Open Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. SUPPORTED VERTICALS & UNDERWRITERS
          ========================================================================= */}
      <section id="insurers" className="py-20 bg-[#F4EFE6] border-y border-[#E7E2D6]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#C05D34] uppercase tracking-widest">
              COMPREHENSIVE UNDERWRITING
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0F2947] mt-2">
              All Major Verticals & Insurance Carriers
            </h2>
            <p className="text-xs sm:text-sm text-[#5E6877] mt-3">
              ProSurance supports the complete Indian general, health, and life insurance ecosystem out of the box.
            </p>
          </div>

          {/* 4 Verticals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="p-5 rounded-xl bg-white border border-[#E7E2D6] shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-[#FAF3EC] text-[#C05D34] flex items-center justify-center mb-3">
                <Car className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-sm text-[#0F2947]">Motor Insurance</h3>
              <p className="text-xs text-[#5E6877] mt-1 leading-relaxed">
                Private cars, two-wheelers, goods commercial vehicles, and fleet policies with automated RTO & engine number records.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-[#E7E2D6] shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-sm text-[#0F2947]">Health & Mediclaim</h3>
              <p className="text-xs text-[#5E6877] mt-1 leading-relaxed">
                Individual policies, family floater sum insured, critical illness riders, and cashless hospital network directory.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-[#E7E2D6] shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-sm text-[#0F2947]">Commercial & Marine</h3>
              <p className="text-xs text-[#5E6877] mt-1 leading-relaxed">
                Fire & special perils, marine cargo transit, burglary, factory plant machinery, and workmen's compensation.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-[#E7E2D6] shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-sm text-[#0F2947]">Life & Protection</h3>
              <p className="text-xs text-[#5E6877] mt-1 leading-relaxed">
                Term insurance, keyman protection, group term life, and endowment policies with nominee archival.
              </p>
            </div>
          </div>

          {/* Underwriter Badges */}
          <div className="p-6 rounded-xl bg-white border border-[#E7E2D6] shadow-2xs">
            <div className="text-xs font-semibold text-[#7A8696] uppercase tracking-wider text-center mb-4">
              Integrated General & Health Underwriters
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-center text-xs font-semibold text-[#0F2947]">
              <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E7E2D6]">ICICI Lombard</div>
              <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E7E2D6]">HDFC ERGO</div>
              <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E7E2D6]">Star Health</div>
              <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E7E2D6]">Tata AIG</div>
              <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E7E2D6]">Bajaj Allianz</div>
              <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E7E2D6]">Care Health</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. TRADITIONAL EXCEL VS PROSURANCE (Comparison Matrix)
          ========================================================================= */}
      <section id="comparison" className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#C05D34] uppercase tracking-widest">
            THE MODERN ADVANTAGE
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0F2947] mt-2">
            Traditional Spreadsheets vs. ProSurance
          </h2>
          <p className="text-xs sm:text-sm text-[#5E6877] mt-3">
            Why leading brokerages are replacing fragmented Excel sheets and WhatsApp groups with a unified operating system.
          </p>
        </div>

        <div className="rounded-xl border border-[#D5CEBF] bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E7E2D6] text-[#0F2947]">
                  <th className="py-3.5 px-6 font-semibold w-1/3">Operations Capability</th>
                  <th className="py-3.5 px-6 font-semibold text-rose-700 bg-rose-50/50 w-1/3">
                    Traditional Agency (Spreadsheets & Paper)
                  </th>
                  <th className="py-3.5 px-6 font-semibold text-emerald-800 bg-emerald-50/50 w-1/3">
                    ProSurance Operating System
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                <tr>
                  <td className="py-4 px-6 font-semibold text-[#0F2947]">Policy Records & Endorsements</td>
                  <td className="py-4 px-6 text-[#5E6877] bg-rose-50/30 flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Scattered across WhatsApp folders, desktop PDFs, and lost emails.</span>
                  </td>
                  <td className="py-4 px-6 text-[#0F2947] bg-emerald-50/30 font-medium">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Single searchable vault with instant registration number search & PDF downloads.</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="py-4 px-6 font-semibold text-[#0F2947]">Renewal Expiry Management</td>
                  <td className="py-4 px-6 text-[#5E6877] bg-rose-50/30 flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Checked manually at end of month; 15-25% policies lapse unnoticed.</span>
                  </td>
                  <td className="py-4 px-6 text-[#0F2947] bg-emerald-50/30 font-medium">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Automated 30/15/7-day countdown queues with telecaller log history.</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="py-4 px-6 font-semibold text-[#0F2947]">Brokerage & OD/TP Calculation</td>
                  <td className="py-4 px-6 text-[#5E6877] bg-rose-50/30 flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Manual Excel math prone to formula errors and disputes with sales reps.</span>
                  </td>
                  <td className="py-4 px-6 text-[#0F2947] bg-emerald-50/30 font-medium">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Automatic OD/TP commission segregation and automated payout vouchers.</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="py-4 px-6 font-semibold text-[#0F2947]">Field Agent Coordination</td>
                  <td className="py-4 px-6 text-[#5E6877] bg-rose-50/30 flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Constant back-and-forth phone calls asking if client payment cleared.</span>
                  </td>
                  <td className="py-4 px-6 text-[#0F2947] bg-emerald-50/30 font-medium">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Sub-second real-time WebSocket sync between office staff and field agents.</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="py-4 px-6 font-semibold text-[#0F2947]">Data Privacy & Security</td>
                  <td className="py-4 px-6 text-[#5E6877] bg-rose-50/30 flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Customer phone numbers easily leaked when employees leave the agency.</span>
                  </td>
                  <td className="py-4 px-6 text-[#0F2947] bg-emerald-50/30 font-medium">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Strict role permissions, encrypted audit trails, and multi-tenant data isolation.</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. FREQUENTLY ASKED QUESTIONS (Interactive Accordion)
          ========================================================================= */}
      <section id="faq" className="py-20 bg-[#F4EFE6] border-t border-[#E7E2D6]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-[#C05D34] uppercase tracking-widest">
              COMMON QUESTIONS
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0F2947] mt-2">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[#5E6877] mt-3">
              Clear answers on licensing, data isolation, commission accounting, and compliance.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'How does ProSurance calculate OD and TP commissions on motor policies?',
                a: 'Under Indian motor tariff guidelines, Own Damage (OD) premium carries a distinct brokerage rate (e.g. 15%) compared to the statutory Third Party (TP) liability premium (typically 2.5%). ProSurance automatically strips out the 18% GST, isolates the net OD and TP premium components, and applies your agency’s exact commission slab to generate audit-ready settlement figures.',
              },
              {
                q: 'Can our field sales agents see total brokerage earnings or other reps’ clients?',
                a: 'No. ProSurance enforces strict Role-Based Access Control (RBAC). Sales representatives only have access to their assigned leads, customer contacts, and their personal commission payouts. They cannot view agency-wide brokerage margins, competitor underwriting agreements, or other agents’ accounts.',
              },
              {
                q: 'Is our agency data completely private from other brokerages using the software?',
                a: 'Yes. ProSurance is architected with complete multi-tenant cryptographic isolation. Each brokerage operates within a dedicated tenant sandbox. No agency can ever access, view, or query another brokerage’s policyholders, staff records, or commission rules.',
              },
              {
                q: 'How does the sub-second WebSocket follow-up broadcaser work?',
                a: 'Whenever an office staff member records a renewal payment, logs a callback request, or updates client notes, a WebSocket event broadcasts across your agency. Field sales agents and managing directors see the status update on their screen instantly without needing to manually refresh their browser.',
              },
              {
                q: 'Can we export data for GST audits, accounting, and IRDAI inspections?',
                a: 'Yes. ProSurance allows authorized Company Admins to export comprehensive policy registers, monthly Gross Written Premium (GWP) summaries, commission disbursement ledgers, and immutable audit logs in Excel and PDF formats anytime.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#D5CEBF] bg-white overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-serif font-bold text-sm text-[#0F2947]">
                    {faq.q}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#E7E2D6] flex items-center justify-center shrink-0 text-[#C05D34]">
                    {openFaq === idx ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </button>

                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs text-[#5E6877] leading-relaxed border-t border-[#F0EBE1]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. FINAL CALL TO ACTION (Warm Minimal Card)
          ========================================================================= */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="rounded-2xl bg-[#FAF8F5] border-2 border-[#D5CEBF] p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-2xs">
          <h2 className="font-serif text-3xl font-bold text-[#0F2947]">
            Ready to upgrade your insurance brokerage?
          </h2>
          <p className="text-xs sm:text-sm text-[#5E6877] mt-3 max-w-lg mx-auto leading-relaxed">
            Eliminate missed renewals, streamline your telecalling desk, and automate commission splits with zero setup hassle.
          </p>

          <div className="mt-8 flex justify-center">
            <button
              onClick={onLaunchApp}
              className="px-6 py-3 rounded-lg bg-[#C05D34] hover:bg-[#A94F2B] text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Access ProSurance Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. FOOTER
          ========================================================================= */}
      <footer className="pt-14 pb-10 bg-[#F3EFE6] border-t border-[#E7E2D6]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#D5CEBF] text-xs">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-[#C05D34] text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-serif font-bold text-base text-[#0F2947]">ProSurance</span>
              </div>
              <p className="text-[#5E6877] leading-relaxed">
                The unified cloud operating system for insurance brokers, corporate agencies, and underwriting intermediaries.
              </p>
              <div className="mt-3 text-[11px] text-[#7A8696]">IRDAI Broking Regulations 2018 Compliant</div>
            </div>

            <div>
              <h4 className="font-semibold text-[#0F2947] mb-3">Capabilities</h4>
              <ul className="space-y-2 text-[#5E6877]">
                <li><a href="#features" className="hover:text-[#0F2947]">Policy Management</a></li>
                <li><a href="#features" className="hover:text-[#0F2947]">Automated Renewals</a></li>
                <li><a href="#features" className="hover:text-[#0F2947]">OD / TP Commission Ledger</a></li>
                <li><a href="#features" className="hover:text-[#0F2947]">Follow-up Broadcaster</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-[#0F2947] mb-3">Underwriters</h4>
              <ul className="space-y-2 text-[#5E6877]">
                <li>ICICI Lombard General</li>
                <li>HDFC ERGO General</li>
                <li>Star Health & Allied</li>
                <li>Tata AIG General</li>
                <li>Bajaj Allianz General</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-[#0F2947] mb-3">System Access</h4>
              <ul className="space-y-2 text-[#5E6877]">
                <li>
                  <button onClick={onLaunchApp} className="hover:text-[#C05D34] cursor-pointer">
                    Sign In to Agency Workspace
                  </button>
                </li>
                <li>
                  <a href="#faq" className="hover:text-[#0F2947]">Frequently Asked Questions</a>
                </li>
                <li>
                  <a href="#calculator" className="hover:text-[#0F2947]">Live Commission Calculator</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#7A8696]">
            <div>© 2026 ProSurance Systems Inc. All rights reserved.</div>
            <div>All Systems Operational (99.98% SLA)</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
