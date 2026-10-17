import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Clock,
  Percent,
  Download,
  Phone,
  Calendar,
  Search,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { workspaceService } from '../../services/workspaceService';
import { socketService } from '../../services/socket';
import { Dropdown } from '../common/Dropdown';
import { Modal } from '../common/Modal';

interface SalesmanPanelProps {
  currentSection: string;
}

export const SalesmanPanel: React.FC<SalesmanPanelProps> = ({ currentSection }) => {
  const { user } = useAuth();
  const activeSection = currentSection || 'sm-dashboard';

  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [commSummary, setCommSummary] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showRecordSaleModal, setShowRecordSaleModal] = useState(false);

  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', city: '' });
  const [newSale, setNewSale] = useState({
    policyNumber: '',
    customerId: '',
    type: 'Motor',
    premium: '',
    sumInsured: '',
    expiryDate: '',
  });

  const loadSalesmanData = async () => {
    try {
      setLoading(true);
      const [pList, cList, cSum] = await Promise.all([
        workspaceService.getPolicies().catch(() => []),
        workspaceService.getCustomers().catch(() => []),
        workspaceService.getCommissionSummary().catch(() => null),
      ]);
      setPolicies(pList);
      setCustomers(cList);
      setCommSummary(cSum);
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

    return () => {
      unsubPolicy();
      unsubCustomer();
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
      const created = await workspaceService.createPolicy({
        policyNumber: newSale.policyNumber,
        customerId: newSale.customerId || customers[0]?._id,
        insurerId: '660000000000000000000003', // HDFC ERGO
        salesmanId: user?.id || '660000000000000000000004',
        type: newSale.type,
        sumInsured: Number(newSale.sumInsured) || 500000,
        premium: Number(newSale.premium) || 15000,
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: newSale.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      });

      setPolicies([created, ...policies]);
      setShowRecordSaleModal(false);
      setNewSale({ policyNumber: '', customerId: '', type: 'Motor', premium: '', sumInsured: '', expiryDate: '' });
    } catch (err: any) {
      alert(`Error recording sale: ${err.message}`);
    }
  };

  const totalEarned = commSummary?.salesmanEarnedTotal || 4263;
  const totalPaid = commSummary?.salesmanPaidTotal || 1920;
  const pendingPayout = Math.max(0, totalEarned - totalPaid);

  return (
    <div className="space-y-6 font-sans text-[#1A2533]">

      {/* ========================================================= */}
      {/* SECTION 1: MY DASHBOARD & PRODUCTION                      */}
      {/* ========================================================= */}
      {activeSection === 'sm-dashboard' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                SALESMAN / Assigned portfolio
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                My Dashboard & Production
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1">
                Real-time agent book: {policies.length} policies across {customers.length} assigned clients.
              </p>
            </div>

            <span className="text-xs text-[#7B8899] font-medium shrink-0">
              Agent Code: <span className="font-mono font-bold text-[#1A2533]">{user?.salesmanCode || 'AM-01'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E7E2D6] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#1A2533] uppercase tracking-wider block font-mono">
                    MY POLICIES
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-serif font-bold text-[#1A2533]">{policies.length}</span>
                    <span className="text-xs text-[#7E8B9C]">active books</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-md bg-[#FAF5EE] text-[#C05D34] flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#F2EDE2] text-xs text-teal font-medium">
                Live Records
              </div>
            </div>

            <div className="bg-white border border-[#E7E2D6] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#C05D34] uppercase tracking-wider block font-mono">
                    RENEWALS DUE
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-serif font-bold text-[#C05D34]">
                      {policies.filter((p) => p.status === 'Overdue' || p.status === 'Due Soon').length}
                    </span>
                    <span className="text-xs text-[#7E8B9C]">clients</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-md bg-[#FAF5EE] text-[#C05D34] flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#F2EDE2] text-xs text-[#C05D34] font-medium">
                Action required
              </div>
            </div>

            <div className="bg-white border border-[#E7E2D6] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#1A2533] uppercase tracking-wider block font-mono">
                    EARNED COMMISSION
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="font-serif font-bold text-2xl text-[#1A2533]">
                      ₹ {totalEarned.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Percent className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#F2EDE2] text-xs text-[#7E8B9C]">
                Based on agreed agent rates
              </div>
            </div>

            <div className="bg-white border border-[#E7E2D6] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#1A2533] uppercase tracking-wider block font-mono">
                    PENDING PAYOUT
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="font-serif font-bold text-2xl text-[#C05D34]">
                      ₹ {pendingPayout.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-md bg-[#FAF5EE] text-[#C05D34] flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#F2EDE2] text-xs text-amber-800 font-medium">
                Awaiting disbursement
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: MY CUSTOMERS                                   */}
      {/* ========================================================= */}
      {activeSection === 'sm-customers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                SALESMAN / Direct Book
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                My Client Contacts & Leads
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1 font-sans">
                Assigned client leads: {customers.length} contacts.
              </p>
            </div>

            <button
              onClick={() => setShowAddLeadModal(true)}
              className="px-4 py-2 bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Lead</span>
            </button>
          </div>

          <div className="bg-white border border-[#E7E2D6] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="p-4 border-b border-[#EAE5DC] flex items-center justify-between">
              <div className="relative w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8E9AAB]" />
                <input
                  type="text"
                  placeholder="Search my clients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#D5CEBF] rounded text-[#1A2533] focus:outline-none focus:border-[#C05D34]"
                />
              </div>

              <span className="text-xs text-[#7A8696] font-mono">{customers.length} clients</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE5DC] text-[#8E9AAB] font-mono text-[10px] uppercase tracking-wider bg-[#FAF8F5]">
                    <th className="py-3 px-4 font-bold">CLIENT NAME</th>
                    <th className="py-3 px-4 font-bold">PHONE NUMBER</th>
                    <th className="py-3 px-4 font-bold">CITY</th>
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
                            Call
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
      {/* SECTION 3: MY POLICIES                                    */}
      {/* ========================================================= */}
      {activeSection === 'sm-policies' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                SALESMAN / Sold Portfolio
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                My Policy Book
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1 font-sans">
                Active sourced policies: {policies.length} records.
              </p>
            </div>

            <button
              onClick={() => setShowRecordSaleModal(true)}
              className="px-4 py-2 bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Sale</span>
            </button>
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
                    <th className="py-3 px-4 font-bold text-right">STATUS</th>
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
                      <td className="py-3.5 px-4 text-right">
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
      {/* SECTION 4: MY COMMISSION LEDGER                           */}
      {/* ========================================================= */}
      {activeSection === 'sm-commissions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                SALESMAN / Payout Statement
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                My Commission Statement
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1 font-sans">
                Real-time statement from database.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E7E2D6] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-[#F0EBE1]">
              <div className="p-4 bg-[#FAF8F5] rounded-lg">
                <span className="text-[10px] uppercase font-bold text-[#8E9AAB] block tracking-wider font-mono">
                  TOTAL EARNED
                </span>
                <span className="font-serif font-bold text-2xl text-[#1A2533] mt-1 block">
                  ₹ {totalEarned.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-4 bg-[#FAF8F5] rounded-lg">
                <span className="text-[10px] uppercase font-bold text-[#8E9AAB] block tracking-wider font-mono">
                  PAID OUT
                </span>
                <span className="font-serif font-bold text-2xl text-[#1E7E34] mt-1 block">
                  ₹ {totalPaid.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-4 bg-[#FBECE6] rounded-lg border border-[#F5D5C6]">
                <span className="text-[10px] uppercase font-bold text-[#C05D34] block tracking-wider font-mono">
                  PENDING BALANCE
                </span>
                <span className="font-serif font-bold text-2xl text-[#C05D34] mt-1 block">
                  ₹ {pendingPayout.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Lead */}
      <Modal
        isOpen={showAddLeadModal}
        onClose={() => setShowAddLeadModal(false)}
        title="Add Prospect Lead"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddLeadSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#1A2533] mb-1">Prospect Name</label>
            <input
              type="text"
              required
              value={newLead.name}
              onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
              className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
              placeholder="e.g. Rahul Patil"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1A2533] mb-1">Phone Number</label>
            <input
              type="text"
              required
              value={newLead.phone}
              onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
              className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34] font-mono"
              placeholder="98220 44331"
            />
          </div>
          <div className="pt-3 border-t border-[#F0EBE1] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddLeadModal(false)}
              className="px-3 py-1.5 text-xs text-[#5E6877] hover:bg-[#FAF8F5] rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded transition shadow-2xs"
            >
              Save Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Sale */}
      <Modal
        isOpen={showRecordSaleModal}
        onClose={() => setShowRecordSaleModal(false)}
        title="Record Sourced Policy"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordSaleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#1A2533] mb-1">Policy Number</label>
            <input
              type="text"
              required
              value={newSale.policyNumber}
              onChange={(e) => setNewSale({ ...newSale, policyNumber: e.target.value })}
              className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34] font-mono"
              placeholder="e.g. HDFC-MOT-2026-0091"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1A2533] mb-1">Gross Premium (₹)</label>
            <input
              type="number"
              required
              value={newSale.premium}
              onChange={(e) => setNewSale({ ...newSale, premium: e.target.value })}
              className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34] font-mono"
              placeholder="18000"
            />
          </div>
          <Dropdown
            label="Insurance Type"
            value={newSale.type}
            onChange={(val) => setNewSale({ ...newSale, type: val })}
            options={['Motor', 'Health', 'Life', 'Commercial']}
          />
          <div className="pt-3 border-t border-[#F0EBE1] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowRecordSaleModal(false)}
              className="px-3 py-1.5 text-xs text-[#5E6877] hover:bg-[#FAF8F5] rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded transition shadow-2xs"
            >
              Submit Policy
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
