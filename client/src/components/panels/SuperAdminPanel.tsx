import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  Plus,
  Search,
  Activity,
  Trash2,
} from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import { socketService } from '../../services/socket';
import { Modal } from '../common/Modal';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';

interface SuperAdminPanelProps {
  currentSection: string;
}

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ currentSection }) => {
  const activeSection = currentSection || 'sa-overview';

  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Dedicated Delete Confirmation State
  const [companyToDelete, setCompanyToDelete] = useState<{ id: string; name: string; slug: string; maxSlots: number; status: string } | null>(null);
  const [isDeletingCompany, setIsDeletingCompany] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      const [cList, logs] = await Promise.all([
        workspaceService.getCompanies().catch(() => []),
        workspaceService.getAuditLogs().catch(() => []),
      ]);
      setCompanies(cList);
      setAuditLogs(logs);
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

  const confirmDeleteCompany = async () => {
    if (!companyToDelete) return;
    setIsDeletingCompany(true);
    setDeleteError(null);
    try {
      await workspaceService.deleteCompany(companyToDelete.id);
      setCompanies((prev) => prev.filter((c) => c._id !== companyToDelete.id));
      setCompanyToDelete(null);
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || 'Failed to delete company workspace. Please try again.');
    } finally {
      setIsDeletingCompany(false);
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
    <div className="space-y-6 font-sans text-slate-900">

      {/* SECTION 1: PLATFORM OVERVIEW */}
      {activeSection === 'sa-overview' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Platform Overview
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Registered broker tenant organizations and slot allocations ({companies.length} active).
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="self-start sm:self-auto px-3 sm:px-3.5 py-1.5 sm:py-2 bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-lg text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Company</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500 block">Workspaces</span>
                  <div className="flex items-baseline gap-1.5 mt-1 sm:mt-1.5">
                    <span className="text-xl sm:text-2xl font-bold text-slate-900">{companies.length}</span>
                    <span className="text-[11px] sm:text-xs text-slate-400">tenants</span>
                  </div>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500 block">Employee Slots</span>
                  <div className="flex items-baseline gap-1.5 mt-1 sm:mt-1.5">
                    <span className="text-xl sm:text-2xl font-bold text-slate-900">{totalSlotsAll}</span>
                    <span className="text-[11px] sm:text-xs text-slate-400">allocated</span>
                  </div>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500 block">Suspended</span>
                  <div className="flex items-baseline gap-1.5 mt-1 sm:mt-1.5">
                    <span className="text-xl sm:text-2xl font-bold text-[#C05D34]">{totalSuspended}</span>
                    <span className="text-[11px] sm:text-xs text-slate-400">accounts</span>
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
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500 block">Active Status</span>
                  <div className="flex items-baseline gap-1.5 mt-1 sm:mt-1.5">
                    <span className="text-xl sm:text-2xl font-bold text-emerald-700">
                      {companies.filter((c) => c.status === 'ACTIVE').length}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-400">normal</span>
                  </div>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-xs text-slate-800">Tenant Brokerages</h3>
              <span className="text-xs text-slate-500">{companies.length} registered</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Company</th>
                    <th className="py-2.5 px-4">Workspace Slug</th>
                    <th className="py-2.5 px-4">Capacity</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companies.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">{c.name}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">/{c.slug}</td>
                      <td className="py-3 px-4 text-slate-700">{c.maxSlots || 10} seats</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => toggleCompanyStatus(c._id, c.status)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition cursor-pointer"
                        >
                          {c.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
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

      {/* SECTION 2: COMPANIES DIRECTORY */}
      {activeSection === 'sa-companies' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Companies Directory
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Registered broker tenant organizations ({companies.length} total).
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Company</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Company & Location</th>
                    <th className="py-2.5 px-4">Workspace Slug</th>
                    <th className="py-2.5 px-4">Slot Capacity</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-800">No company workspaces found</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {search ? 'Try adjusting your search criteria' : 'Create a tenant organization to get started'}
                        </p>
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="mt-3 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create Company</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{c.address || 'India'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">/{c.slug}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{c.maxSlots || 10} slots</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleCompanyStatus(c._id, c.status)}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition cursor-pointer"
                          >
                            {c.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => {
                              setCompanyToDelete({
                                id: c._id,
                                name: c.name,
                                slug: c.slug || '',
                                maxSlots: c.maxSlots || 10,
                                status: c.status || 'ACTIVE',
                              });
                              setDeleteError(null);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Delete Company Workspace"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

      {/* SECTION 3: CREATE COMPANY */}
      {activeSection === 'sa-create-company' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Create Company
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Provision a new broker organization workspace and assign Administrator.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs max-w-2xl">
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">Company Legal Name</label>
                <input
                  type="text"
                  required
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                  placeholder="e.g. Acme Insurance Brokers Pvt Ltd"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">Workspace Slug</label>
                <input
                  type="text"
                  required
                  value={newCompany.slug}
                  onChange={(e) => setNewCompany({ ...newCompany, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 font-mono"
                  placeholder="acme-insurance"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Admin Name</label>
                  <input
                    type="text"
                    required
                    value={newCompany.adminName}
                    onChange={(e) => setNewCompany({ ...newCompany, adminName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={newCompany.adminEmail}
                    onChange={(e) => setNewCompany({ ...newCompany, adminEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                    placeholder="admin@acme.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">Employee Slot Capacity</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={newCompany.maxSlots}
                  onChange={(e) => setNewCompany({ ...newCompany, maxSlots: Number(e.target.value) || 10 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C05D34] hover:bg-[#A94F2B] text-white text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
                >
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 4: COMPANY ADMINISTRATION */}
      {activeSection === 'sa-company-details' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Company Administration
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Active tenant organizations and configuration status.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center shadow-2xs">
              <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-medium text-slate-500">Loading tenant organizations...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {companies.length === 0 ? (
                <div className="col-span-full bg-white border border-slate-200/80 rounded-xl p-10 text-center shadow-2xs">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900">No Companies Configured</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    There are currently no active tenant organizations on the platform. Provision a new broker workspace to configure access and slots.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Company</span>
                    </button>
                  </div>
                </div>
              ) : (
                companies.map((c) => (
              <div key={c._id} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="font-semibold text-sm text-slate-900">{c.name}</h4>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Workspace URL</span>
                      <span className="font-mono text-slate-700">/{c.slug}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Slot Capacity</span>
                      <span className="text-slate-800 font-medium">{c.maxSlots || 10} seats allocated</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => toggleCompanyStatus(c._id, c.status)}
                    className="text-xs font-semibold text-[#C05D34] hover:underline cursor-pointer"
                  >
                    {c.status === 'ACTIVE' ? 'Suspend Organization' : 'Activate Organization'}
                  </button>
                </div>
              </div>
            ))
            )}
          </div>
          )}
        </div>
      )}

      {/* SECTION 5: SLOT CAPACITY MANAGER */}
      {activeSection === 'sa-slots' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Slot Capacity Manager
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Adjust employee seat capacity per tenant organization.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Company Workspace</th>
                    <th className="py-2.5 px-4">Allocated Slots</th>
                    <th className="py-2.5 px-4 text-right">Adjust Capacity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-xs text-slate-400">
                        No company workspaces available to allocate slots.
                      </td>
                    </tr>
                  ) : (
                    companies.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">/{c.slug}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {c.maxSlots || 10} slots
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => updateSlots(c._id, (c.maxSlots || 10) - 1)}
                            className="w-7 h-7 bg-white border border-slate-200 hover:border-slate-400 rounded font-bold text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-semibold px-2 text-xs text-slate-900">{c.maxSlots || 10}</span>
                          <button
                            onClick={() => updateSlots(c._id, (c.maxSlots || 10) + 1)}
                            className="w-7 h-7 bg-white border border-slate-200 hover:border-slate-400 rounded font-bold text-xs text-[#C05D34] cursor-pointer"
                          >
                            +
                          </button>
                        </div>
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

      {/* SECTION 6: PLATFORM AUDIT LOGS */}
      {activeSection === 'sa-audit-logs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                Platform Audit Logs
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                System events and tenant administrative actions ({auditLogs.length} logged).
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <div key={log._id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 border border-slate-100">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{log.action}</div>
                      <div className="text-[11px] text-slate-500">
                        Entity: <span className="text-slate-700 font-medium">{log.entity || 'Platform'}</span> · Role: {log.actorRole || 'SYSTEM'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-[11px] text-slate-500">
                      {new Date(log.createdAt || Date.now()).toLocaleTimeString()}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-medium">Verified</span>
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
        title="Add Broker Organization"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateCompany} className="space-y-2.5 sm:space-y-3">
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-slate-800 mb-0.5 sm:mb-1">Legal Company Name</label>
            <input
              type="text"
              required
              value={newCompany.name}
              onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-slate-400"
              placeholder="e.g. Apex Insurance Pvt Ltd"
            />
          </div>
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-slate-800 mb-0.5 sm:mb-1">Workspace Slug</label>
            <input
              type="text"
              required
              value={newCompany.slug}
              onChange={(e) => setNewCompany({ ...newCompany, slug: e.target.value })}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-slate-400 font-mono"
              placeholder="apex-insurance"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-800 mb-0.5 sm:mb-1">Admin Full Name</label>
              <input
                type="text"
                required
                value={newCompany.adminName}
                onChange={(e) => setNewCompany({ ...newCompany, adminName: e.target.value })}
                className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-slate-400"
                placeholder="Ramesh Patel"
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-800 mb-0.5 sm:mb-1">Admin Email</label>
              <input
                type="email"
                required
                value={newCompany.adminEmail}
                onChange={(e) => setNewCompany({ ...newCompany, adminEmail: e.target.value })}
                className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-slate-400"
                placeholder="ramesh@apex.in"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-slate-800 mb-0.5 sm:mb-1">Employee Slot Allocation</label>
            <input
              type="number"
              min={1}
              max={500}
              value={newCompany.maxSlots}
              onChange={(e) => setNewCompany({ ...newCompany, maxSlots: Number(e.target.value) || 10 })}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-slate-400"
            />
          </div>
          <div className="pt-2.5 sm:pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs text-slate-600 hover:bg-slate-50 rounded-lg font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded-lg transition shadow-2xs cursor-pointer"
            >
              Save Company
            </button>
          </div>
        </form>
      </Modal>

      {/* DEDICATED DELETE CONFIRMATION MODAL / PAGE */}
      <DeleteConfirmationModal
        isOpen={!!companyToDelete}
        title="Delete Company Workspace"
        itemName={companyToDelete?.name || ''}
        itemType="company workspace"
        requireTypingName={true}
        isDeleting={isDeletingCompany}
        errorMessage={deleteError}
        details={
          companyToDelete
            ? [
                { label: 'Company Name', value: companyToDelete.name },
                { label: 'Tenant Slug', value: `/${companyToDelete.slug}` },
                { label: 'Slot Capacity', value: `${companyToDelete.maxSlots} employee slots` },
                { label: 'Account Status', value: companyToDelete.status },
              ]
            : []
        }
        warningMessage="This action will permanently delete this tenant organization and all its data. All customer records, underwritten policies, payment ledgers, and employee account credentials will be irrevocably deleted."
        onConfirm={confirmDeleteCompany}
        onClose={() => {
          if (!isDeletingCompany) {
            setCompanyToDelete(null);
            setDeleteError(null);
          }
        }}
      />
    </div>
  );
};
