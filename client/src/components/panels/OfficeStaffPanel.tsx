import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  PhoneCall,
  Clock,
  Plus,
  Upload,
  Calendar,
  Check,
  Search,
  Phone,
  FileText,
  Download,
  Printer,
  CalendarClock,
  CreditCard,
} from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import { socketService } from '../../services/socket';
import { Modal } from '../common/Modal';
import { Dropdown } from '../common/Dropdown';
import { DatePicker } from '../common/DatePicker';

interface OfficeStaffPanelProps {
  currentSection: string;
}

export const OfficeStaffPanel: React.FC<OfficeStaffPanelProps> = ({ currentSection }) => {
  const activeSection = currentSection || 'os-today';

  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Direct' | 'Broker'>('All');
  const [renewalTimeline, setRenewalTimeline] = useState<'All' | 'next7' | 'next30'>('All');

  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', email: '', city: '' });

  const [showAddFollowupModal, setShowAddFollowupModal] = useState(false);
  const [newFollowup, setNewFollowup] = useState({
    customerId: '',
    policyId: '',
    channel: 'Phone',
    result: 'Follow-up Scheduled',
    notes: '',
    nextFollowUpDate: '',
  });

  const docInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ name: string; size: string; date: string; type: string }>>([
    { name: 'Signed_Proposal_ICICI_2026.pdf', size: '284 KB', date: 'Today, 11:45 AM', type: 'Proposal Form' },
    { name: 'Vehicle_RC_MH12_DE4490.pdf', size: '190 KB', date: 'Today, 09:20 AM', type: 'RC Copy' },
  ]);

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newDoc = {
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      date: 'Just now',
      type: file.name.toLowerCase().includes('rc') ? 'RC Copy' : 'Policy Schedule',
    };
    setUploadedDocs([newDoc, ...uploadedDocs]);
    alert(`File "${file.name}" uploaded successfully!`);
    e.target.value = '';
  };

  const loadStaffData = async () => {
    try {
      setLoading(true);
      const [fList, cList, pList] = await Promise.all([
        workspaceService.getFollowups().catch(() => []),
        workspaceService.getCustomers().catch(() => []),
        workspaceService.getPolicies().catch(() => []),
      ]);
      setTasks(Array.isArray(fList) ? fList : []);
      setCustomers(Array.isArray(cList) ? cList : []);
      setPolicies(Array.isArray(pList) ? pList : []);
    } catch (err) {
      console.error('Failed to load staff queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();

    const unsubFollowup = socketService.on('FOLLOWUP_CREATED', (newF) => {
      setTasks((prev) => [newF, ...prev]);
    });

    const unsubFollowupUpdated = socketService.on('FOLLOWUP_UPDATED', (updatedF) => {
      setTasks((prev) => prev.map((t) => (t._id === updatedF._id ? updatedF : t)));
    });

    const unsubCustomer = socketService.on('CUSTOMER_CREATED', (newC) => {
      setCustomers((prev) => [newC, ...prev]);
    });

    const unsubCustomerUpdated = socketService.on('CUSTOMER_UPDATED', (updatedC) => {
      setCustomers((prev) => prev.map((c) => (c._id === updatedC._id ? updatedC : c)));
    });

    const unsubPolicy = socketService.on('POLICY_CREATED', (newP) => {
      setPolicies((prev) => [newP, ...prev]);
    });

    return () => {
      unsubFollowup();
      unsubFollowupUpdated();
      unsubCustomer();
      unsubCustomerUpdated();
      unsubPolicy();
    };
  }, []);

  const handleToggleTask = async (id: string, currentStatus: string) => {
    try {
      await workspaceService.completeFollowup(id);
      setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, result: 'Renewal Confirmed' } : t)));
    } catch (err: any) {
      alert(`Error updating task: ${err.message}`);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await workspaceService.createCustomer(newCust);
      setCustomers([created.customer || created, ...customers]);
      setShowAddCustomerModal(false);
      setNewCust({ name: '', phone: '', email: '', city: '' });
    } catch (err: any) {
      alert(`Error creating customer: ${err.message}`);
    }
  };

  const handleAddFollowupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const chosenCustId = newFollowup.customerId || customers[0]?._id;
      if (!chosenCustId) {
        alert('Please select a customer first.');
        return;
      }
      const created = await workspaceService.createFollowup({
        customerId: chosenCustId,
        policyId: newFollowup.policyId || undefined,
        channel: newFollowup.channel,
        result: newFollowup.result,
        notes: newFollowup.notes || 'Routine follow-up call logged',
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
      alert(`Error creating follow-up: ${err.message}`);
    }
  };

  const handleExportOperationalCSV = () => {
    if (policies.length === 0) {
      alert('No policy records to export.');
      return;
    }
    const headers = ['Policy Number', 'Client Name', 'Phone', 'Insurer', 'Policy Type', 'Gross Premium', 'Start Date', 'Expiry Date', 'Status'];
    const rows = policies.map((p) => [
      p.policyNumber || '',
      `"${p.customerId?.name || 'Client'}"`,
      p.customerId?.phone || '',
      `"${p.insurerId?.name || 'Insurer'}"`,
      p.type || '',
      p.premium || 0,
      p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
      p.expiryDate ? new Date(p.expiryDate).toISOString().split('T')[0] : '',
      p.status || 'Active',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Policy_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const dueTodayCount = policies.filter((p) => p.status === 'Due Soon' || p.status === 'Due Today').length;
  const totalPremiumSum = policies.reduce((acc, p) => acc + (Number(p.premium) || 0), 0);

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

      {/* SECTION 1: TODAY'S WORK */}
      {activeSection === 'os-today' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Today's Queue
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Daily policy renewals and customer callbacks.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500 block">Due Soon</span>
                  <div className="flex items-baseline gap-1.5 mt-1 sm:mt-1.5">
                    <span className="text-xl sm:text-2xl font-bold text-slate-900">{dueTodayCount}</span>
                    <span className="text-[11px] sm:text-xs text-slate-400">policies</span>
                  </div>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 border border-slate-100 text-[#C05D34] flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500 block">Pending Calls</span>
                  <div className="flex items-baseline gap-1.5 mt-1 sm:mt-1.5">
                    <span className="text-xl sm:text-2xl font-bold text-slate-900">
                      {tasks.filter((t) => t.result !== 'Renewal Confirmed').length}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-400">callbacks</span>
                  </div>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500 block">Active Clients</span>
                  <div className="flex items-baseline gap-1.5 mt-1 sm:mt-1.5">
                    <span className="text-xl sm:text-2xl font-bold text-slate-900">{customers.length}</span>
                    <span className="text-[11px] sm:text-xs text-slate-400">records</span>
                  </div>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Operational Checklist */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-sm text-slate-900">Scheduled Call Tasks</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {tasks.filter((t) => t.result === 'Renewal Confirmed').length} of {tasks.length} resolved
                </span>
                <button
                  onClick={() => setShowAddFollowupModal(true)}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Log Call</span>
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {tasks.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No pending follow-ups in today's queue.
                </div>
              ) : (
                tasks.map((task) => {
                  const isConfirmed = task.result === 'Renewal Confirmed';
                  return (
                    <div
                      key={task._id}
                      onClick={() => handleToggleTask(task._id, task.result)}
                      className={`p-3 rounded-lg border transition flex items-center justify-between cursor-pointer ${
                        isConfirmed
                          ? 'bg-slate-50/50 border-slate-200/50 text-slate-400 line-through'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4.5 h-4.5 rounded flex items-center justify-center border transition ${
                            isConfirmed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isConfirmed && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <span className="text-xs font-medium">{task.notes}</span>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 no-underline">
                            <span className="font-medium text-slate-700">{task.customerId?.name || 'Client'}</span>
                            <span>·</span>
                            <span>{task.customerId?.phone || 'No phone'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {task.result}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: CUSTOMERS */}
      {activeSection === 'os-customers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Customers
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Client directory and contact profiles ({customers.length} total).
              </p>
            </div>

            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="px-3.5 py-2 bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Customer</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between">
              <div className="relative w-64 sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
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
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Phone</th>
                    <th className="py-2.5 px-4">Location</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                        No customer accounts found.
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

      {/* SECTION 3: POLICIES */}
      {activeSection === 'os-policies' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Policies
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Active policy schedules and records ({policies.length} total).
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            {/* Mobile Cards View (no horizontal scroll) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {policies.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs px-4">
                  No policy records found.
                </div>
              ) : (
                policies.map((p) => (
                  <div key={p._id} className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-slate-900 font-mono truncate">{p.policyNumber}</div>
                        <div className="text-[11px] text-slate-500 truncate">{p.customerId?.name || 'Client'}</div>
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                        p.status === 'Overdue' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-100 text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-medium block">Insurer / Type</span>
                        <span className="font-medium text-slate-800 truncate block">{p.insurerId?.name || 'Insurer'} • {p.type}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-medium block">Premium</span>
                        <span className="font-semibold text-slate-900">₹{Number(p.premium).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-medium block">Expiry</span>
                        <span className="font-medium text-slate-700">{new Date(p.expiryDate).toLocaleDateString('en-GB')}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
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
                        No policy records found.
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
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
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

      {/* SECTION 4: PAYMENTS & RECEIPTS */}
      {activeSection === 'os-payments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Payments & Receipts
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Premium payment status and client receipts.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              {(['All', 'Direct', 'Broker'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPaymentFilter(filter)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                    paymentFilter === filter ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter === 'All' ? 'All Receipts' : filter === 'Direct' ? 'Direct to Insurer' : 'Broker Collected'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500 block">Total Volume</span>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                ₹{totalPremiumSum.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500 block">Verified Active</span>
              <div className="mt-1 text-2xl font-bold text-emerald-700">
                {policies.filter((p) => p.status === 'Active').length} Policies
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500 block">Due Soon</span>
              <div className="mt-1 text-2xl font-bold text-[#C05D34]">
                {dueTodayCount} Policies
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/70">
                    <th className="py-2.5 px-4">Policy No</th>
                    <th className="py-2.5 px-4">Client</th>
                    <th className="py-2.5 px-4">Insurer</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4">Channel</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {policies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No payment records yet.
                      </td>
                    </tr>
                  ) : (
                    policies.map((p, idx) => (
                      <tr key={p._id || idx} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900">{p.policyNumber}</td>
                        <td className="py-3 px-4 text-slate-800">{p.customerId?.name || 'Client'}</td>
                        <td className="py-3 px-4 text-slate-600">{p.insurerId?.name || 'Insurer'}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          ₹{(Number(p.premium) || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {idx % 2 === 0 ? 'Direct to Insurer' : 'Broker Collected'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                            Verified
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => alert(`Payment receipt for Policy ${p.policyNumber} verified.`)}
                            className="px-2.5 py-1 text-xs font-medium bg-slate-100 border border-slate-200 rounded text-slate-800 hover:bg-slate-200 cursor-pointer"
                          >
                            Receipt
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

      {/* SECTION 5: RENEWALS & DUE DATES */}
      {activeSection === 'os-renewals' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Renewals & Expiries
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Upcoming policy expirations and client retention.
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
                    <th className="py-2.5 px-4">Client & Contact</th>
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
                              {isOverdue ? `Expired (${Math.abs(daysLeft)}d ago)` : `Due in ${daysLeft}d`}
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
                                  href={`https://wa.me/${p.customerId.phone.replace(/[^0-9]/g, '')}?text=Dear%20${encodeURIComponent(
                                    p.customerId.name || 'Customer'
                                  )},%20your%20policy%20${encodeURIComponent(
                                    p.policyNumber
                                  )}%20is%20expiring%20soon.%20Please%20contact%20us%20for%20renewal.`}
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

      {/* SECTION 6: FOLLOW-UPS */}
      {activeSection === 'os-followups' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Follow-ups
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Client callbacks and communication records.
              </p>
            </div>

            <button
              onClick={() => setShowAddFollowupModal(true)}
              className="px-3.5 py-2 bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
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
                            {t.policyId?.policyNumber || 'General Inquiry'}
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
                                onClick={() => handleToggleTask(t._id, t.result)}
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

      {/* SECTION 7: DOCUMENTS & KYC */}
      {activeSection === 'os-documents' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Documents & KYC
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified customer schedules and proposal documents.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-6 text-center shadow-2xs">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-slate-900">Upload Policy Schedule / RC Copy</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Select verified customer document (PDF, JPG, PNG) to attach to profile.
            </p>
            <input
              type="file"
              ref={docInputRef}
              accept=".pdf, .png, .jpg, .jpeg"
              className="hidden"
              onChange={handleDocUpload}
            />
            <button
              onClick={() => docInputRef.current?.click()}
              className="mt-3 px-4 py-1.5 bg-[#C05D34] hover:bg-[#A94F2B] text-white text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
            >
              Browse & Upload
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-3.5 border-b border-slate-100 flex justify-between items-center">
              <h4 className="font-semibold text-xs text-slate-800">Verified Files ({uploadedDocs.length})</h4>
            </div>
            <div className="divide-y divide-slate-100">
              {uploadedDocs.map((doc, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50/70 transition text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{doc.name}</div>
                      <div className="text-[10px] text-slate-500">{doc.type} · {doc.size}</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 8: REPORTS & REGISTER */}
      {activeSection === 'os-reports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Operational Register
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Policy issuance register and daily operational records.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportOperationalCSV}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500 block">Registered Policies</span>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {policies.length}
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500 block">Total Gross Premium</span>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                ₹{totalPremiumSum.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500 block">Active Clients</span>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {customers.length}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/70">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Policy No</th>
                    <th className="py-2.5 px-4">Client</th>
                    <th className="py-2.5 px-4">Contact</th>
                    <th className="py-2.5 px-4">Insurer</th>
                    <th className="py-2.5 px-4">Class</th>
                    <th className="py-2.5 px-4">Gross Premium</th>
                    <th className="py-2.5 px-4 text-right">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {policies.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        No policy records registered in the workspace.
                      </td>
                    </tr>
                  ) : (
                    policies.map((p, idx) => (
                      <tr key={p._id || idx} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{p.policyNumber}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{p.customerId?.name || 'Client'}</td>
                        <td className="py-3 px-4 text-slate-500">{p.customerId?.phone || '—'}</td>
                        <td className="py-3 px-4 text-slate-600">{p.insurerId?.name || 'Insurer'}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            {p.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          ₹{Number(p.premium).toLocaleString('en-IN')}
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

      {/* Modal 1: Add Customer */}
      <Modal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        title="Add Customer"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddCustomer} className="space-y-2.5 sm:space-y-3">
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-slate-800 mb-0.5 sm:mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newCust.name}
              onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-slate-400"
              placeholder="e.g. Ramesh Patil"
            />
          </div>
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-slate-800 mb-0.5 sm:mb-1">Mobile Number</label>
            <input
              type="text"
              required
              value={newCust.phone}
              onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-slate-400"
              placeholder="98220 11223"
            />
          </div>
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-slate-800 mb-0.5 sm:mb-1">City / Location</label>
            <input
              type="text"
              value={newCust.city}
              onChange={(e) => setNewCust({ ...newCust, city: e.target.value })}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-slate-400"
              placeholder="Pune"
            />
          </div>
          <div className="pt-2.5 sm:pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddCustomerModal(false)}
              className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs text-slate-600 hover:bg-slate-50 rounded-lg font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-lg transition shadow-2xs cursor-pointer"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Log Follow-up Call */}
      <Modal
        isOpen={showAddFollowupModal}
        onClose={() => setShowAddFollowupModal(false)}
        title="Log Follow-up Call"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddFollowupSubmit} className="space-y-2.5 sm:space-y-3">
          <Dropdown
            label="Customer"
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
