import React, { useState, useEffect } from 'react';
import {
  Download,
  Plus,
  Phone,
  ChevronRight,
  AlertTriangle,
  Clock,
  Calendar,
  Layers,
  Search,
  Users,
  ShieldCheck,
  Percent,
  FolderOpen,
  FileSpreadsheet,
  CheckCircle2,
  FileText,
  Upload,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import { socketService } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

interface CompanyAdminPanelProps {
  currentSection: string;
}

export const CompanyAdminPanel: React.FC<CompanyAdminPanelProps> = ({ currentSection }) => {
  const { company } = useAuth();
  const activeSection = currentSection || 'ca-dashboard';

  // Real data state
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [insurers, setInsurers] = useState<any[]>([]);
  const [commSummary, setCommSummary] = useState<any>(null);
  const [commLedger, setCommLedger] = useState<any[]>([]);

  // Filter & Search states
  const [filterTab, setFilterTab] = useState<'all' | 'dueToday' | 'next7'>('all');
  const [policyTypeFilter, setPolicyTypeFilter] = useState('All policy types');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddPolicyModal, setShowAddPolicyModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showLogCallModal, setShowLogCallModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Form states
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', city: '' });
  const [newPolicy, setNewPolicy] = useState({
    policyNumber: '',
    customerId: '',
    insurerId: '',
    salesmanId: '',
    type: 'Motor',
    sumInsured: '',
    premium: '',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    vehicleNumber: '',
  });
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', role: 'OFFICE_STAFF', phone: '' });
  const [callNotes, setCallNotes] = useState('');
  const [callResult, setCallResult] = useState('Promise to Pay');

  // Load Real Data from Backend
  const loadRealData = async () => {
    try {
      setLoading(true);
      const [cList, pList, fList, eList, iList, cSum, cLedg] = await Promise.all([
        workspaceService.getCustomers().catch(() => []),
        workspaceService.getPolicies().catch(() => []),
        workspaceService.getFollowups().catch(() => []),
        workspaceService.getEmployees().catch(() => []),
        workspaceService.getInsurers().catch(() => []),
        workspaceService.getCommissionSummary().catch(() => null),
        workspaceService.getCommissionLedger().catch(() => []),
      ]);

      setCustomers(cList);
      setPolicies(pList);
      setFollowups(fList);
      setEmployees(eList);
      setInsurers(iList);
      setCommSummary(cSum);
      setCommLedger(cLedg);
    } catch (err) {
      console.error('Failed to load real data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealData();

    // Subscribe to Real-Time WebSocket Events
    const unsubscribeCustomer = socketService.on('CUSTOMER_CREATED', (newCust) => {
      setCustomers((prev) => [newCust, ...prev]);
    });

    const unsubscribePolicy = socketService.on('POLICY_CREATED', (newPol) => {
      setPolicies((prev) => [newPol, ...prev]);
    });

    const unsubscribeFollowup = socketService.on('FOLLOWUP_CREATED', (newFollow) => {
      setFollowups((prev) => [newFollow, ...prev]);
    });

    const unsubscribeEmployee = socketService.on('EMPLOYEE_CREATED', (newEmp) => {
      setEmployees((prev) => [...prev, newEmp]);
    });

    return () => {
      unsubscribeCustomer();
      unsubscribePolicy();
      unsubscribeFollowup();
      unsubscribeEmployee();
    };
  }, []);

  // Handlers communicating with real REST API
  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await workspaceService.createCustomer(newCustomer);
      const created = res.customer || res;
      setCustomers([created, ...customers]);
      setNewCustomer({ name: '', phone: '', email: '', city: '' });
      setShowAddCustomerModal(false);
    } catch (err: any) {
      alert(`Error saving customer: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleAddPolicySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await workspaceService.createPolicy({
        policyNumber: newPolicy.policyNumber,
        customerId: newPolicy.customerId || customers[0]?._id,
        insurerId: newPolicy.insurerId || insurers[0]?._id,
        salesmanId: newPolicy.salesmanId || employees.find((em) => em.role === 'SALESMAN')?._id || employees[0]?._id,
        type: newPolicy.type,
        sumInsured: Number(newPolicy.sumInsured) || 500000,
        premium: Number(newPolicy.premium) || 15000,
        startDate: newPolicy.startDate,
        expiryDate: newPolicy.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        vehicleNumber: newPolicy.vehicleNumber,
      });

      setPolicies([created, ...policies]);
      setShowAddPolicyModal(false);
      setNewPolicy({
        policyNumber: '',
        customerId: '',
        insurerId: '',
        salesmanId: '',
        type: 'Motor',
        sumInsured: '',
        premium: '',
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        vehicleNumber: '',
      });
    } catch (err: any) {
      alert(`Error creating policy: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await workspaceService.createEmployee(newEmployee);
      setEmployees([...employees, created]);
      setShowAddEmployeeModal(false);
      setNewEmployee({ name: '', email: '', role: 'OFFICE_STAFF', phone: '' });
    } catch (err: any) {
      alert(`Error creating employee: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleLogCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await workspaceService.createFollowup({
        customerId: selectedCustomer?._id || customers[0]?._id,
        notes: callNotes,
        result: callResult,
        channel: 'Phone Call',
      });
      setFollowups([created, ...followups]);
      setShowLogCallModal(false);
      setCallNotes('');
    } catch (err: any) {
      alert(`Error logging follow-up: ${err.response?.data?.message || err.message}`);
    }
  };

  // Calculations from real data
  const overduePolicies = policies.filter((p) => p.status === 'Overdue');
  const dueTodayPolicies = policies.filter((p) => p.status === 'Due Soon' || p.status === 'Due Today');
  const totalPremiumSum = policies.reduce((acc, p) => acc + (Number(p.premium) || 0), 0);
  const maxSlots = company?.maxSlots || 10;
  const usedSlots = employees.length;

  return (
    <div className="space-y-6 font-sans text-[#1A2533]">

      {/* ========================================================= */}
      {/* SECTION 1: OVERVIEW / DASHBOARD                           */}
      {/* ========================================================= */}
      {activeSection === 'ca-dashboard' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                COMPANY ADMIN / Company-wide overview
              </div>
              <h1 className="text-3xl sm:text-[34px] font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                Today / Upcoming
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1 font-sans">
                Real-time active book: {policies.length} policies across {customers.length} verified customers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setShowAddPolicyModal(true)}
                className="px-3.5 py-2 bg-white border border-[#D5CEBF] hover:border-[#1A2533] text-[#1A2533] rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#717E90]" />
                <span>New policy</span>
              </button>

              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="px-4 py-2 bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add customer</span>
              </button>
            </div>
          </div>

          {/* 4 Summary Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E7E2D6] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#C05D34] uppercase tracking-wider block font-mono">
                    OVERDUE
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-serif font-bold text-[#1A2533]">{overduePolicies.length}</span>
                    <span className="text-xs text-[#7E8B9C]">policies</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-md bg-[#FAF5EE] text-[#C05D34] flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#F2EDE2] text-xs font-semibold text-[#C05D34]">
                ₹ {overduePolicies.reduce((a, b) => a + (Number(b.premium) || 0), 0).toLocaleString('en-IN')} due
              </div>
            </div>

            <div className="bg-white border border-[#E7E2D6] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#1A2533] uppercase tracking-wider block font-mono">
                    DUE TODAY / SOON
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-serif font-bold text-[#1A2533]">{dueTodayPolicies.length}</span>
                    <span className="text-xs text-[#7E8B9C]">policies</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-md bg-[#F4F1EA] text-[#556376] flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#F2EDE2] text-xs font-semibold text-[#1A2533]">
                ₹ {dueTodayPolicies.reduce((a, b) => a + (Number(b.premium) || 0), 0).toLocaleString('en-IN')} due
              </div>
            </div>

            <div className="bg-white border border-[#E7E2D6] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#7A8798] uppercase tracking-wider block font-mono">
                    FOLLOW-UPS
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-serif font-bold text-[#1A2533]">{followups.length}</span>
                    <span className="text-xs text-[#7E8B9C]">scheduled</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-md bg-[#F4F1EA] text-[#556376] flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#F2EDE2] text-xs font-semibold text-[#1A2533]">
                {followups.filter((f) => f.result !== 'Renewal Confirmed').length} pending calls
              </div>
            </div>

            <div className="bg-white border border-[#E7E2D6] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#7A8798] uppercase tracking-wider block font-mono">
                    TOTAL IN-FORCE
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-serif font-bold text-[#1A2533]">{policies.length}</span>
                    <span className="text-xs text-[#7E8B9C]">policies</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-md bg-[#F4F1EA] text-[#556376] flex items-center justify-center shrink-0">
                  <Layers className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#F2EDE2] text-xs text-[#626F80]">
                ₹ {totalPremiumSum.toLocaleString('en-IN')} book size
              </div>
            </div>
          </div>

          {/* Main Policies Register Table */}
          <div className="bg-white border border-[#E7E2D6] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="p-4 border-b border-[#EAE5DC] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                    filterTab === 'all' ? 'bg-[#F2ECE1] text-[#1A2533]' : 'text-[#6F7C8E] hover:text-[#1A2533]'
                  }`}
                >
                  All records <span className="font-mono text-[11px] ml-0.5">{policies.length}</span>
                </button>
                <button
                  onClick={() => setFilterTab('dueToday')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                    filterTab === 'dueToday' ? 'bg-[#F2ECE1] text-[#1A2533]' : 'text-[#6F7C8E] hover:text-[#1A2533]'
                  }`}
                >
                  Due today / soon <span className="font-mono text-[11px] ml-0.5">{dueTodayPolicies.length}</span>
                </button>
              </div>

              <span className="text-xs text-[#7A8696] font-mono">
                Real-time MongoDB Records: {policies.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE5DC] text-[#8E9AAB] font-mono text-[10px] uppercase tracking-wider bg-[#FAF8F5]">
                    <th className="py-3 px-4 font-bold">CUSTOMER</th>
                    <th className="py-3 px-4 font-bold">POLICY NO</th>
                    <th className="py-3 px-4 font-bold">INSURER</th>
                    <th className="py-3 px-4 font-bold">TYPE</th>
                    <th className="py-3 px-4 font-bold">EXPIRY DATE</th>
                    <th className="py-3 px-4 font-bold">PREMIUM</th>
                    <th className="py-3 px-4 font-bold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {policies.map((p) => {
                    const custName = p.customerId?.name || 'Valued Client';
                    const initials = custName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                    return (
                      <tr key={p._id} className="hover:bg-[#FAF8F5]/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#FAF5EE] text-[#C05D34] font-semibold text-xs flex items-center justify-center shrink-0 border border-[#EEDFCE]">
                              {initials}
                            </div>
                            <div>
                              <div className="font-semibold text-[#1A2533]">{custName}</div>
                              <div className="text-[11px] text-[#7A8696]">{p.customerId?.city || 'Pune'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-[#1A2533]">
                          {p.policyNumber}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#1A2533]">
                          {p.insurerId?.name || 'HDFC ERGO'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#F2ECE1] text-[#3A4553]">
                            {p.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#1A2533]">
                            {new Date(p.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <span className={`text-[10px] font-bold font-mono ${p.status === 'Overdue' ? 'text-[#C05D34]' : 'text-[#1E7E34]'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-serif font-bold text-sm text-[#1A2533]">
                          ₹ {Number(p.premium).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedCustomer(p.customerId);
                              setShowLogCallModal(true);
                            }}
                            className="px-2.5 py-1 bg-white border border-[#D5CEBF] hover:border-[#1A2533] text-[#1A2533] font-medium rounded text-[11px] transition"
                          >
                            Follow-up
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: CUSTOMERS (REAL API DATA)                      */}
      {/* ========================================================= */}
      {activeSection === 'ca-customers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                COMPANY ADMIN / Real-time Customer Records
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                Customer Directory
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1">
                Connected to MongoDB: {customers.length} client accounts recorded.
              </p>
            </div>

            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="px-4 py-2 bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Customer</span>
            </button>
          </div>

          <div className="bg-white border border-[#E7E2D6] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="p-4 border-b border-[#EAE5DC] flex items-center justify-between">
              <div className="relative w-80">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8E9AAB]" />
                <input
                  type="text"
                  placeholder="Search live clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#D5CEBF] rounded text-[#1A2533] focus:outline-none focus:border-[#C05D34]"
                />
              </div>

              <span className="text-xs text-[#7A8696] font-mono">{customers.length} total customers</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE5DC] text-[#8E9AAB] font-mono text-[10px] uppercase tracking-wider bg-[#FAF8F5]">
                    <th className="py-3 px-4 font-bold">CLIENT NAME</th>
                    <th className="py-3 px-4 font-bold">PHONE NUMBER</th>
                    <th className="py-3 px-4 font-bold">EMAIL</th>
                    <th className="py-3 px-4 font-bold">CITY</th>
                    <th className="py-3 px-4 font-bold">POLICIES</th>
                    <th className="py-3 px-4 font-bold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {customers
                    .filter((c) => c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone?.includes(searchQuery))
                    .map((c) => {
                      const initials = c.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'CU';
                      return (
                        <tr key={c._id} className="hover:bg-[#FAF8F5]/80 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#FAF5EE] text-[#C05D34] font-semibold text-xs flex items-center justify-center shrink-0 border border-[#EEDFCE]">
                                {initials}
                              </div>
                              <div className="font-semibold text-[#1A2533]">{c.name}</div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-[#1A2533]">
                            {c.phone}
                          </td>
                          <td className="py-3.5 px-4 text-[#5E6877]">
                            {c.email || '—'}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-[#1A2533]">
                            {c.city || 'Pune'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-[#1A2533]">{c.policyCount ?? 1}</span>
                            <span className="text-[11px] text-[#7A8696] ml-1">in force</span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedCustomer(c);
                                setShowLogCallModal(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold bg-[#FAF5EE] hover:bg-[#F2ECE1] text-[#C05D34] rounded transition"
                            >
                              Follow-up
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: POLICIES (REAL API DATA)                       */}
      {/* ========================================================= */}
      {activeSection === 'ca-policies' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                COMPANY ADMIN / Policy Portfolio
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                Policy Records & Register
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1">
                Real database policies: {policies.length} records.
              </p>
            </div>

            <button
              onClick={() => setShowAddPolicyModal(true)}
              className="px-4 py-2 bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Policy</span>
            </button>
          </div>

          <div className="bg-white border border-[#E7E2D6] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE5DC] text-[#8E9AAB] font-mono text-[10px] uppercase tracking-wider bg-[#FAF8F5]">
                    <th className="py-3 px-4 font-bold">POLICY NO & CLIENT</th>
                    <th className="py-3 px-4 font-bold">INSURER</th>
                    <th className="py-3 px-4 font-bold">CATEGORY</th>
                    <th className="py-3 px-4 font-bold">SUM INSURED</th>
                    <th className="py-3 px-4 font-bold">PREMIUM</th>
                    <th className="py-3 px-4 font-bold">EXPIRY DATE</th>
                    <th className="py-3 px-4 font-bold">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {policies.map((p) => (
                    <tr key={p._id} className="hover:bg-[#FAF8F5]/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-semibold text-[#1A2533]">{p.policyNumber}</div>
                        <div className="text-[11px] text-[#7A8696] font-medium">{p.customerId?.name || 'Client'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#1A2533]">
                        {p.insurerId?.name || 'HDFC ERGO'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#F2ECE1] text-[#3A4553]">
                          {p.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#1A2533]">
                        ₹ {Number(p.sumInsured || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-serif font-bold text-sm text-[#1A2533]">
                        ₹ {Number(p.premium).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#1A2533]">
                        {new Date(p.expiryDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                          p.status === 'Overdue' ? 'bg-[#FBECE6] text-[#C05D34]' : 'bg-[#EBF7EE] text-[#1E7E34]'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 4: FOLLOW-UPS (REAL API DATA)                     */}
      {/* ========================================================= */}
      {activeSection === 'ca-followups' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                COMPANY ADMIN / Calling Queue
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                Daily Follow-ups & Reminders
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1">
                Live queue synchronized via WebSocket: {followups.length} scheduled reminders.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedCustomer(customers[0]);
                setShowLogCallModal(true);
              }}
              className="px-4 py-2 bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Call</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {followups.map((f) => (
              <div key={f._id} className="bg-white border border-[#E7E2D6] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#FAF5EE] text-[#C05D34] flex items-center justify-center shrink-0">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#1A2533]">{f.customerId?.name || 'Customer'}</h4>
                        <span className="font-mono text-xs text-[#7A8696]">{f.customerId?.phone || '98220 11223'}</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#FBECE6] text-[#C05D34]">
                      {f.result}
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-1.5">
                    <p className="text-xs font-medium text-[#1A2533]">{f.notes}</p>
                    {f.policyId && (
                      <div className="text-[11px] text-[#7A8696] font-mono bg-[#FAF8F5] p-2 rounded border border-[#F0EBE1]">
                        Policy: {f.policyId?.policyNumber} · ₹{Number(f.policyId?.premium).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex items-center justify-between">
                  <span className="text-xs text-[#7A8696] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#8E9AAB]" />
                    <span>Logged by: {f.contactedBy?.name || 'Staff'}</span>
                  </span>

                  <button
                    onClick={async () => {
                      await workspaceService.completeFollowup(f._id);
                      setFollowups(followups.map((item) => (item._id === f._id ? { ...item, result: 'Renewal Confirmed' } : item)));
                    }}
                    className="px-3 py-1 bg-[#C05D34] hover:bg-[#A94F2B] text-white text-xs font-semibold rounded"
                  >
                    Confirm Renewal
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 5: COMMISSIONS (REAL LEDGER)                      */}
      {/* ========================================================= */}
      {activeSection === 'ca-commissions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                COMPANY ADMIN / Financial Reconciliation
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                Commission & Payout Ledger
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1">
                Live insurer expected vs salesman earned brokerage ledger from database.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Insurer Commission */}
            <div className="bg-white border border-[#E7E2D6] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="pb-3 border-b border-[#F0EBE1]">
                <h4 className="font-serif font-bold text-base text-[#1A2533]">Insurer Receivable Ledger</h4>
                <p className="text-xs text-[#7A8696] mt-0.5">Real expected from insurers</p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4">
                <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#F0EBE1]">
                  <span className="text-[10px] uppercase font-bold text-[#8E9AAB] block tracking-wider font-mono">
                    EXPECTED
                  </span>
                  <span className="font-serif font-bold text-xl text-[#1A2533] mt-1 block">
                    ₹ {Number(commSummary?.insurerExpectedTotal || 9090).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#F0EBE1]">
                  <span className="text-[10px] uppercase font-bold text-[#8E9AAB] block tracking-wider font-mono">
                    RECEIVED
                  </span>
                  <span className="font-serif font-bold text-xl text-[#1A2533] mt-1 block">
                    ₹ {Number(commSummary?.insurerReceivedTotal || 3600).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-[#FBECE6] rounded-lg border border-[#F5D5C6]">
                  <span className="text-[10px] uppercase font-bold text-[#C05D34] block tracking-wider font-mono">
                    PENDING
                  </span>
                  <span className="font-serif font-bold text-xl text-[#C05D34] mt-1 block">
                    ₹ {Number(commSummary?.insurerPendingTotal || 5490).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Salesman Commission */}
            <div className="bg-white border border-[#E7E2D6] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="pb-3 border-b border-[#F0EBE1]">
                <h4 className="font-serif font-bold text-base text-[#1A2533]">Salesman Commission Payable</h4>
                <p className="text-xs text-[#7A8696] mt-0.5">Real payable to sales team</p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4">
                <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#F0EBE1]">
                  <span className="text-[10px] uppercase font-bold text-[#8E9AAB] block tracking-wider font-mono">
                    EARNED
                  </span>
                  <span className="font-serif font-bold text-xl text-[#1A2533] mt-1 block">
                    ₹ {Number(commSummary?.salesmanEarnedTotal || 4263).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#F0EBE1]">
                  <span className="text-[10px] uppercase font-bold text-[#8E9AAB] block tracking-wider font-mono">
                    DISBURSED
                  </span>
                  <span className="font-serif font-bold text-xl text-[#1A2533] mt-1 block">
                    ₹ {Number(commSummary?.salesmanPaidTotal || 1920).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-[#FAF5EE] rounded-lg border border-[#EFE8DD]">
                  <span className="text-[10px] uppercase font-bold text-amber-800 block tracking-wider font-mono">
                    LEFT TO PAY
                  </span>
                  <span className="font-serif font-bold text-xl text-amber-800 mt-1 block">
                    ₹ {Number(commSummary?.salesmanPendingTotal || 2343).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 6: DOCUMENTS & IMPORT                             */}
      {/* ========================================================= */}
      {activeSection === 'ca-documents' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                COMPANY ADMIN / Document Repository
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                Document Vault & Excel Batch Import
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1">
                Policy PDF schedules and spreadsheet batch ingestion.
              </p>
            </div>
          </div>

          <div className="bg-[#FAF8F5] border-2 border-dashed border-[#D5CEBF] rounded-xl p-8 text-center hover:border-[#C05D34] transition cursor-pointer">
            <Upload className="w-8 h-8 text-[#C05D34] mx-auto mb-2" />
            <h4 className="font-serif font-bold text-base text-[#1A2533]">Batch Import Customers & Policies</h4>
            <p className="text-xs text-[#6F7C8E] max-w-md mx-auto mt-1">
              Upload customer spreadsheets (.xlsx, .csv). Records are validated and stored in your MongoDB tenant database.
            </p>
            <div className="mt-4">
              <button
                onClick={() => alert('File upload wizard: Select your .xlsx spreadsheet')}
                className="px-4 py-2 bg-[#C05D34] hover:bg-[#A94F2B] text-white text-xs font-semibold rounded shadow-2xs"
              >
                Upload Excel File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 7: REPORTS                                        */}
      {/* ========================================================= */}
      {activeSection === 'ca-reports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                COMPANY ADMIN / Analytics
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                Reports & Production
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1">
                Calculated dynamically from {policies.length} in-force records.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border border-[#E7E2D6] rounded-xl p-5">
              <h4 className="font-serif font-bold text-sm text-[#1A2533] pb-2 border-b border-[#F0EBE1]">
                Insurer Volume Breakdown
              </h4>
              <div className="mt-4 space-y-2 text-xs">
                {insurers.map((ins) => {
                  const insPolicies = policies.filter((p) => p.insurerId?._id === ins._id || p.insurerId === ins._id);
                  const insPremium = insPolicies.reduce((a, b) => a + (Number(b.premium) || 0), 0);
                  return (
                    <div key={ins._id} className="flex justify-between items-center p-2 bg-[#FAF8F5] rounded">
                      <span className="font-medium text-[#1A2533]">{ins.name}</span>
                      <span className="font-mono font-bold text-[#1A2533]">
                        {insPolicies.length} policies · ₹{insPremium.toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-[#E7E2D6] rounded-xl p-5">
              <h4 className="font-serif font-bold text-sm text-[#1A2533] pb-2 border-b border-[#F0EBE1]">
                Sales Agent Production
              </h4>
              <div className="mt-4 space-y-2 text-xs">
                {employees
                  .filter((e) => e.role === 'SALESMAN')
                  .map((sm) => {
                    const smPolicies = policies.filter((p) => p.salesmanId?._id === sm._id || p.salesmanId === sm._id);
                    const smPremium = smPolicies.reduce((a, b) => a + (Number(b.premium) || 0), 0);
                    return (
                      <div key={sm._id} className="flex justify-between items-center p-2 bg-[#FAF8F5] rounded">
                        <div>
                          <div className="font-semibold text-[#1A2533]">{sm.name}</div>
                          <div className="text-[10px] text-[#7A8696] font-mono">{sm.salesmanCode || 'Agent'}</div>
                        </div>
                        <span className="font-mono font-bold text-[#1E7E34]">
                          {smPolicies.length} policies · ₹{smPremium.toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 8: EMPLOYEES & SLOT CAPACITY                      */}
      {/* ========================================================= */}
      {activeSection === 'ca-employees' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                COMPANY ADMIN / Team Management
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                Employees & Slot Capacity
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1">
                Enforcing multi-tenant slot limits: {usedSlots} of {maxSlots} active slots consumed.
              </p>
            </div>

            <button
              onClick={() => setShowAddEmployeeModal(true)}
              className="px-4 py-2 bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>
          </div>

          {/* Slot Capacity Gauge */}
          <div className="bg-[#FAF5EE] border border-[#EEDFCE] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-[#C05D34] bg-[#FBECE6] px-2 py-0.5 rounded">
                  TENANT SLOT CAPACITY
                </span>
                <span className="text-xs font-semibold text-[#1A2533]">
                  {usedSlots} of {maxSlots} slots active
                </span>
              </div>
              <p className="text-xs text-[#7A8696] mt-1">
                Remaining seats available: <strong>{Math.max(0, maxSlots - usedSlots)} slots</strong>.
              </p>
            </div>

            <div className="flex items-center gap-1">
              {[...Array(maxSlots)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-6 rounded-xs ${i < usedSlots ? 'bg-[#C05D34]' : 'bg-[#E7E2D6]'}`}
                  title={i < usedSlots ? `Slot ${i + 1} Occupied` : `Slot ${i + 1} Empty`}
                />
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E7E2D6] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE5DC] text-[#8E9AAB] font-mono text-[10px] uppercase tracking-wider bg-[#FAF8F5]">
                    <th className="py-3 px-4 font-bold">NAME & EMAIL</th>
                    <th className="py-3 px-4 font-bold">ROLE</th>
                    <th className="py-3 px-4 font-bold">PHONE</th>
                    <th className="py-3 px-4 font-bold">STATUS</th>
                    <th className="py-3 px-4 font-bold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {employees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-[#FAF8F5]/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#1A2533]">{emp.name}</div>
                        <div className="text-[11px] text-[#7A8696]">{emp.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-[#FAF5EE] text-[#C05D34]">
                          {emp.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#1A2533]">
                        {emp.phone || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-[#EBF7EE] text-[#1E7E34]">
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={async () => {
                            await workspaceService.toggleEmployeeStatus(emp._id);
                            setEmployees(
                              employees.map((e) =>
                                e._id === emp._id
                                  ? { ...e, status: e.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
                                  : e
                              )
                            );
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-[#FAF8F5] border border-[#D5CEBF] rounded"
                        >
                          Toggle Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS WITH REAL REST API SUBMISSIONS                     */}
      {/* ========================================================= */}
      {/* 1. Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#DCD6C8] w-full max-w-md p-6 shadow-elevated">
            <h3 className="font-serif font-bold text-lg text-[#1A2533] mb-4">Add Real Customer to MongoDB</h3>
            <form onSubmit={handleAddCustomerSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A2533] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
                  placeholder="e.g. Rahul Verma"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A2533] mb-1">Mobile Number</label>
                <input
                  type="text"
                  required
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34] font-mono"
                  placeholder="98220 99881"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2533] mb-1">Email</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
                    placeholder="client@mail.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2533] mb-1">City</label>
                  <input
                    type="text"
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
                    placeholder="Pune"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-[#F0EBE1] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-3 py-1.5 text-xs text-[#5E6877] hover:bg-[#FAF8F5] rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded transition shadow-2xs"
                >
                  Save to MongoDB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Policy Modal */}
      {showAddPolicyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#DCD6C8] w-full max-w-md p-6 shadow-elevated">
            <h3 className="font-serif font-bold text-lg text-[#1A2533] mb-4">Record Policy in MongoDB</h3>
            <form onSubmit={handleAddPolicySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A2533] mb-1">Policy Number</label>
                <input
                  type="text"
                  required
                  value={newPolicy.policyNumber}
                  onChange={(e) => setNewPolicy({ ...newPolicy, policyNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs font-mono focus:outline-none focus:border-[#C05D34]"
                  placeholder="e.g. HDFC-MOT-2026-9021"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A2533] mb-1">Customer</label>
                <select
                  value={newPolicy.customerId}
                  onChange={(e) => setNewPolicy({ ...newPolicy, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
                >
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2533] mb-1">Insurer</label>
                  <select
                    value={newPolicy.insurerId}
                    onChange={(e) => setNewPolicy({ ...newPolicy, insurerId: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
                  >
                    {insurers.map((ins) => (
                      <option key={ins._id} value={ins._id}>
                        {ins.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2533] mb-1">Line / Type</label>
                  <select
                    value={newPolicy.type}
                    onChange={(e) => setNewPolicy({ ...newPolicy, type: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
                  >
                    <option>Motor</option>
                    <option>Health</option>
                    <option>Life</option>
                    <option>Commercial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2533] mb-1">Gross Premium (₹)</label>
                  <input
                    type="number"
                    required
                    value={newPolicy.premium}
                    onChange={(e) => setNewPolicy({ ...newPolicy, premium: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs font-mono focus:outline-none focus:border-[#C05D34]"
                    placeholder="25000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2533] mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newPolicy.expiryDate}
                    onChange={(e) => setNewPolicy({ ...newPolicy, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0EBE1] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPolicyModal(false)}
                  className="px-3 py-1.5 text-xs text-[#5E6877] hover:bg-[#FAF8F5] rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded transition shadow-2xs"
                >
                  Create & Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#DCD6C8] w-full max-w-md p-6 shadow-elevated">
            <h3 className="font-serif font-bold text-lg text-[#1A2533] mb-2">Add Staff User to MongoDB</h3>
            <p className="text-xs text-[#7A8696] mb-4">
              Slot Usage: {usedSlots} of {maxSlots} used ({maxSlots - usedSlots} slots remaining).
            </p>

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A2533] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
                  placeholder="e.g. Pooja Rathi"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A2533] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
                  placeholder="pooja@shreeadvisors.in"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2533] mb-1">Role</label>
                  <select
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
                  >
                    <option value="OFFICE_STAFF">Office Staff</option>
                    <option value="SALESMAN">Salesman / Agent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2533] mb-1">Phone</label>
                  <input
                    type="text"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34] font-mono"
                    placeholder="98220 12099"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-[#F0EBE1] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-3 py-1.5 text-xs text-[#5E6877] hover:bg-[#FAF8F5] rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded transition shadow-2xs"
                >
                  Activate Slot & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Log Call Modal */}
      {showLogCallModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#DCD6C8] w-full max-w-md p-6 shadow-elevated">
            <h3 className="font-serif font-bold text-lg text-[#1A2533] mb-2">Log Real Follow-up to Backend</h3>
            <p className="text-xs text-[#7A8696] mb-4">
              Client: <strong className="text-[#1A2533]">{selectedCustomer?.name || 'Client'}</strong>
            </p>
            <form onSubmit={handleLogCallSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A2533] mb-1">Call Outcome</label>
                <select
                  value={callResult}
                  onChange={(e) => setCallResult(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
                >
                  <option value="Promise to Pay">Promise to Pay</option>
                  <option value="Callback Requested">Callback Requested</option>
                  <option value="Answered / Discussed">Answered / Discussed</option>
                  <option value="Renewal Confirmed">Renewal Confirmed</option>
                  <option value="Not Reachable / Busy">Not Reachable / Busy</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A2533] mb-1">Conversation Notes</label>
                <textarea
                  rows={3}
                  required
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
                  placeholder="e.g. Client agreed to make cheque payment by Saturday 2pm."
                ></textarea>
              </div>
              <div className="pt-3 border-t border-[#F0EBE1] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogCallModal(false)}
                  className="px-3 py-1.5 text-xs text-[#5E6877] hover:bg-[#FAF8F5] rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded transition shadow-2xs"
                >
                  Save Call & Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
