import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ChevronRight,
  Shield,
  Activity,
  FileSpreadsheet,
  AlertTriangle,
  Lock,
  ArrowUpRight,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import { socketService } from '../../services/socket';
import { Modal } from '../common/Modal';

interface SuperAdminPanelProps {
  currentSection: string;
}

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ currentSection }) => {
  const activeSection = currentSection || 'sa-overview';

  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [platformOverview, setPlatformOverview] = useState<any>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    slug: '',
    adminName: '',
    adminEmail: '',
    maxSlots: 10,
    address: '',
    phone: '',
  });

  const loadPlatformData = async () => {
    try {
      setLoading(true);
      const [cList, logs, overview] = await Promise.all([
        workspaceService.getCompanies().catch(() => []),
        workspaceService.getAuditLogs().catch(() => []),
        workspaceService.getPlatformOverview().catch(() => null),
      ]);
      setCompanies(cList);
      setAuditLogs(logs);
      setPlatformOverview(overview);
    } catch (err) {
      console.error('Failed to load platform data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformData();

    const unsubPlatform = socketService.on('platform_activity', (activity) => {
      setAuditLogs((prev) => [
        {
          _id: `live-${Date.now()}`,
          action: activity.event,
          entity: activity.companyId,
          createdAt: activity.timestamp || new Date(),
        },
        ...prev,
      ]);
    });

    const unsubCompany = socketService.on('COMPANY_UPDATED', (updatedComp) => {
      setCompanies((prev) => prev.map((c) => (c._id === updatedComp._id ? updatedComp : c)));
    });

    const unsubCompanyCreated = socketService.on('COMPANY_CREATED', (newComp) => {
      setCompanies((prev) => [newComp, ...prev.filter((c) => c._id !== newComp._id)]);
    });

    const unsubCompanyDeleted = socketService.on('COMPANY_DELETED', ({ id }) => {
      setCompanies((prev) => prev.filter((c) => c._id !== id));
    });

    return () => {
      unsubPlatform();
      unsubCompany();
      unsubCompanyCreated();
      unsubCompanyDeleted();
    };
  }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await workspaceService.createCompany(newCompany);
      setCompanies([...companies, created]);
      setShowCreateModal(false);
      setNewCompany({ name: '', slug: '', adminName: '', adminEmail: '', maxSlots: 10, address: '', phone: '' });
      alert(`Company workspace ${created.name} provisioned successfully!`);
    } catch (err: any) {
      alert(`Error creating company: ${err.message}`);
    }
  };

  const toggleCompanyStatus = async (id: string, currentStatus?: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const updated = await workspaceService.toggleCompanyStatus(id, nextStatus);
      const finalStatus = updated?.status || nextStatus;
      setCompanies((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: finalStatus } : c))
      );
    } catch (err: any) {
      alert(`Error toggling status: ${err.message}`);
    }
  };

  const updateSlots = async (id: string, newSlots: number) => {
    try {
      await workspaceService.updateCompanySlots(id, Math.max(1, newSlots));
      setCompanies(companies.map((c) => (c._id === id ? { ...c, maxSlots: Math.max(1, newSlots) } : c)));
    } catch (err: any) {
      alert(`Error updating slots: ${err.message}`);
    }
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    if (!window.confirm(`Delete company "${name}"? This will permanently remove its tenant workspace.`)) {
      return;
    }
    try {
      await workspaceService.deleteCompany(id);
      setCompanies((prev) => prev.filter((c) => c._id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete company');
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.slug?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSlotsAll = companies.reduce((acc, c) => acc + (c.maxSlots || 10), 0);
  const totalSuspended = companies.filter((c) => c.status === 'SUSPENDED').length;

  return (
    <div className="space-y-6 font-sans text-[#1A2533]">
      {/* Live Stream Indicator */}
      <div className="flex items-center justify-between text-xs text-[#7A8696] bg-[#FAF8F5] px-3.5 py-1.5 rounded-lg border border-[#EAE5DC]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[11px] text-[#1E7E34] font-bold">
            Platform Global Monitor Live
          </span>
          <span className="text-[#8E9AAB]">·</span>
          <span>Tenants Active: <strong>{companies.length}</strong></span>
        </div>

        <button
          onClick={loadPlatformData}
          disabled={loading}
          className="flex items-center gap-1 text-[#C05D34] font-semibold hover:underline"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Platform</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: PLATFORM OVERVIEW                              */}
      {/* ========================================================= */}
      {activeSection === 'sa-overview' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                PLATFORM SUPER ADMIN / Global console
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                Platform Overview
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1">
                Registered tenant organizations: {companies.length} active companies.
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Provision company</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E7E2D6] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#1A2533] uppercase tracking-wider block font-mono">
                    WORKSPACES
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-serif font-bold text-[#1A2533]">{companies.length}</span>
                    <span className="text-xs text-[#7E8B9C]">active tenants</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-md bg-[#FAF5EE] text-[#C05D34] flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#F2EDE2] text-xs text-[#6F7C8E]">
                {companies.filter((c) => c.status === 'ACTIVE').length} operating normally
              </div>
            </div>

            <div className="bg-white border border-[#E7E2D6] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#1A2533] uppercase tracking-wider block font-mono">
                    EMPLOYEE SLOTS
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-serif font-bold text-[#1A2533]">{totalSlotsAll}</span>
                    <span className="text-xs text-[#7E8B9C]">allocated</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#F2EDE2] text-xs text-teal font-medium">
                Live across tenant databases
              </div>
            </div>

            <div className="bg-white border border-[#E7E2D6] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#C05D34] uppercase tracking-wider block font-mono">
                    SUSPENDED
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-serif font-bold text-[#C05D34]">{totalSuspended}</span>
                    <span className="text-xs text-[#7E8B9C]">tenants</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-md bg-[#FAF5EE] text-[#C05D34] flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#F2EDE2] text-xs text-[#C05D34] font-medium">
                Locked at gateway
              </div>
            </div>

            <div className="bg-white border border-[#E7E2D6] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#1A2533] uppercase tracking-wider block font-mono">
                    DATA PRIVACY
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-serif font-bold text-[#1A2533]">100% Isolated</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#F2EDE2] text-[11px] text-[#7E8B9C]">
                Tenant ID verified on API
              </div>
            </div>
          </div>

          {/* Quick Companies Table */}
          <div className="bg-white border border-[#E7E2D6] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="p-4 border-b border-[#F0EBE1] flex justify-between items-center">
              <h3 className="font-serif font-bold text-base text-[#1A2533]">Registered Tenant Organizations</h3>
              <span className="text-xs text-[#7A8696] font-mono">{companies.length} workspaces</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#EAE5DC] text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono">
                    <th className="py-3 px-5">COMPANY NAME</th>
                    <th className="py-3 px-5">SLUG</th>
                    <th className="py-3 px-5">SLOTS</th>
                    <th className="py-3 px-5">STATUS</th>
                    <th className="py-3 px-5 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EDE2]">
                  {companies.map((c) => (
                    <tr key={c._id} className="hover:bg-[#FAF8F5] transition">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-[#1A2533] text-xs">{c.name}</div>
                        <div className="text-[11px] text-[#7E8B9C] mt-0.5">{c.address || c.location || 'Pune'}</div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-[11px]">
                        /{c.slug}
                      </td>
                      <td className="py-3.5 px-5 font-mono font-bold text-xs text-[#1A2533]">
                        {c.maxSlots || 10} slots
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                          c.status === 'ACTIVE' ? 'bg-[#EBF7EE] text-[#1E7E34]' : 'bg-[#FBECE6] text-[#C05D34]'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleCompanyStatus(c._id, c.status)}
                            className={`px-2.5 py-1 text-xs font-semibold border rounded transition ${
                              c.status === 'ACTIVE'
                                ? 'bg-[#FAF8F5] text-rose-700 border-rose-200 hover:bg-rose-50'
                                : 'bg-[#FAF8F5] text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                            }`}
                          >
                            {c.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteCompany(c._id, c.name)}
                            className="p-1 text-[#8E9AAB] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded transition"
                            title="Delete Company"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
      {/* SECTION 2: COMPANIES DIRECTORY                            */}
      {/* ========================================================= */}
      {activeSection === 'sa-companies' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                PLATFORM SUPER ADMIN / Tenants Directory
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                All Broker Companies
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1">
                Active brokerage accounts: {companies.length} registered.
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Company</span>
            </button>
          </div>

          <div className="bg-white border border-[#E7E2D6] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#EAE5DC] text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono">
                    <th className="py-3 px-5">COMPANY & LOCATION</th>
                    <th className="py-3 px-5">WORKSPACE SLUG</th>
                    <th className="py-3 px-5">SLOT CAPACITY</th>
                    <th className="py-3 px-5">STATUS</th>
                    <th className="py-3 px-5 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EDE2]">
                  {filteredCompanies.map((c) => (
                    <tr key={c._id} className="hover:bg-[#FAF8F5] transition">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-[#1A2533]">{c.name}</div>
                        <div className="text-[11px] text-[#7E8B9C] mt-0.5">{c.address || 'India'}</div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-[11px] text-[#1A2533]">
                        broker.app/{c.slug}
                      </td>
                      <td className="py-3.5 px-5 font-mono font-bold text-xs">
                        {c.maxSlots || 10} slots
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                          c.status === 'ACTIVE' ? 'bg-[#EBF7EE] text-[#1E7E34]' : 'bg-[#FBECE6] text-[#C05D34]'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleCompanyStatus(c._id, c.status)}
                            className={`px-2.5 py-1 text-xs font-semibold border rounded transition ${
                              c.status === 'ACTIVE'
                                ? 'bg-[#FAF8F5] text-rose-700 border-rose-200 hover:bg-rose-50'
                                : 'bg-[#FAF8F5] text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                            }`}
                          >
                            {c.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteCompany(c._id, c.name)}
                            className="p-1 text-[#8E9AAB] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded transition"
                            title="Delete Company"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
      {/* SECTION 3: CREATE COMPANY                                 */}
      {/* ========================================================= */}
      {activeSection === 'sa-create-company' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                PLATFORM SUPER ADMIN / Provisioning
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                Provision New Company Workspace
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1">
                Provision a dedicated brokerage workspace and assign Company Admin.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E7E2D6] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] max-w-2xl">
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A2533] mb-1">Broker Company Legal Name</label>
                <input
                  type="text"
                  required
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="e.g. Apex Shield Insurance Brokers"
                  className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2533] mb-1">Subdomain / Slug</label>
                  <input
                    type="text"
                    required
                    value={newCompany.slug}
                    onChange={(e) => setNewCompany({ ...newCompany, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs font-mono focus:outline-none focus:border-[#C05D34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2533] mb-1">Slot Capacity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newCompany.maxSlots}
                    onChange={(e) => setNewCompany({ ...newCompany, maxSlots: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs font-mono focus:outline-none focus:border-[#C05D34]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2533] mb-1">Admin Full Name</label>
                  <input
                    type="text"
                    required
                    value={newCompany.adminName}
                    onChange={(e) => setNewCompany({ ...newCompany, adminName: e.target.value })}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2533] mb-1">Admin Email Address</label>
                  <input
                    type="email"
                    required
                    value={newCompany.adminEmail}
                    onChange={(e) => setNewCompany({ ...newCompany, adminEmail: e.target.value })}
                    placeholder="admin@broker.in"
                    className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#F0EBE1] flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C05D34] hover:bg-[#A94F2B] text-white text-xs font-semibold rounded shadow-2xs"
                >
                  Provision Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 4: COMPANY DETAILS                                */}
      {/* ========================================================= */}
      {activeSection === 'sa-company-details' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                PLATFORM SUPER ADMIN / Company Administration
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                Company Administration
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1">
                Active tenant cards from database.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {companies.map((c) => (
              <div key={c._id} className="bg-white border border-[#E7E2D6] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                    <h4 className="font-serif font-bold text-base text-[#1A2533]">{c.name}</h4>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      c.status === 'ACTIVE' ? 'bg-[#EBF7EE] text-[#1E7E34]' : 'bg-[#FBECE6] text-[#C05D34]'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2 text-xs">
                    <div>
                      <span className="text-[#8E9AAB] block text-[10px] uppercase font-mono">WORKSPACE URL</span>
                      <span className="font-mono text-[#1A2533]">broker.app/{c.slug}</span>
                    </div>
                    <div>
                      <span className="text-[#8E9AAB] block text-[10px] uppercase font-mono">SLOT CAPACITY</span>
                      <span className="font-mono text-[#1A2533]">{c.maxSlots || 10} seats allocated</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex items-center justify-between">
                  <button
                    onClick={() => toggleCompanyStatus(c._id, c.status)}
                    className="text-xs font-semibold text-[#C05D34] hover:underline"
                  >
                    {c.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 5: SLOT CAPACITY MANAGER                          */}
      {/* ========================================================= */}
      {activeSection === 'sa-slots' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                PLATFORM SUPER ADMIN / Multi-Tenant Licensing
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                Slot Capacity Manager
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1">
                Dynamically adjust employee seats per tenant.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E7E2D6] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#EAE5DC] text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono">
                    <th className="py-3 px-5">COMPANY WORKSPACE</th>
                    <th className="py-3 px-5">CURRENT ALLOCATED SLOTS</th>
                    <th className="py-3 px-5 text-right">ADJUST CAPACITY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EDE2]">
                  {companies.map((c) => (
                    <tr key={c._id} className="hover:bg-[#FAF8F5] transition">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-[#1A2533]">{c.name}</div>
                        <div className="text-[11px] text-[#7A8696] font-mono">/{c.slug}</div>
                      </td>
                      <td className="py-3.5 px-5 font-mono font-bold text-sm text-[#1A2533]">
                        {c.maxSlots || 10} slots
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => updateSlots(c._id, (c.maxSlots || 10) - 1)}
                            className="w-7 h-7 bg-white border border-[#D5CEBF] hover:border-[#1A2533] rounded font-mono font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold px-2 text-xs text-[#1A2533]">{c.maxSlots || 10}</span>
                          <button
                            onClick={() => updateSlots(c._id, (c.maxSlots || 10) + 1)}
                            className="w-7 h-7 bg-white border border-[#D5CEBF] hover:border-[#1A2533] rounded font-mono font-bold text-xs text-[#C05D34]"
                          >
                            +
                          </button>
                        </div>
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
      {/* SECTION 6: PLATFORM AUDIT LOGS                            */}
      {/* ========================================================= */}
      {activeSection === 'sa-audit-logs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#8E9AAB] uppercase tracking-wider font-mono mb-1">
                PLATFORM SUPER ADMIN / Security & Audit Trail
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A2533] tracking-tight leading-tight">
                Platform Audit Logs
              </h1>
              <p className="text-xs text-[#6F7C8E] mt-1">
                Security audit trail: {auditLogs.length} events logged.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E7E2D6] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="divide-y divide-[#F0EBE1]">
              {auditLogs.map((log) => (
                <div key={log._id} className="p-4 flex items-center justify-between hover:bg-[#FAF8F5]/80 transition text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#FAF5EE] text-[#C05D34] flex items-center justify-center shrink-0 border border-[#EEDFCE]">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#1A2533]">{log.action}</div>
                      <div className="text-[11px] text-[#7A8696]">
                        Entity: <span className="font-semibold text-[#1A2533]">{log.entity || 'Platform'}</span> · Role: {log.actorRole || 'SYSTEM'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-[11px] text-[#8E9AAB]">
                      {new Date(log.createdAt || Date.now()).toLocaleTimeString()}
                    </div>
                    <span className="text-[10px] font-mono text-[#1E7E34] font-semibold">VERIFIED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Company */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Provision Company to Database"
        subtitle="Create an isolated brokerage workspace with admin credentials"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateCompany} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#1A2533] mb-1">Company Legal Name</label>
            <input
              type="text"
              required
              value={newCompany.name}
              onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              placeholder="e.g. Vanguard Insurance Advisors"
              className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1A2533] mb-1">Workspace Slug</label>
              <input
                type="text"
                required
                value={newCompany.slug}
                onChange={(e) => setNewCompany({ ...newCompany, slug: e.target.value })}
                className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs font-mono focus:outline-none focus:border-[#C05D34]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A2533] mb-1">Employee Slots</label>
              <input
                type="number"
                required
                min={1}
                value={newCompany.maxSlots}
                onChange={(e) => setNewCompany({ ...newCompany, maxSlots: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs font-mono focus:outline-none focus:border-[#C05D34]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1A2533] mb-1">Admin Name</label>
              <input
                type="text"
                required
                value={newCompany.adminName}
                onChange={(e) => setNewCompany({ ...newCompany, adminName: e.target.value })}
                placeholder="Deepak Verma"
                className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A2533] mb-1">Admin Email</label>
              <input
                type="email"
                required
                value={newCompany.adminEmail}
                onChange={(e) => setNewCompany({ ...newCompany, adminEmail: e.target.value })}
                placeholder="deepak@vanguard.in"
                className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0EBE1] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-3 py-1.5 text-xs text-[#5E6877] hover:bg-[#FAF8F5] rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded transition shadow-2xs"
            >
              Save Workspace
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
