import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Upload,
  Calendar,
  Check,
  Search,
  Phone,
  ShieldCheck,
  FileText,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import { socketService } from '../../services/socket';

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
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', email: '', city: '' });

  const loadStaffData = async () => {
    try {
      setLoading(true);
      const [fList, cList, pList] = await Promise.all([
        workspaceService.getFollowups().catch(() => []),
        workspaceService.getCustomers().catch(() => []),
        workspaceService.getPolicies().catch(() => []),
      ]);
      setTasks(fList);
      setCustomers(cList);
      setPolicies(pList);
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

    const unsubCustomer = socketService.on('CUSTOMER_CREATED', (newC) => {
      setCustomers((prev) => [newC, ...prev]);
    });

    const unsubPolicy = socketService.on('POLICY_CREATED', (newP) => {
      setPolicies((prev) => [newP, ...prev]);
    });

    return () => {
      unsubFollowup();
      unsubCustomer();
      unsubPolicy();
    };
  }, []);

  const handleToggleTask = async (id: string, currentStatus: string) => {
    try {
      await workspaceService.completeFollowup(id);
      setTasks(tasks.map((t) => (t._id === id ? { ...t, result: 'Renewal Confirmed' } : t)));
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

  const dueTodayCount = policies.filter((p) => p.status === 'Due Soon' || p.status === 'Due Today').length;

  return (
    <div className="space-y-6 font-sans text-[#1A2533]">

      {/* ========================================================= */}
      {/* SECTION 1: TODAY'S WORK & QUEUE                           */}
      {/* ========================================================= */}
      {activeSection === 'os-today' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                OFFICE STAFF / Operational queue
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                Today's Work & Queue
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1 font-sans">
                Real-time operational queue from database: {tasks.length} follow-up calls and {policies.length} customer records.
              </p>
            </div>
          </div>

          {/* 3 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#E7E2D6] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#1A2533] uppercase tracking-wider block font-mono">
                    DUE SOON
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-serif font-bold text-[#1A2533]">{dueTodayCount}</span>
                    <span className="text-xs text-[#7E8B9C]">policies</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-md bg-[#FAF5EE] text-[#C05D34] flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#F2EDE2] text-xs text-[#C05D34] font-medium">
                Live from database
              </div>
            </div>

            <div className="bg-white border border-[#E7E2D6] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#1A2533] uppercase tracking-wider block font-mono">
                    CALLS TO MAKE
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-serif font-bold text-[#1A2533]">
                      {tasks.filter((t) => t.result !== 'Renewal Confirmed').length}
                    </span>
                    <span className="text-xs text-[#7E8B9C]">pending</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                  <PhoneCall className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#F2EDE2] text-xs text-teal font-medium">
                Scheduled client calls
              </div>
            </div>

            <div className="bg-white border border-[#E7E2D6] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#C05D34] uppercase tracking-wider block font-mono">
                    VERIFIED CLIENTS
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-serif font-bold text-[#C05D34]">{customers.length}</span>
                    <span className="text-xs text-[#7E8B9C]">accounts</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-md bg-[#FAF5EE] text-[#C05D34] flex items-center justify-center">
                  <FolderOpen className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#F2EDE2] text-xs text-[#C05D34] font-medium">
                Stored in MongoDB
              </div>
            </div>
          </div>

          {/* Operational Checklist */}
          <div className="bg-white border border-[#E7E2D6] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <h3 className="font-serif font-bold text-base text-[#1A2533]">Today's Operational Call Checklist</h3>
              <span className="text-xs text-[#7A8696] font-mono">
                {tasks.filter((t) => t.result === 'Renewal Confirmed').length} of {tasks.length} resolved
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {tasks.map((task) => {
                const isConfirmed = task.result === 'Renewal Confirmed';
                return (
                  <div
                    key={task._id}
                    onClick={() => handleToggleTask(task._id, task.result)}
                    className={`p-3 rounded-lg border transition flex items-center justify-between cursor-pointer ${
                      isConfirmed
                        ? 'bg-[#FAF8F5]/50 border-[#F0EBE1] text-[#8E9AAB] line-through'
                        : 'bg-white border-[#E7E2D6] hover:border-[#C05D34] text-[#1A2533]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border transition ${
                          isConfirmed ? 'bg-[#1E7E34] border-[#1E7E34] text-white' : 'border-[#D5CEBF] hover:border-[#C05D34]'
                        }`}
                      >
                        {isConfirmed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <span className="text-xs font-medium">{task.notes}</span>
                        <div className="text-[11px] text-[#7A8696] flex items-center gap-2 mt-0.5 no-underline">
                          <span className="font-semibold text-[#1A2533]">{task.customerId?.name}</span>
                          <span>·</span>
                          <span className="font-mono">{task.customerId?.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-[#FAF5EE] text-[#C05D34]">
                        {task.result}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: CUSTOMERS (STAFF VIEW)                         */}
      {/* ========================================================= */}
      {activeSection === 'os-customers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                OFFICE STAFF / Client Directory
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                Customer Contacts & Support
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1 font-sans">
                Real customer contacts from database: {customers.length} clients.
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
              <div className="relative w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8E9AAB]" />
                <input
                  type="text"
                  placeholder="Search live clients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#D5CEBF] rounded text-[#1A2533] focus:outline-none focus:border-[#C05D34]"
                />
              </div>

              <span className="text-xs text-[#7A8696] font-mono">{customers.length} total records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE5DC] text-[#8E9AAB] font-mono text-[10px] uppercase tracking-wider bg-[#FAF8F5]">
                    <th className="py-3 px-4 font-bold">CUSTOMER NAME</th>
                    <th className="py-3 px-4 font-bold">CONTACT NUMBER</th>
                    <th className="py-3 px-4 font-bold">LOCATION</th>
                    <th className="py-3 px-4 font-bold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {customers
                    .filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search))
                    .map((c) => (
                      <tr key={c._id} className="hover:bg-[#FAF8F5]/80 transition">
                        <td className="py-3.5 px-4 font-semibold text-[#1A2533]">
                          {c.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-[#1A2533]">
                          {c.phone}
                        </td>
                        <td className="py-3.5 px-4 text-[#1A2533]">
                          {c.city || 'Pune'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => alert(`Calling client: ${c.name} (${c.phone})`)}
                            className="px-2.5 py-1 text-xs font-semibold bg-[#FAF5EE] hover:bg-[#F2ECE1] text-[#C05D34] rounded transition"
                          >
                            Call Client
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
      {/* SECTION 3: POLICIES (STAFF VIEW)                          */}
      {/* ========================================================= */}
      {activeSection === 'os-policies' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                OFFICE STAFF / Policy Records
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                Policy Renewals & Payment Logging
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1 font-sans">
                Real policies in database: {policies.length} records.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E7E2D6] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE5DC] text-[#8E9AAB] font-mono text-[10px] uppercase tracking-wider bg-[#FAF8F5]">
                    <th className="py-3 px-4 font-bold">POLICY NO & CLIENT</th>
                    <th className="py-3 px-4 font-bold">INSURER</th>
                    <th className="py-3 px-4 font-bold">TYPE</th>
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
                        <div className="text-[11px] text-[#7A8696]">{p.customerId?.name || 'Client'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#1A2533]">
                        {p.insurerId?.name || 'Insurer'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#F2ECE1] text-[#3A4553]">
                          {p.type}
                        </span>
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
      {/* SECTION 4: DOCUMENTS                                      */}
      {/* ========================================================= */}
      {activeSection === 'os-documents' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                OFFICE STAFF / Document Verification
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                Policy Schedules & KYC Verification
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1 font-sans">
                Review and stamp customer KYC and signed proposal schedules.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E7E2D6] rounded-xl p-6 text-center">
            <Upload className="w-8 h-8 text-[#C05D34] mx-auto mb-2" />
            <h4 className="font-serif font-bold text-base text-[#1A2533]">Upload Policy Schedule / RC Copy</h4>
            <p className="text-xs text-[#7A8696] max-w-sm mx-auto mt-1">
              Select verified customer document to attach to their MongoDB profile.
            </p>
            <button
              onClick={() => alert('Select file from your computer...')}
              className="mt-3 px-4 py-1.5 bg-[#C05D34] hover:bg-[#A94F2B] text-white text-xs font-semibold rounded shadow-2xs"
            >
              Browse Files
            </button>
          </div>
        </div>
      )}

      {/* Modal: Add Customer */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#DCD6C8] w-full max-w-md p-6 shadow-elevated">
            <h3 className="font-serif font-bold text-lg text-[#1A2533] mb-4">Add Customer Record to MongoDB</h3>
            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A2533] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
                  placeholder="e.g. Ramesh Patil"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A2533] mb-1">Mobile Number</label>
                <input
                  type="text"
                  required
                  value={newCust.phone}
                  onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34] font-mono"
                  placeholder="98220 11223"
                />
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
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
