import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Clock,
  Percent,
  Download,
  Calendar,
  Search,
  Plus,
  PhoneCall,
  UserCheck,
  FileText,
  Check,
  Award,
  Printer,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { workspaceService } from '../../services/workspaceService';
import { socketService } from '../../services/socket';
import { Dropdown } from '../common/Dropdown';
import { Modal } from '../common/Modal';
import { DatePicker } from '../common/DatePicker';

interface SalesmanPanelProps {
  currentSection: string;
}

export const SalesmanPanel: React.FC<SalesmanPanelProps> = ({ currentSection }) => {
  const { user } = useAuth();
  const activeSection = currentSection || 'sm-dashboard';

  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [insurers, setInsurers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [commSummary, setCommSummary] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [renewalTimeline, setRenewalTimeline] = useState<'All' | 'next7' | 'next30'>('All');

  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showRecordSaleModal, setShowRecordSaleModal] = useState(false);
  const [showAddFollowupModal, setShowAddFollowupModal] = useState(false);

  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', city: '' });
  const [newFollowup, setNewFollowup] = useState({
    customerId: '',
    policyId: '',
    channel: 'Phone',
    result: 'Follow-up Scheduled',
    notes: '',
    nextFollowUpDate: '',
  });

  const [newSale, setNewSale] = useState({
    policyNumber: '',
    customerId: '',
    insurerId: '',
    type: 'Motor',
    premium: '',
    sumInsured: '',
    expiryDate: '',
  });

  const loadSalesmanData = async () => {
    try {
      setLoading(true);
      const [pList, cList, cSum, iList, fList] = await Promise.all([
        workspaceService.getPolicies().catch(() => []),
        workspaceService.getCustomers().catch(() => []),
        workspaceService.getCommissionSummary().catch(() => null),
        workspaceService.getInsurers().catch(() => []),
        workspaceService.getFollowups().catch(() => []),
      ]);
      setPolicies(Array.isArray(pList) ? pList : []);
      setCustomers(Array.isArray(cList) ? cList : []);
      setCommSummary(cSum);
      setInsurers(Array.isArray(iList) ? iList : []);
      setTasks(Array.isArray(fList) ? fList : []);
    } catch (err) {
      console.error('Failed to load salesman data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalesmanData();

    const unsubPolicy = socketService.on('POLICY_CREATED', (newP) => {
      setPolicies((prev) => [newP, ...prev]);
    });

    const unsubCustomer = socketService.on('CUSTOMER_CREATED', (newC) => {
      setCustomers((prev) => [newC, ...prev]);
    });

    const unsubCustomerUpdated = socketService.on('CUSTOMER_UPDATED', (updatedC) => {
      setCustomers((prev) => prev.map((c) => (c._id === updatedC._id ? updatedC : c)));
    });

    const unsubFollowup = socketService.on('FOLLOWUP_CREATED', (newF) => {
      setTasks((prev) => [newF, ...prev]);
    });

    const unsubFollowupUpdated = socketService.on('FOLLOWUP_UPDATED', (updatedF) => {
      setTasks((prev) => prev.map((t) => (t._id === updatedF._id ? updatedF : t)));
    });

    return () => {
      unsubPolicy();
      unsubCustomer();
      unsubCustomerUpdated();
      unsubFollowup();
      unsubFollowupUpdated();
    };
  }, []);

  const handleAddLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await workspaceService.createCustomer(newLead);
      setCustomers([created.customer || created, ...customers]);
      setShowAddLeadModal(false);
      setNewLead({ name: '', phone: '', email: '', city: '' });
    } catch (err: any) {
      alert(`Error saving lead: ${err.message}`);
    }
  };

  const handleRecordSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const chosenCustomerId = newSale.customerId || customers[0]?._id;
      const chosenInsurerId = newSale.insurerId || insurers[0]?._id;

      if (!chosenCustomerId) {
        alert('Please select or add a client contact first.');
        return;
      }
      if (!chosenInsurerId) {
        alert('No underwriting insurer available.');
        return;
      }

      const created = await workspaceService.createPolicy({
        policyNumber: newSale.policyNumber,
        customerId: chosenCustomerId,
        insurerId: chosenInsurerId,
        salesmanId: user?.id || '',
        type: newSale.type,
        sumInsured: Number(newSale.sumInsured) || 500000,
        premium: Number(newSale.premium) || 15000,
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: newSale.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      });

      setPolicies([created, ...policies]);
      setShowRecordSaleModal(false);
      setNewSale({ policyNumber: '', customerId: '', insurerId: '', type: 'Motor', premium: '', sumInsured: '', expiryDate: '' });
    } catch (err: any) {
      alert(`Error recording sale: ${err.message}`);
    }
  };

  const handleAddFollowupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const chosenCustId = newFollowup.customerId || customers[0]?._id;
      if (!chosenCustId) {
        alert('Please select a client contact first.');
        return;
      }
      const created = await workspaceService.createFollowup({
        customerId: chosenCustId,
        policyId: newFollowup.policyId || undefined,
        channel: newFollowup.channel,
        result: newFollowup.result,
        notes: newFollowup.notes || 'Routine client follow-up',
        nextFollowUpDate: newFollowup.nextFollowUpDate || undefined,
      });
      setTasks([created, ...tasks]);
      setShowAddFollowupModal(false);
      setNewFollowup({
        customerId: '',
        policyId: '',
        channel: 'Phone',
        result: 'Follow-up Scheduled',
        notes: '',
        nextFollowUpDate: '',
      });
    } catch (err: any) {
      alert(`Error creating reminder: ${err.message}`);
    }
  };

  const handleToggleTask = async (id: string) => {
    try {
      await workspaceService.completeFollowup(id);
      setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, result: 'Renewal Confirmed' } : t)));
    } catch (err: any) {
      alert(`Error updating task: ${err.message}`);
    }
  };

  const totalPremium = (policies || []).reduce((acc, p) => acc + (Number(p?.premium) || 0), 0);
  const commRate = Number(user?.defaultCommissionRate) || 8;
  const totalEarned = commSummary?.salesmanEarnedTotal ?? Math.round(totalPremium * (commRate / 100));
  const totalPaid = commSummary?.salesmanPaidTotal ?? 0;
  const pendingPayout = Math.max(0, totalEarned - totalPaid);

  const filteredRenewals = policies.filter((p) => {
    if (renewalTimeline === 'All') return true;
    const now = new Date().getTime();
    const expiry = new Date(p.expiryDate).getTime();
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    if (renewalTimeline === 'next7') return diffDays >= 0 && diffDays <= 7;
    if (renewalTimeline === 'next30') return diffDays >= 0 && diffDays <= 30;
    return true;
  });

  return (
    <div className="space-y-6 font-sans text-slate-900">

      {/* SECTION 1: MY DASHBOARD */}
      {activeSection === 'sm-dashboard' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Dashboard
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Personal sales volume and earned commissions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddLeadModal(true)}
                className="flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] sm:text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Add Prospect</span>
              </button>
              <button
                onClick={() => setShowRecordSaleModal(true)}
                className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-lg text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
              >
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Record Policy</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500 block">Policies Sourced</span>
                  <div className="flex items-baseline gap-1.5 mt-1 sm:mt-1.5">
                    <span className="text-xl sm:text-2xl font-bold text-slate-900">{policies.length}</span>
                    <span className="text-[11px] sm:text-xs text-slate-400">policies</span>
                  </div>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500 block">Gross Premium</span>
                  <div className="mt-1 sm:mt-1.5">
                    <span className="text-xl sm:text-2xl font-bold text-slate-900">
                      ₹ {totalPremium.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500 block">Commission Earned</span>
                  <div className="mt-1 sm:mt-1.5">
                    <span className="text-xl sm:text-2xl font-bold text-emerald-700">
                      ₹ {totalEarned.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500 block">Pending Payout</span>
                  <div className="mt-1 sm:mt-1.5">
                    <span className="text-xl sm:text-2xl font-bold text-[#C05D34]">
                      ₹ {pendingPayout.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-3.5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-xs text-slate-800">Recent Sourced Policies</h3>
              <span className="text-xs text-slate-500">{policies.length} Total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/70">
                    <th className="py-2.5 px-4">Policy No & Client</th>
                    <th className="py-2.5 px-4">Insurer</th>
                    <th className="py-2.5 px-4">Premium</th>
                    <th className="py-2.5 px-4">Commission</th>
                    <th className="py-2.5 px-4 text-right">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {policies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No policies written yet. Click "Record Policy" to start logging.
                      </td>
                    </tr>
                  ) : (
                    policies.slice(0, 5).map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{p.policyNumber}</div>
                          <div className="text-[11px] text-slate-500">{p.customerId?.name || 'Client'}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{p.insurerId?.name || 'Insurer'}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          ₹ {Number(p.premium).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-semibold text-emerald-700">
                          ₹ {Math.round(Number(p.premium) * (commRate / 100)).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          {new Date(p.expiryDate).toLocaleDateString('en-GB')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: MY CUSTOMERS */}
      {activeSection === 'sm-customers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                My Customers
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Active customer contacts and prospect leads ({customers.length} total).
              </p>
            </div>

            <button
              onClick={() => setShowAddLeadModal(true)}
              className="px-3.5 py-1.5 bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between">
              <div className="relative w-64 sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search my clients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <span className="text-xs text-slate-500">{customers.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/70">
                    <th className="py-2.5 px-4">Client Name</th>
                    <th className="py-2.5 px-4">Phone</th>
                    <th className="py-2.5 px-4">Location</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                        No clients registered yet.
                      </td>
                    </tr>
                  ) : (
                    customers
                      .filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search))
                      .map((c) => (
                        <tr key={c._id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-semibold text-slate-900">{c.name}</td>
                          <td className="py-3 px-4 text-slate-600">{c.phone}</td>
                          <td className="py-3 px-4 text-slate-600">{c.city || '—'}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => alert(`Connecting call: ${c.name} (${c.phone})`)}
                              className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition cursor-pointer"
                            >
                              Call
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: MY POLICIES */}
      {activeSection === 'sm-policies' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                My Policies
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Active policies sourced by you ({policies.length} records).
              </p>
            </div>

            <button
              onClick={() => setShowRecordSaleModal(true)}
              className="px-3.5 py-1.5 bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Sale</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/70">
                    <th className="py-2.5 px-4">Policy No & Client</th>
                    <th className="py-2.5 px-4">Insurer</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Premium</th>
                    <th className="py-2.5 px-4">Expiry Date</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {policies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No policies recorded in your book.
                      </td>
                    </tr>
                  ) : (
                    policies.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{p.policyNumber}</div>
                          <div className="text-[11px] text-slate-500">{p.customerId?.name || 'Client'}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{p.insurerId?.name || 'Insurer'}</td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                            {p.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          ₹ {Number(p.premium).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(p.expiryDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            p.status === 'Overdue' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: MY RENEWALS */}
      {activeSection === 'sm-renewals' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Renewals
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Policies due for renewal in your portfolio.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              {(['All', 'next7', 'next30'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRenewalTimeline(filter)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                    renewalTimeline === filter ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter === 'All' ? `All (${policies.length})` : filter === 'next7' ? 'Next 7 Days' : 'Next 30 Days'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/70">
                    <th className="py-2.5 px-4">Client & Phone</th>
                    <th className="py-2.5 px-4">Policy No</th>
                    <th className="py-2.5 px-4">Insurer</th>
                    <th className="py-2.5 px-4">Expiry Date</th>
                    <th className="py-2.5 px-4">Premium</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRenewals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No upcoming expirations matching selected timeline.
                      </td>
                    </tr>
                  ) : (
                    filteredRenewals.map((p) => {
                      const now = new Date().getTime();
                      const expiry = new Date(p.expiryDate).getTime();
                      const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                      const isOverdue = daysLeft < 0;

                      return (
                        <tr key={p._id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{p.customerId?.name || 'Client'}</div>
                            <div className="text-[11px] text-slate-500">{p.customerId?.phone || 'No phone'}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-800 font-medium">{p.policyNumber}</td>
                          <td className="py-3 px-4 text-slate-600">{p.insurerId?.name || 'Insurer'}</td>
                          <td className="py-3 px-4 text-slate-700">
                            {new Date(p.expiryDate).toLocaleDateString('en-GB')}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            ₹{Number(p.premium).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                isOverdue
                                  ? 'bg-rose-50 text-rose-700'
                                  : daysLeft <= 7
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {isOverdue ? `Expired (${Math.abs(daysLeft)}d)` : `In ${daysLeft} days`}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setNewFollowup({
                                    customerId: p.customerId?._id || '',
                                    policyId: p._id,
                                    channel: 'Phone',
                                    result: 'Follow-up Scheduled',
                                    notes: `Renewal reminder for policy ${p.policyNumber}`,
                                    nextFollowUpDate: new Date().toISOString().split('T')[0],
                                  });
                                  setShowAddFollowupModal(true);
                                }}
                                className="px-2 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition cursor-pointer"
                              >
                                Log Call
                              </button>
                              {p.customerId?.phone && (
                                <a
                                  href={`https://wa.me/${p.customerId.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(
                                    p.customerId.name || 'Sir/Madam'
                                  )},%20your%20insurance%20policy%20${encodeURIComponent(
                                    p.policyNumber
                                  )}%20is%20due%20for%20renewal.`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded transition"
                                >
                                  WhatsApp
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: MY FOLLOW-UPS */}
      {activeSection === 'sm-followups' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Follow-ups
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Client callbacks and prospective customer reminders.
              </p>
            </div>

            <button
              onClick={() => setShowAddFollowupModal(true)}
              className="px-3.5 py-1.5 bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Call</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/70">
                    <th className="py-2.5 px-4">Client & Phone</th>
                    <th className="py-2.5 px-4">Policy No</th>
                    <th className="py-2.5 px-4">Notes</th>
                    <th className="py-2.5 px-4">Channel</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No follow-up calls logged yet.
                      </td>
                    </tr>
                  ) : (
                    tasks.map((t) => {
                      const isDone = t.result === 'Renewal Confirmed';
                      return (
                        <tr key={t._id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{t.customerId?.name || 'Customer'}</div>
                            <div className="text-[11px] text-slate-500">{t.customerId?.phone || 'No phone'}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-800 font-medium">
                            {t.policyId?.policyNumber || 'Lead Follow-up'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs">{t.notes}</td>
                          <td className="py-3 px-4 text-slate-500">{t.channel || 'Phone'}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isDone ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {t.result}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!isDone ? (
                              <button
                                onClick={() => handleToggleTask(t._id)}
                                className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition cursor-pointer"
                              >
                                Resolve
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">Resolved</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: MY COMMISSION */}
      {activeSection === 'sm-commissions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Commission Statement
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Earned commissions and disbursement ledger (Agent rate: {commRate}%).
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
              <div className="p-4 bg-slate-50/70 rounded-lg">
                <span className="text-xs font-medium text-slate-500 block">Total Earned</span>
                <span className="font-bold text-2xl text-slate-900 mt-1 block">
                  ₹ {totalEarned.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-4 bg-slate-50/70 rounded-lg">
                <span className="text-xs font-medium text-slate-500 block">Paid Out</span>
                <span className="font-bold text-2xl text-emerald-700 mt-1 block">
                  ₹ {totalPaid.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-4 bg-slate-50/70 rounded-lg">
                <span className="text-xs font-medium text-slate-500 block">Pending Balance</span>
                <span className="font-bold text-2xl text-[#C05D34] mt-1 block">
                  ₹ {pendingPayout.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold text-xs text-slate-800 mb-3">Policy-wise Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/70">
                      <th className="py-2.5 px-3">Policy No</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Gross Premium</th>
                      <th className="py-2.5 px-3">Agent Rate</th>
                      <th className="py-2.5 px-3 text-right">Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {policies.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          No commission records yet.
                        </td>
                      </tr>
                    ) : (
                      policies.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{p.policyNumber}</td>
                          <td className="py-2.5 px-3 text-slate-700">{p.customerId?.name || 'Client'}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            ₹{Number(p.premium).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{commRate}%</td>
                          <td className="py-2.5 px-3 font-semibold text-emerald-700 text-right">
                            ₹{Math.round(Number(p.premium) * (commRate / 100)).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: MY PROFILE & DOCS */}
      {activeSection === 'sm-profile' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Profile & Credentials
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized field agent profile, credentials, and broker guidelines.
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Badge</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-base border border-slate-200">
                  {(user?.name || 'AG')
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{user?.name || 'Agent Partner'}</h3>
                  <div className="text-xs text-[#C05D34] font-medium">Authorized Field Agent</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Agent Code</span>
                  <span className="font-semibold text-slate-900">{user?.id ? `AGT-${user.id.slice(-6).toUpperCase()}` : 'AGT-2026-01'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email Address</span>
                  <span className="font-medium text-slate-900">{user?.email || 'agent@prosurance.in'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Commission Tier</span>
                  <span className="font-semibold text-emerald-700">{commRate}% Gross Premium</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payout Cycle</span>
                  <span className="font-medium text-slate-900">Monthly on 1st</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                    Active & Verified
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Official Credentials & Guidelines</h3>
              <p className="text-xs text-slate-500">
                Authorized documentation issued by Shree Insurance Advisors.
              </p>

              <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Agent Appointment Letter</div>
                      <div className="text-[10px] text-slate-500">PDF · Signed & Stamped</div>
                    </div>
                  </div>
                  <button
                    onClick={() => alert('Downloading Agent Appointment Certificate...')}
                    className="px-2.5 py-1 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>

                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Code of Conduct & Commission Manual</div>
                      <div className="text-[10px] text-slate-500">PDF · IRDAI Compliance</div>
                    </div>
                  </div>
                  <button
                    onClick={() => alert('Downloading Code of Conduct manual...')}
                    className="px-2.5 py-1 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>

                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">POSP Certification Status</div>
                      <div className="text-[10px] text-slate-500">Valid through Dec 2028</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Add Lead */}
      <Modal
        isOpen={showAddLeadModal}
        onClose={() => setShowAddLeadModal(false)}
        title="Add Prospect Lead"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddLeadSubmit} className="space-y-2.5 sm:space-y-3">
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-slate-800 mb-0.5 sm:mb-1">Prospect Name</label>
            <input
              type="text"
              required
              value={newLead.name}
              onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-slate-400"
              placeholder="e.g. Rahul Patil"
            />
          </div>
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-slate-800 mb-0.5 sm:mb-1">Phone Number</label>
            <input
              type="text"
              required
              value={newLead.phone}
              onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-slate-400"
              placeholder="98220 44331"
            />
          </div>
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-slate-800 mb-0.5 sm:mb-1">City / Location</label>
            <input
              type="text"
              value={newLead.city}
              onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-slate-400"
              placeholder="Pune"
            />
          </div>
          <div className="pt-2.5 sm:pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddLeadModal(false)}
              className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs text-slate-600 hover:bg-slate-50 rounded-lg font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-lg transition shadow-2xs cursor-pointer"
            >
              Save Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Record Sale */}
      <Modal
        isOpen={showRecordSaleModal}
        onClose={() => setShowRecordSaleModal(false)}
        title="Record Policy"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordSaleSubmit} className="space-y-2.5 sm:space-y-3">
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-slate-800 mb-0.5 sm:mb-1">Policy Number</label>
            <input
              type="text"
              required
              value={newSale.policyNumber}
              onChange={(e) => setNewSale({ ...newSale, policyNumber: e.target.value })}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-slate-400"
              placeholder="e.g. HDFC-MOT-2026-0091"
            />
          </div>
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-slate-800 mb-0.5 sm:mb-1">Gross Premium (₹)</label>
            <input
              type="number"
              required
              value={newSale.premium}
              onChange={(e) => setNewSale({ ...newSale, premium: e.target.value })}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-slate-400"
              placeholder="18000"
            />
          </div>
          <Dropdown
            label="Client Customer"
            value={newSale.customerId || (customers[0]?._id || '')}
            onChange={(val) => setNewSale({ ...newSale, customerId: val })}
            options={customers.map((c) => ({ value: c._id, label: `${c.name} (${c.phone})` }))}
          />
          <Dropdown
            label="Underwriting Insurer"
            value={newSale.insurerId || (insurers[0]?._id || '')}
            onChange={(val) => setNewSale({ ...newSale, insurerId: val })}
            options={insurers.map((ins) => ({ value: ins._id, label: `${ins.name} (${ins.code || ''})` }))}
          />
          <Dropdown
            label="Insurance Type"
            value={newSale.type}
            onChange={(val) => setNewSale({ ...newSale, type: val })}
            options={['Motor', 'Health', 'Life', 'Commercial']}
          />
          <div className="pt-2.5 sm:pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowRecordSaleModal(false)}
              className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs text-slate-600 hover:bg-slate-50 rounded-lg font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-lg transition shadow-2xs cursor-pointer"
            >
              Submit Policy
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Log Follow-up Call */}
      <Modal
        isOpen={showAddFollowupModal}
        onClose={() => setShowAddFollowupModal(false)}
        title="Log Follow-up Call"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddFollowupSubmit} className="space-y-2.5 sm:space-y-3">
          <Dropdown
            label="Customer / Lead"
            placeholder="Select Customer..."
            value={newFollowup.customerId}
            onChange={(val) => setNewFollowup({ ...newFollowup, customerId: val })}
            options={customers.map((c) => ({
              value: c._id,
              label: `${c.name} (${c.phone || 'No phone'})`,
            }))}
          />

          <Dropdown
            label="Related Policy (Optional)"
            placeholder="No specific policy / General inquiry"
            value={newFollowup.policyId}
            onChange={(val) => setNewFollowup({ ...newFollowup, policyId: val })}
            options={[
              { value: '', label: 'No specific policy / General inquiry' },
              ...policies.map((p) => ({
                value: p._id,
                label: `${p.policyNumber} - ${p.customerId?.name || 'Client'} (₹${p.premium})`,
              })),
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <Dropdown
              label="Channel"
              value={newFollowup.channel}
              onChange={(val) => setNewFollowup({ ...newFollowup, channel: val })}
              options={['Phone', 'WhatsApp', 'Email', 'In-Person']}
            />

            <Dropdown
              label="Call Result"
              value={newFollowup.result}
              onChange={(val) => setNewFollowup({ ...newFollowup, result: val })}
              options={[
                'Follow-up Scheduled',
                'Renewal Confirmed',
                'Customer Busy / Callback Requested',
                'Lost to Competitor',
              ]}
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-slate-800 mb-0.5 sm:mb-1">Notes</label>
            <textarea
              required
              rows={2}
              value={newFollowup.notes}
              onChange={(e) => setNewFollowup({ ...newFollowup, notes: e.target.value })}
              placeholder="Summary of conversation and next steps"
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-slate-400"
            />
          </div>

          <DatePicker
            label="Next Follow-up Date"
            value={newFollowup.nextFollowUpDate}
            onChange={(val) => setNewFollowup({ ...newFollowup, nextFollowUpDate: val })}
            placeholder="Select follow-up date"
          />

          <div className="pt-2.5 sm:pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddFollowupModal(false)}
              className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs text-slate-600 hover:bg-slate-50 rounded-lg font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-lg transition shadow-2xs cursor-pointer"
            >
              Save Follow-up
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
