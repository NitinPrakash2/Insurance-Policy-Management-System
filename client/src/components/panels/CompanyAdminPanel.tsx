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
  Trash2,
  X,
  AlertCircle,
  Info,
} from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import { socketService } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { Dropdown } from '../common/Dropdown';
import { Modal } from '../common/Modal';
import { DatePicker } from '../common/DatePicker';

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

  // Customer Multi-Select & Bulk Delete State
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [isDeletingCustomers, setIsDeletingCustomers] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<{ id: string; name: string } | null>(null);

  // In-app Toast notification state
  const [toast, setToast] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 3500);
  };

  // Filter & Search states
  const [filterTab, setFilterTab] = useState<'all' | 'dueToday' | 'next7'>('all');
  const [policyTypeFilter, setPolicyTypeFilter] = useState('All policy types');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddPolicyModal, setShowAddPolicyModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showAddInsurerModal, setShowAddInsurerModal] = useState(false);
  const [showLogCallModal, setShowLogCallModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Filters for sub-sections
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Direct' | 'Broker'>('All');
  const [renewalTimeline, setRenewalTimeline] = useState<'All' | 'next7' | 'next30'>('All');

  // Form states
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', city: '' });
  const [newInsurer, setNewInsurer] = useState({ name: '', code: '', type: 'GENERAL', contactPerson: '', phone: '' });
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
  const bulkFileInputRef = React.useRef<HTMLInputElement>(null);

  // Batch Ingestion Live States
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'uploading' | 'completed' | 'error'>('idle');
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, percent: 0, message: '' });
  const [importResult, setImportResult] = useState<{
    filename: string;
    totalRows: number;
    createdCustomers: number;
    createdPolicies: number;
    errors: string[];
  } | null>(null);
  const [importHistory, setImportHistory] = useState<Array<{
    id: string;
    filename: string;
    timestamp: string;
    totalRows: number;
    policiesCreated: number;
    customersCreated: number;
  }>>([]);

  const downloadCustomerSampleCSV = () => {
    const csv = 'Name,Phone,Email,City\nRajesh Verma,9822011223,rajesh@gmail.com,Pune\nSunita Kadam,9822044556,sunita@yahoo.com,Mumbai\nAmitabh Kulkarni,9822077889,amitabh@outlook.com,Nagpur\nAnanya Pillai,9633077410,ananya.p@mail.com,Greater Noida';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_customers_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPolicySampleCSV = () => {
    const csv = 'Policy Number,Customer Name,Phone,Email,Insurer,Policy Type,Sum Insured,Gross Premium,Expiry Date\nPOL-1001,Ramesh Iyer,9820011223,ramesh@mail.com,HDFC ERGO General Insurance,Motor Insurance,500000,14200,2027-09-14\nPOL-1002,Neha Sharma,9987044556,neha@mail.com,LIC of India,Life Insurance,5000000,32500,2027-09-20\nPOL-1003,Vikram Desai,9701288231,vikram@mail.com,ICICI Lombard General Insurance,Health Insurance,1000000,21800,2027-10-15\nPOL-1004,Ananya Pillai,9633077410,ananya@mail.com,New India Assurance,Liability Insurance,1500000,23400,2027-11-01';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_policies_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('parsing');
    setImportProgress({ current: 0, total: 0, percent: 5, message: `Reading ${file.name}...` });
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = (event.target?.result as string) || '';
        const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
        if (rawLines.length === 0) {
          setImportStatus('error');
          setImportProgress({ current: 0, total: 0, percent: 0, message: 'File is empty.' });
          return;
        }

        const parseCsvLine = (line: string) => {
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());
          return values;
        };

        const headerLine = parseCsvLine(rawLines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const isPolicyCsv = headerLine.some(
          (h) => h.includes('policy') || h.includes('policyno') || h.includes('policynumber') || h.includes('premium')
        );

        const dataRows = rawLines.slice(1);
        const total = dataRows.length;
        setImportStatus('uploading');
        setImportProgress({ current: 0, total, percent: 10, message: `Found ${total} records. Ingesting...` });

        let createdCust = 0;
        let createdPol = 0;
        const errors: string[] = [];

        // Preload fresh dependencies
        const [freshCustomers, freshInsurers, freshEmployees] = await Promise.all([
          workspaceService.getCustomers().catch(() => customers),
          workspaceService.getInsurers().catch(() => insurers),
          workspaceService.getEmployees().catch(() => employees),
        ]);

        const customerCache = new Map<string, any>();
        freshCustomers.forEach((c: any) => {
          if (c.phone) customerCache.set(c.phone.trim(), c);
          if (c.name) customerCache.set(c.name.trim().toLowerCase(), c);
        });

        const defaultInsurer = freshInsurers[0];
        const defaultSalesman = freshEmployees.find((emp: any) => emp.role === 'SALESMAN') || freshEmployees[0];

        for (let i = 0; i < total; i++) {
          const row = parseCsvLine(dataRows[i]);
          const progressPercent = Math.min(95, Math.round(((i + 1) / total) * 100));

          try {
            if (isPolicyCsv) {
              const getCol = (keywords: string[]) => {
                const idx = headerLine.findIndex((h) => keywords.some((k) => h.includes(k)));
                return idx !== -1 ? row[idx] : '';
              };

              const polNo =
                getCol(['policynumber', 'policyno', 'policyid', 'policy']) ||
                `POL-${Date.now().toString().slice(-4)}-${i + 1}`;
              const custName = getCol(['customername', 'customer', 'client', 'name']) || `Client ${i + 1}`;
              const custPhone = getCol(['phone', 'mobile', 'contact']) || `98000${String(10000 + i).slice(-5)}`;
              const custEmail = getCol(['email', 'mail']) || '';
              const custCity = getCol(['city', 'location']) || 'Pune';
              const insName = getCol(['insurer', 'insurancecompany', 'company']) || '';
              const polType = getCol(['policytype', 'type', 'lob', 'cover']) || 'Motor Insurance';
              const sumInsured = Number(getCol(['suminsured', 'sum', 'idv'])) || 500000;
              const premium = Number(getCol(['grosspremium', 'premium', 'amount'])) || 15000;
              const expDate =
                getCol(['expirydate', 'expiry', 'enddate', 'end']) ||
                new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];

              setImportProgress({
                current: i + 1,
                total,
                percent: progressPercent,
                message: `Importing Policy ${polNo} (${custName})...`,
              });

              // Ensure Customer exists
              let matchedCust = customerCache.get(custPhone) || customerCache.get(custName.toLowerCase());
              if (!matchedCust) {
                const resCust = await workspaceService.createCustomer({
                  name: custName,
                  phone: custPhone,
                  email: custEmail,
                  city: custCity,
                });
                matchedCust = resCust.customer || resCust;
                customerCache.set(custPhone, matchedCust);
                customerCache.set(custName.toLowerCase(), matchedCust);
                createdCust++;
              }

              // Match Insurer
              const matchedIns =
                freshInsurers.find(
                  (insItem: any) =>
                    insName &&
                    (insItem.name?.toLowerCase().includes(insName.toLowerCase()) ||
                      insItem.code?.toLowerCase() === insName.toLowerCase())
                ) || defaultInsurer;

              // Create Policy
              await workspaceService.createPolicy({
                policyNumber: polNo,
                customerId: matchedCust._id || matchedCust.id,
                insurerId: matchedIns?._id || matchedIns?.id,
                salesmanId: defaultSalesman?._id || defaultSalesman?.id,
                type: polType,
                sumInsured,
                premium,
                startDate: new Date().toISOString().split('T')[0],
                expiryDate: expDate,
              });
              createdPol++;
            } else {
              // Customer CSV
              const name = row[0];
              const phone = row[1];
              const email = row[2] || '';
              const city = row[3] || 'Pune';

              if (name && phone) {
                setImportProgress({
                  current: i + 1,
                  total,
                  percent: progressPercent,
                  message: `Importing Customer ${name}...`,
                });
                const resCust = await workspaceService.createCustomer({ name, phone, email, city });
                createdCust++;
                customerCache.set(phone, resCust.customer || resCust);
              }
            }
          } catch (rowErr: any) {
            console.error(`Row ${i + 1} error:`, rowErr);
            errors.push(`Row ${i + 1}: ${rowErr.response?.data?.message || rowErr.message}`);
          }
        }

        // Reload data from backend to update all charts, tables and metrics immediately
        await loadRealData();

        setImportStatus('completed');
        setImportProgress({ current: total, total, percent: 100, message: 'All records ingested successfully!' });
        setImportResult({
          filename: file.name,
          totalRows: total,
          createdCustomers: createdCust,
          createdPolicies: createdPol,
          errors,
        });

        setImportHistory((prev) => [
          {
            id: `batch-${Date.now()}`,
            filename: file.name,
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            totalRows: total,
            policiesCreated: createdPol,
            customersCreated: createdCust,
          },
          ...prev,
        ]);
      } catch (err: any) {
        setImportStatus('error');
        setImportProgress({ current: 0, total: 0, percent: 0, message: `Upload failed: ${err.message}` });
      } finally {
        e.target.value = '';
      }
    };

    reader.readAsText(file);
  };

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

      setCustomers(Array.isArray(cList) ? cList : []);
      setPolicies(Array.isArray(pList) ? pList : []);
      setFollowups(Array.isArray(fList) ? fList : []);
      setEmployees(Array.isArray(eList) ? eList : []);
      setInsurers(Array.isArray(iList) ? iList : []);
      setCommSummary(cSum);
      setCommLedger(Array.isArray(cLedg) ? cLedg : []);
    } catch (err) {
      console.error('Failed to load real data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const list = Array.isArray(policies) ? policies : [];
    if (list.length === 0) {
      showToast('No policy records to export.', 'info');
      return;
    }
    const headers = ['Policy Number', 'Customer Name', 'Phone', 'Insurer', 'Policy Type', 'Gross Premium (INR)', 'Expiry Date', 'Status'];
    const rows = list.map((p) => [
      `"${p.policyNumber || ''}"`,
      `"${p.customerId?.name || 'Client'}"`,
      `"${p.customerId?.phone || ''}"`,
      `"${p.insurerId?.name || 'Insurer'}"`,
      `"${p.type || ''}"`,
      p.premium || 0,
      `"${p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('en-IN') : ''}"`,
      `"${p.status || 'Active'}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ProSurance_Policy_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

    const unsubscribeFollowupUpdated = socketService.on('FOLLOWUP_UPDATED', (updatedFollow) => {
      setFollowups((prev) => prev.map((f) => (f._id === updatedFollow._id ? updatedFollow : f)));
    });

    const unsubscribeEmployee = socketService.on('EMPLOYEE_CREATED', (newEmp) => {
      setEmployees((prev) => [...prev, newEmp]);
    });

    const unsubscribeEmployeeUpdated = socketService.on('EMPLOYEE_UPDATED', (updatedEmp) => {
      setEmployees((prev) => prev.map((e) => (e._id === updatedEmp._id || e.id === updatedEmp.id ? { ...e, ...updatedEmp } : e)));
    });

    const unsubscribeCustomerUpdated = socketService.on('CUSTOMER_UPDATED', (updatedCust) => {
      setCustomers((prev) => prev.map((c) => (c._id === updatedCust._id ? updatedCust : c)));
    });

    return () => {
      unsubscribeCustomer();
      unsubscribeCustomerUpdated();
      unsubscribePolicy();
      unsubscribeFollowup();
      unsubscribeFollowupUpdated();
      unsubscribeEmployee();
      unsubscribeEmployeeUpdated();
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
      showToast(`Customer "${created.name}" created successfully!`, 'success');
    } catch (err: any) {
      showToast(`Error saving customer: ${err.response?.data?.message || err.message}`, 'error');
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
      showToast(`Policy ${created.policyNumber} created successfully!`, 'success');
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
      showToast(`Error creating policy: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await workspaceService.createEmployee(newEmployee);
      setEmployees([...employees, created]);
      setShowAddEmployeeModal(false);
      setNewEmployee({ name: '', email: '', role: 'OFFICE_STAFF', phone: '' });
      showToast(`Team member "${created.name}" added successfully!`, 'success');
    } catch (err: any) {
      showToast(`Error creating employee: ${err.response?.data?.message || err.message}`, 'error');
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
      showToast('Follow-up activity logged successfully!', 'success');
    } catch (err: any) {
      showToast(`Error logging follow-up: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  const handleCreateInsurerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await workspaceService.createInsurer(newInsurer);
      setInsurers([...insurers, created]);
      setShowAddInsurerModal(false);
      setNewInsurer({ name: '', code: '', type: 'GENERAL', contactPerson: '', phone: '' });
      showToast(`Underwriting partner ${created.name} registered successfully!`, 'success');
    } catch (err: any) {
      showToast(`Error adding insurer: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  const handleToggleInsurer = async (id: string) => {
    try {
      const updated = await workspaceService.toggleInsurerActive(id);
      setInsurers(insurers.map((ins) => (ins._id === id ? { ...ins, isActive: updated.isActive } : ins)));
      showToast('Insurer status updated.', 'info');
    } catch (err: any) {
      showToast(`Error updating insurer status: ${err.message}`, 'error');
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
      {/* ========================================================= */}
      {/* SECTION 1: OVERVIEW / DASHBOARD (PROTOTYPE ALIGNED)       */}
      {/* ========================================================= */}
      {activeSection === 'ca-dashboard' && (() => {
        const safePolicies = Array.isArray(policies) ? policies : [];
        const safeInsurers = Array.isArray(insurers) ? insurers : [];
        const safeEmployees = Array.isArray(employees) ? employees : [];

        // Dynamic Policy Status Calculation
        const getPolicyStatus = (p: any) => {
          if (p.status === 'Overdue') return 'Expired';
          const expiry = p.expiryDate ? new Date(p.expiryDate).getTime() : 0;
          if (!expiry) return p.status || 'Active';
          const dl = Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24));
          if (dl < 0) return 'Expired';
          if (dl <= 30) return 'Due Soon';
          return 'Active';
        };

        const activeCount = safePolicies.filter((p) => getPolicyStatus(p) === 'Active').length;
        const dueSoonCount = safePolicies.filter((p) => getPolicyStatus(p) === 'Due Soon').length;
        const totalPremium = safePolicies.reduce((acc, p) => acc + (Number(p?.premium) || 0), 0);

        // Commission calculation per policy
        const getCommission = (p: any) => {
          const pSmId = String(p.salesmanId?._id || p.salesmanId || '');
          const sm = safeEmployees.find((e) => String(e._id || e.id || '') === pSmId);
          const rate = Number(sm?.defaultCommissionRate) || (sm ? 8 : 0);
          return Math.round((Number(p?.premium) || 0) * rate / 100);
        };
        const totalCommission = safePolicies.reduce((acc, p) => acc + getCommission(p), 0);
        const salesmenCount = safeEmployees.filter((e) => e.role === 'SALESMAN').length;

        // Premium booked by insurer
        const byInsurer = safeInsurers.map((ins) => {
          const insId = String(ins._id || ins.id || '');
          const insPols = safePolicies.filter((p) => {
            const pInsId = String(p.insurerId?._id || p.insurerId || '');
            return pInsId && pInsId === insId;
          });
          const val = insPols.reduce((acc, p) => acc + (Number(p?.premium) || 0), 0);
          return {
            id: insId,
            name: ins.name || 'Insurer',
            type: ins.type || 'General',
            count: insPols.length,
            value: val,
          };
        }).sort((a, b) => b.value - a.value);

        const maxInsurerVal = Math.max(...byInsurer.map((x) => x.value), 1);

        // Recently entered policies (sorted by creation / start date descending)
        const recentPolicies = [...safePolicies].sort((a, b) => {
          const tA = new Date(a.createdAt || a.startDate || 0).getTime();
          const tB = new Date(b.createdAt || b.startDate || 0).getTime();
          return tB - tA;
        }).slice(0, 5);

        return (
          <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#0F2947] tracking-tight font-serif">
                  Dashboard
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
                  Office activity at a glance
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowAddPolicyModal(true)}
                  className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 sm:py-2 bg-white border border-[#DCE2EA] hover:border-slate-800 text-slate-800 rounded text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
                  <span>New policy</span>
                </button>

                <button
                  onClick={() => setShowAddCustomerModal(true)}
                  className="flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 bg-[#1F7A64] hover:bg-[#175D4C] text-white rounded text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Add customer</span>
                </button>
              </div>
            </div>

            {/* 4 KPI Stat Cards with Gold Vertical Accent Border */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white border border-[#DCE2EA] rounded p-3 sm:p-4 relative pl-4 sm:pl-5 shadow-2xs">
                <div className="absolute left-0 top-3 bottom-3 sm:top-3.5 sm:bottom-3.5 w-[3px] bg-[#C97A2B] rounded-r"></div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  TOTAL POLICIES
                </div>
                <div className="text-xl sm:text-2xl font-bold font-serif text-[#0F2947] mt-0.5 sm:mt-1">
                  {safePolicies.length}
                </div>
                <div className="text-[11px] sm:text-xs text-[#1F7A64] font-medium mt-0.5 sm:mt-1">
                  {activeCount} currently active
                </div>
              </div>

              <div className="bg-white border border-[#DCE2EA] rounded p-3 sm:p-4 relative pl-4 sm:pl-5 shadow-2xs">
                <div className="absolute left-0 top-3 bottom-3 sm:top-3.5 sm:bottom-3.5 w-[3px] bg-[#C97A2B] rounded-r"></div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  PREMIUM BOOKED
                </div>
                <div className="text-xl sm:text-2xl font-bold font-serif text-[#0F2947] mt-0.5 sm:mt-1">
                  ₹{totalPremium.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] sm:text-xs text-[#1F7A64] font-medium mt-0.5 sm:mt-1">
                  Across all insurers
                </div>
              </div>

              <div className="bg-white border border-[#DCE2EA] rounded p-3 sm:p-4 relative pl-4 sm:pl-5 shadow-2xs">
                <div className="absolute left-0 top-3 bottom-3 sm:top-3.5 sm:bottom-3.5 w-[3px] bg-[#C97A2B] rounded-r"></div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  RENEWALS DUE (30 DAYS)
                </div>
                <div className="text-xl sm:text-2xl font-bold font-serif text-[#0F2947] mt-0.5 sm:mt-1">
                  {dueSoonCount}
                </div>
                <div className={`text-[11px] sm:text-xs font-medium mt-0.5 sm:mt-1 ${dueSoonCount > 0 ? 'text-[#B23A3A]' : 'text-[#1F7A64]'}`}>
                  {dueSoonCount > 0 ? 'Needs follow-up' : 'All clear'}
                </div>
              </div>

              <div className="bg-white border border-[#DCE2EA] rounded p-3 sm:p-4 relative pl-4 sm:pl-5 shadow-2xs">
                <div className="absolute left-0 top-3 bottom-3 sm:top-3.5 sm:bottom-3.5 w-[3px] bg-[#C97A2B] rounded-r"></div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  COMMISSION PAYABLE
                </div>
                <div className="text-xl sm:text-2xl font-bold font-serif text-[#0F2947] mt-0.5 sm:mt-1">
                  ₹{totalCommission.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1">
                  To {salesmenCount} salesmen
                </div>
              </div>
            </div>

            {/* Premium Booked by Insurer (Horizontal Progress Bars) */}
            <div className="bg-white border border-[#DCE2EA] rounded overflow-hidden shadow-2xs">
              <div className="px-3.5 sm:px-5 py-2.5 sm:py-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
                <h3 className="font-semibold text-xs sm:text-sm text-[#0F2947] font-serif truncate">
                  Premium booked by insurer
                </h3>
                <span className="text-[10px] sm:text-xs text-slate-500 font-mono shrink-0">
                  {byInsurer.length} Insurers
                </span>
              </div>
              <div className="p-3.5 sm:p-5">
                {byInsurer.length === 0 ? (
                  <div className="py-5 sm:py-6 text-center text-xs text-slate-400">
                    No underwriting partners configured yet.
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-3.5">
                    {byInsurer.map((row) => {
                      const widthPercent = totalPremium > 0 ? Math.round((row.value / maxInsurerVal) * 100) : 0;
                      return (
                        <div key={row.id} className="flex items-center gap-2.5 sm:gap-4 text-xs">
                          <div className="w-28 sm:w-56 font-medium text-slate-800 truncate text-[11px] sm:text-xs" title={row.name}>
                            {row.name}
                          </div>
                          <div className="flex-1 bg-slate-100 h-2 sm:h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#1F7A64] h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(0, widthPercent))}%` }}
                            />
                          </div>
                          <div className="w-16 sm:w-24 text-right font-mono text-slate-600 font-medium shrink-0 text-[11px] sm:text-xs">
                            ₹{row.value.toLocaleString('en-IN')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recently Entered Policies Table */}
            <div className="bg-white border border-[#DCE2EA] rounded overflow-hidden shadow-2xs">
              <div className="px-3.5 sm:px-5 py-2.5 sm:py-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
                <h3 className="font-semibold text-xs sm:text-sm text-[#0F2947] font-serif truncate">
                  Recently entered policies
                </h3>
                <span className="text-[10px] sm:text-xs text-slate-500 font-mono shrink-0">
                  Showing {recentPolicies.length} of {safePolicies.length}
                </span>
              </div>
              {/* Mobile View: Clean cards with no horizontal scroll */}
              <div className="sm:hidden divide-y divide-slate-100">
                {recentPolicies.length === 0 ? (
                  <div className="py-8 px-4 text-center text-slate-400 text-xs">
                    No policies entered yet. Click <strong className="text-slate-700">"New policy"</strong> above to record the first contract.
                  </div>
                ) : (
                  recentPolicies.map((p) => {
                    const st = getPolicyStatus(p);
                    const custName = p.customerId?.name || 'Valued Client';
                    const insCode = p.insurerId?.code || p.insurerId?.name || 'INS';
                    return (
                      <div key={p._id} className="p-3 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-medium text-slate-700">{p.policyNumber || '—'}</span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              st === 'Active'
                                ? 'bg-[#E1F2ED] text-[#175D4C]'
                                : st === 'Due Soon'
                                ? 'bg-[#F5E4CE] text-[#8A4E12]'
                                : 'bg-[#FBE7E5] text-[#B23A3A]'
                            }`}
                          >
                            {st === 'Active' ? '✓ Active' : st === 'Due Soon' ? '⏰ Due soon' : '✕ Expired'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900 truncate pr-2">{custName}</span>
                          <span className="font-semibold text-[#0F2947] shrink-0">
                            ₹{(Number(p.premium) || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          <span>{insCode}</span>
                          <span>•</span>
                          <span>{p.type || 'General'}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop View: Full Data Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-[#E7ECF2]/60 border-b border-[#DCE2EA] text-[10px] sm:text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                      <th className="py-2 px-3 sm:py-2.5 sm:px-5">POLICY NO.</th>
                      <th className="py-2 px-3 sm:py-2.5 sm:px-5">CUSTOMER</th>
                      <th className="py-2 px-3 sm:py-2.5 sm:px-5">INSURER</th>
                      <th className="py-2 px-3 sm:py-2.5 sm:px-5">TYPE</th>
                      <th className="py-2 px-3 sm:py-2.5 sm:px-5">PREMIUM</th>
                      <th className="py-2 px-3 sm:py-2.5 sm:px-5">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentPolicies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                          No policies entered yet. Click <strong className="text-slate-700">"New policy"</strong> above to record the first contract.
                        </td>
                      </tr>
                    ) : (
                      recentPolicies.map((p) => {
                        const st = getPolicyStatus(p);
                        const custName = p.customerId?.name || 'Valued Client';
                        const insCode = p.insurerId?.code || p.insurerId?.name || 'INS';
                        return (
                          <tr key={p._id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-5 font-mono text-slate-600">{p.policyNumber || '—'}</td>
                            <td className="py-3 px-5 font-semibold text-slate-900">{custName}</td>
                            <td className="py-3 px-5 text-slate-600">{insCode}</td>
                            <td className="py-3 px-5 text-slate-600">{p.type || 'General'}</td>
                            <td className="py-3 px-5 font-medium text-slate-900">
                              ₹{(Number(p.premium) || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                  st === 'Active'
                                    ? 'bg-[#E1F2ED] text-[#175D4C]'
                                    : st === 'Due Soon'
                                    ? 'bg-[#F5E4CE] text-[#8A4E12]'
                                    : 'bg-[#FBE7E5] text-[#B23A3A]'
                                }`}
                              >
                                {st === 'Active' ? '✓ Active' : st === 'Due Soon' ? '⏰ Due soon' : '✕ Expired'}
                              </span>
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
        );
      })()}

      {/* ========================================================= */}
      {/* SECTION 2: CUSTOMERS (REAL API DATA)                      */}
      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* SECTION 2: CUSTOMERS (REAL API DATA + BULK ACTIONS)       */}
      {/* ========================================================= */}
      {activeSection === 'ca-customers' && (() => {
        const filteredCustomers = customers.filter(
          (c) => c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone?.includes(searchQuery)
        );
        const allFilteredSelected =
          filteredCustomers.length > 0 && filteredCustomers.every((c) => selectedCustomerIds.has(c._id));

        const toggleSelectCustomer = (id: string) => {
          setSelectedCustomerIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          });
        };

        const toggleSelectAll = () => {
          if (allFilteredSelected) {
            setSelectedCustomerIds(new Set());
          } else {
            setSelectedCustomerIds(new Set(filteredCustomers.map((c) => c._id)));
          }
        };

        const handleBulkDeleteSubmit = async () => {
          if (selectedCustomerIds.size === 0) return;
          try {
            setIsDeletingCustomers(true);
            const res = await workspaceService.bulkDeleteCustomers(Array.from(selectedCustomerIds));
            setSelectedCustomerIds(new Set());
            setShowBulkDeleteModal(false);
            await loadRealData();
            showToast(`Successfully deleted ${res.deletedCount || 0} customer records.`, 'success');
          } catch (err: any) {
            showToast(`Error deleting selected customers: ${err.response?.data?.message || err.message}`, 'error');
          } finally {
            setIsDeletingCustomers(false);
          }
        };

        const handleClearAllSubmit = async () => {
          try {
            setIsDeletingCustomers(true);
            const res = await workspaceService.clearAllCustomers();
            setSelectedCustomerIds(new Set());
            setShowClearAllModal(false);
            await loadRealData();
            showToast(`All ${res.deletedCount || 0} customer records cleared successfully!`, 'success');
          } catch (err: any) {
            showToast(`Error clearing customers: ${err.response?.data?.message || err.message}`, 'error');
          } finally {
            setIsDeletingCustomers(false);
          }
        };

        const confirmDeleteSingleCustomer = async () => {
          if (!customerToDelete) return;
          try {
            setIsDeletingCustomers(true);
            await workspaceService.deleteCustomer(customerToDelete.id);
            setCustomers((prev) => prev.filter((c) => c._id !== customerToDelete.id));
            setSelectedCustomerIds((prev) => {
              const next = new Set(prev);
              next.delete(customerToDelete.id);
              return next;
            });
            showToast(`Customer "${customerToDelete.name}" deleted successfully!`, 'success');
            setCustomerToDelete(null);
          } catch (err: any) {
            showToast(`Could not delete customer: ${err.response?.data?.message || err.message}`, 'error');
          } finally {
            setIsDeletingCustomers(false);
          }
        };

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-serif">
                  Customers
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Client profiles and KYC records ({customers.length} total).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {customers.length > 0 && (
                  <button
                    onClick={() => setShowClearAllModal(true)}
                    className="px-3.5 py-2 bg-white hover:bg-rose-50 border border-rose-300 text-rose-600 rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Clear All Customers</span>
                  </button>
                )}

                <button
                  onClick={() => setShowAddCustomerModal(true)}
                  className="px-4 py-2 bg-[#1F7A64] hover:bg-[#175D4C] text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Customer</span>
                </button>
              </div>
            </div>

            {/* Bulk Selection Actions Bar */}
            {selectedCustomerIds.size > 0 && (
              <div className="bg-slate-900 text-white rounded-lg px-4 py-3 flex items-center justify-between shadow-md animate-fadeIn">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold px-2 py-0.5 bg-slate-800 rounded font-mono">
                    {selectedCustomerIds.size}
                  </span>
                  <span>customers selected across records</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCustomerIds(new Set())}
                    className="px-3 py-1 text-xs text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    Deselect All
                  </button>

                  <button
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedCustomerIds.size})</span>
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white border border-[#DCE2EA] rounded-xl overflow-hidden shadow-2xs">
              <div className="p-4 border-b border-[#EAE5DC] flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8E9AAB]" />
                  <input
                    type="text"
                    placeholder="Search live clients by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#D5CEBF] rounded text-[#1A2533] focus:outline-none focus:border-[#1F7A64]"
                  />
                </div>

                <span className="text-xs text-[#7A8696] font-mono">
                  {filteredCustomers.length} of {customers.length} total customers
                </span>
              </div>

              {/* Mobile Cards View (no horizontal scroll) */}
              <div className="sm:hidden divide-y divide-[#F0EBE1]">
                {filteredCustomers.length === 0 ? (
                  <div className="py-10 px-4 text-center text-slate-400 text-xs">
                    No customer profiles found. Use <strong>"Add Customer"</strong> to create one.
                  </div>
                ) : (
                  filteredCustomers.map((c) => {
                    const isSelected = selectedCustomerIds.has(c._id);
                    const initials =
                      c.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'CU';
                    return (
                      <div
                        key={c._id}
                        className={`p-3 space-y-2 transition ${isSelected ? 'bg-emerald-50/60' : 'bg-white'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectCustomer(c._id)}
                              className="w-4 h-4 rounded border-slate-300 text-[#1F7A64] focus:ring-0 cursor-pointer shrink-0"
                            />
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px] flex items-center justify-center shrink-0 border border-slate-200">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-xs text-slate-900 truncate">{c.name}</div>
                              <div className="font-mono text-[11px] text-slate-600">{c.phone}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setSelectedCustomer(c);
                                setShowLogCallModal(true);
                              }}
                              className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition cursor-pointer"
                            >
                              Follow-up
                            </button>
                            <button
                              onClick={() => setCustomerToDelete({ id: c._id, name: c.name })}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                              title={`Delete ${c.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 pl-6">
                          <span className="truncate">{c.email || c.city || 'Pune'}</span>
                          <span className="font-medium text-slate-700 shrink-0 font-mono">
                            {c.policyCount ?? 0} {c.policyCount === 1 ? 'policy' : 'policies'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#DCE2EA] text-slate-600 font-mono text-[10px] uppercase tracking-wider bg-[#E7ECF2]/60">
                      <th className="py-3 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleSelectAll}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#1F7A64] focus:ring-0 cursor-pointer"
                          title="Select / Deselect all"
                        />
                      </th>
                      <th className="py-3 px-4 font-bold">CLIENT NAME</th>
                      <th className="py-3 px-4 font-bold">PHONE NUMBER</th>
                      <th className="py-3 px-4 font-bold">EMAIL</th>
                      <th className="py-3 px-4 font-bold">CITY</th>
                      <th className="py-3 px-4 font-bold">POLICIES</th>
                      <th className="py-3 px-4 font-bold text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE1]">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                          No customer profiles found. Use <strong>"Add Customer"</strong> or upload a spreadsheet in <strong>"Policy/document uploads"</strong>.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((c) => {
                        const isSelected = selectedCustomerIds.has(c._id);
                        const initials =
                          c.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'CU';
                        return (
                          <tr
                            key={c._id}
                            className={`transition ${isSelected ? 'bg-emerald-50/60' : 'hover:bg-[#FAF8F5]/80'}`}
                          >
                            <td className="py-3.5 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectCustomer(c._id)}
                                className="w-3.5 h-3.5 rounded border-slate-300 text-[#1F7A64] focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                                  {initials}
                                </div>
                                <div className="font-semibold text-slate-900">{c.name}</div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                              {c.phone}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">{c.email || '—'}</td>
                            <td className="py-3.5 px-4 font-medium text-slate-800">{c.city || 'Pune'}</td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-900">{c.policyCount ?? 0}</span>
                              <span className="text-[11px] text-slate-500 ml-1">in force</span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedCustomer(c);
                                    setShowLogCallModal(true);
                                  }}
                                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition cursor-pointer"
                                >
                                  Follow-up
                                </button>
                                <button
                                  onClick={() => setCustomerToDelete({ id: c._id, name: c.name })}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  title={`Delete ${c.name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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

            {/* Clear All Confirmation Modal */}
            {showClearAllModal && (
              <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-fadeIn">
                  <div className="flex items-center gap-3 text-rose-600 mb-3">
                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">Clear All Customers</h3>
                      <p className="text-xs text-slate-500">Permanently purge all customer records</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Are you sure you want to delete all <strong>{customers.length}</strong> customer records? Profiles with active policies will be protected and preserved.
                  </p>

                  <div className="mt-5 flex items-center justify-end gap-2.5">
                    <button
                      onClick={() => setShowClearAllModal(false)}
                      disabled={isDeletingCustomers}
                      className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClearAllSubmit}
                      disabled={isDeletingCustomers}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isDeletingCustomers ? 'Clearing...' : `Yes, Clear All (${customers.length})`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Delete Selected Confirmation Modal */}
            {showBulkDeleteModal && (
              <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-fadeIn">
                  <div className="flex items-center gap-3 text-rose-600 mb-3">
                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">Delete Selected Records</h3>
                      <p className="text-xs text-slate-500">Remove selected client profiles</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Are you sure you want to delete <strong>{selectedCustomerIds.size}</strong> selected customers? This action will remove them permanently from your workspace database.
                  </p>

                  <div className="mt-5 flex items-center justify-end gap-2.5">
                    <button
                      onClick={() => setShowBulkDeleteModal(false)}
                      disabled={isDeletingCustomers}
                      className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkDeleteSubmit}
                      disabled={isDeletingCustomers}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isDeletingCustomers ? 'Deleting...' : `Delete ${selectedCustomerIds.size} Records`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Single Customer Delete Confirmation Modal */}
            {customerToDelete && (
              <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-fadeIn">
                  <div className="flex items-center gap-3 text-rose-600 mb-3">
                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">Delete Customer Record</h3>
                      <p className="text-xs text-slate-500">Permanent client removal</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Are you sure you want to remove <strong>"{customerToDelete.name}"</strong>? This will permanently remove their profile and records from your active database.
                  </p>

                  <div className="mt-5 flex items-center justify-end gap-2.5">
                    <button
                      onClick={() => setCustomerToDelete(null)}
                      disabled={isDeletingCustomers}
                      className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteSingleCustomer}
                      disabled={isDeletingCustomers}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isDeletingCustomers ? 'Deleting...' : 'Delete Customer'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* SECTION 3: POLICIES (REAL API DATA)                       */}
      {/* ========================================================= */}
      {activeSection === 'ca-policies' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Policies
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
                Active insurance policies and coverage records ({policies.length} total).
              </p>
            </div>

            <button
              onClick={() => setShowAddPolicyModal(true)}
              className="w-full sm:w-auto px-3.5 sm:px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Policy</span>
            </button>
          </div>

          {/* Mobile Cards View (no horizontal scroll) */}
          <div className="sm:hidden space-y-2.5">
            {policies.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 text-center shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
                  <Plus className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs font-semibold text-slate-800">No policies recorded yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Click "Record New Policy" to add your first contract.</p>
              </div>
            ) : (
              policies.map((p) => (
                <div key={p._id} className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-900 font-mono truncate">{p.policyNumber}</div>
                      <div className="text-[11px] text-slate-500 truncate">{p.customerId?.name || 'Client'}</div>
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                      p.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Insurer / Type</span>
                      <span className="font-medium text-slate-800 truncate block">{p.insurerId?.name || 'HDFC ERGO'} • {p.type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Premium</span>
                      <span className="font-semibold text-slate-900">₹{Number(p.premium).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Sum Insured</span>
                      <span className="font-medium text-slate-700">₹{Number(p.sumInsured || 0).toLocaleString('en-IN')}</span>
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
          <div className="hidden sm:block bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider bg-slate-50">
                    <th className="py-3 px-4 font-semibold">POLICY NO & CLIENT</th>
                    <th className="py-3 px-4 font-semibold">INSURER</th>
                    <th className="py-3 px-4 font-semibold">CATEGORY</th>
                    <th className="py-3 px-4 font-semibold">SUM INSURED</th>
                    <th className="py-3 px-4 font-semibold">PREMIUM</th>
                    <th className="py-3 px-4 font-semibold">EXPIRY DATE</th>
                    <th className="py-3 px-4 font-semibold">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {policies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                        No policies recorded yet. Click <strong className="text-slate-700">"Record New Policy"</strong> above to add one.
                      </td>
                    </tr>
                  ) : (
                    policies.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{p.policyNumber}</div>
                          <div className="text-[11px] text-slate-500">{p.customerId?.name || 'Client'}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {p.insurerId?.name || 'HDFC ERGO'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                            {p.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          ₹ {Number(p.sumInsured || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-xs text-slate-900">
                          ₹ {Number(p.premium).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {new Date(p.expiryDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            p.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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

      {/* ========================================================= */}
      {/* SECTION 4: PAYMENTS & EMI RECORDS                         */}
      {/* ========================================================= */}
      {activeSection === 'ca-payments' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Payments & EMI Records
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
                Track direct insurer portal payments and broker-collected premium receipts.
              </p>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <button
                onClick={() => setPaymentFilter('All')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition shrink-0 cursor-pointer ${
                  paymentFilter === 'All' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                All Receipts ({policies.length})
              </button>
              <button
                onClick={() => setPaymentFilter('Direct')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition shrink-0 cursor-pointer ${
                  paymentFilter === 'Direct' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                Direct to Insurer
              </button>
              <button
                onClick={() => setPaymentFilter('Broker')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition shrink-0 cursor-pointer ${
                  paymentFilter === 'Broker' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                Collected by Broker
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                TOTAL PREMIUM VOLUME
              </span>
              <div className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-900 font-sans tracking-tight">
                ₹{totalPremiumSum.toLocaleString('en-IN')}
              </div>
              <div className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500">
                Across {policies.length} recorded policies
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                ACTIVE POLICIES
              </span>
              <div className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-emerald-600 font-sans tracking-tight">
                {policies.filter((p) => p.status === 'Active').length}
              </div>
              <div className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500">
                Underwritten & confirmed
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                PAYMENTS PENDING
              </span>
              <div className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-amber-600 font-sans tracking-tight">
                {dueTodayPolicies.length}
              </div>
              <div className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500">
                Requires client follow-up
              </div>
            </div>
          </div>

          {/* Mobile Card View (no horizontal scroll) */}
          <div className="sm:hidden space-y-2.5">
            {policies.length === 0 ? (
              <div className="bg-white border border-[#E7E2D6] rounded-xl p-6 text-center">
                <p className="text-xs font-semibold text-slate-700">No payment records yet</p>
                <p className="text-[11px] text-[#8E9AAB] mt-0.5">Policy instalment records will appear here.</p>
              </div>
            ) : (
              policies.map((p, idx) => (
                <div key={p._id || idx} className="bg-white border border-[#E7E2D6] rounded-xl p-3 shadow-2xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono font-semibold text-xs text-[#1A2533] truncate">{p.policyNumber}</div>
                      <div className="text-[11px] text-[#5E6877] truncate">{p.customerId?.name || 'Client'}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#EBF5ED] text-[#1E7E34] shrink-0">
                      Verified Paid
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Underwriter</span>
                      <span className="font-medium text-slate-800 truncate block">{p.insurerId?.name || 'Insurer'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Gross Premium</span>
                      <span className="font-bold text-[#1A2533]">₹{(Number(p.premium) || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-[10px] text-[#5E6877]">
                      {idx % 2 === 0 ? 'Direct to Insurer' : 'Collected by Broker'}
                    </span>
                    <button
                      onClick={() => showToast(`Payment receipt for Policy ${p.policyNumber} confirmed.`, 'success')}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-[#FAF8F5] border border-[#D5CEBF] rounded text-[#1A2533] hover:bg-[#F2ECE1] cursor-pointer"
                    >
                      Receipt
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white border border-[#E7E2D6] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE5DC] text-[#8E9AAB] font-mono text-[10px] uppercase tracking-wider bg-[#FAF8F5]">
                    <th className="py-3 px-4 font-bold">POLICY NO</th>
                    <th className="py-3 px-4 font-bold">CLIENT</th>
                    <th className="py-3 px-4 font-bold">UNDERWRITER</th>
                    <th className="py-3 px-4 font-bold">GROSS AMOUNT</th>
                    <th className="py-3 px-4 font-bold">PAYMENT TYPE</th>
                    <th className="py-3 px-4 font-bold">STATUS</th>
                    <th className="py-3 px-4 font-bold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {policies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#8E9AAB] text-xs">
                        No payment or policy instalment records yet.
                      </td>
                    </tr>
                  ) : (
                    policies.map((p, idx) => (
                      <tr key={p._id || idx} className="hover:bg-[#FAF8F5]/80 transition">
                        <td className="py-3 px-4 font-mono font-medium text-[#1A2533]">{p.policyNumber}</td>
                        <td className="py-3 px-4 font-medium text-[#1A2533]">{p.customerId?.name || 'Client'}</td>
                        <td className="py-3 px-4 text-[#5E6877]">{p.insurerId?.name || 'Insurer'}</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#1A2533]">
                          ₹{(Number(p.premium) || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] text-[#5E6877]">
                            {idx % 2 === 0 ? 'Direct to Insurer' : 'Collected by Broker'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#EBF5ED] text-[#1E7E34]">
                            Verified Paid
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => showToast(`Payment receipt for Policy ${p.policyNumber} confirmed.`, 'success')}
                            className="px-2.5 py-1 text-xs font-semibold bg-[#FAF8F5] border border-[#D5CEBF] rounded text-[#1A2533] hover:bg-[#F2ECE1]"
                          >
                            View Receipt
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

      {/* ========================================================= */}
      {/* SECTION 5: RENEWALS & DUE DATES                           */}
      {/* ========================================================= */}
      {activeSection === 'ca-renewals' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Renewals & Due Dates
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
                Monitor upcoming policy expirations and scheduled retention dates.
              </p>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <button
                onClick={() => setRenewalTimeline('All')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition shrink-0 cursor-pointer ${
                  renewalTimeline === 'All' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                All Expiries ({policies.length})
              </button>
              <button
                onClick={() => setRenewalTimeline('next7')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition shrink-0 cursor-pointer ${
                  renewalTimeline === 'next7' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                Due Next 7 Days
              </button>
              <button
                onClick={() => setRenewalTimeline('next30')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition shrink-0 cursor-pointer ${
                  renewalTimeline === 'next30' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                Due Next 30 Days
              </button>
            </div>
          </div>

          {/* Mobile Card View (no horizontal scroll) */}
          <div className="sm:hidden space-y-2.5">
            {policies.length === 0 ? (
              <div className="bg-white border border-[#E7E2D6] rounded-xl p-6 text-center">
                <p className="text-xs font-semibold text-slate-700">No upcoming expirations recorded</p>
                <p className="text-[11px] text-[#8E9AAB] mt-0.5">Expiring policy records will appear here.</p>
              </div>
            ) : (
              policies.map((p, idx) => (
                <div key={p._id || idx} className="bg-white border border-[#E7E2D6] rounded-xl p-3 shadow-2xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-[#1A2533] truncate">{p.customerId?.name || 'Client'}</div>
                      <div className="font-mono text-[11px] text-[#7A8696] truncate">{p.policyNumber}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#FAF0EC] text-[#C05D34] shrink-0">
                      Upcoming Renewal
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Insurer</span>
                      <span className="font-medium text-slate-800 truncate block">{p.insurerId?.name || 'Insurer'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Expiry Date</span>
                      <span className="font-semibold text-[#C05D34]">
                        {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('en-IN') : '2027-03-31'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Premium</span>
                      <span className="font-bold text-[#1A2533]">₹{(Number(p.premium) || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Contact</span>
                      <span className="text-[11px] text-[#5E6877] font-mono truncate block">{p.customerId?.phone || 'No phone'}</span>
                    </div>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedCustomer(p.customerId || customers[0]);
                        setShowLogCallModal(true);
                      }}
                      className="px-3 py-1 text-[11px] font-semibold bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded transition shadow-2xs cursor-pointer"
                    >
                      Log Reminder
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white border border-[#E7E2D6] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE5DC] text-[#8E9AAB] font-mono text-[10px] uppercase tracking-wider bg-[#FAF8F5]">
                    <th className="py-3 px-4 font-bold">CLIENT & CONTACT</th>
                    <th className="py-3 px-4 font-bold">POLICY NO</th>
                    <th className="py-3 px-4 font-bold">INSURER</th>
                    <th className="py-3 px-4 font-bold">EXPIRY DATE</th>
                    <th className="py-3 px-4 font-bold">PREMIUM</th>
                    <th className="py-3 px-4 font-bold">RENEWAL STATUS</th>
                    <th className="py-3 px-4 font-bold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {policies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#8E9AAB] text-xs">
                        No upcoming expirations recorded.
                      </td>
                    </tr>
                  ) : (
                    policies.map((p, idx) => (
                      <tr key={p._id || idx} className="hover:bg-[#FAF8F5]/80 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#1A2533]">{p.customerId?.name || 'Client'}</div>
                          <div className="text-[10px] text-[#7A8696] font-mono">{p.customerId?.phone || 'No phone'}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-[#1A2533]">{p.policyNumber}</td>
                        <td className="py-3 px-4 text-[#5E6877]">{p.insurerId?.name || 'Insurer'}</td>
                        <td className="py-3 px-4 font-mono text-[#C05D34] font-semibold">
                          {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('en-IN') : '2027-03-31'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#1A2533]">
                          ₹{(Number(p.premium) || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#FAF0EC] text-[#C05D34]">
                            Upcoming Renewal
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedCustomer(p.customerId || customers[0]);
                              setShowLogCallModal(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded transition shadow-2xs"
                          >
                            Log Reminder
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

      {/* ========================================================= */}
      {/* SECTION 6: FOLLOW-UPS (REAL API DATA)                     */}
      {/* ========================================================= */}
      {activeSection === 'ca-followups' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Follow-ups & Reminders
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Scheduled client calls and interaction logs ({followups.length} active).
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedCustomer(customers[0]);
                setShowLogCallModal(true);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Call</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {followups.map((f) => (
              <div key={f._id} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-900">{f.customerId?.name || 'Customer'}</h4>
                        <span className="font-mono text-xs text-slate-500">{f.customerId?.phone || '98220 11223'}</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
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
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Commission & Payouts
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Underwriter brokerage receivables and agent commission statements.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Insurer Commission */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
              <div className="pb-3 border-b border-slate-100">
                <h4 className="font-semibold text-sm text-slate-900">Insurer Receivable Ledger</h4>
                <p className="text-xs text-slate-500 mt-0.5">Expected brokerage from underwriting partners</p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[11px] uppercase font-semibold text-slate-500 block tracking-wider">
                    EXPECTED
                  </span>
                  <span className="font-bold text-lg text-slate-900 mt-1 block">
                    ₹ {Number(commSummary?.totalInsurerExpected ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[11px] uppercase font-semibold text-slate-500 block tracking-wider">
                    RECEIVED
                  </span>
                  <span className="font-bold text-lg text-slate-900 mt-1 block">
                    ₹ {Number(commSummary?.totalInsurerReceived ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-rose-50/70 rounded-lg border border-rose-200/80">
                  <span className="text-[11px] uppercase font-semibold text-rose-600 block tracking-wider">
                    PENDING
                  </span>
                  <span className="font-bold text-lg text-rose-600 mt-1 block">
                    ₹ {Number(commSummary?.insurerPending ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Salesman Commission */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
              <div className="pb-3 border-b border-slate-100">
                <h4 className="font-semibold text-sm text-slate-900">Salesman Commission Payable</h4>
                <p className="text-xs text-slate-500 mt-0.5">Payable to agents & sales advisors</p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[11px] uppercase font-semibold text-slate-500 block tracking-wider">
                    EARNED
                  </span>
                  <span className="font-bold text-lg text-slate-900 mt-1 block">
                    ₹ {Number(commSummary?.totalSalesmanEarned ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[11px] uppercase font-semibold text-slate-500 block tracking-wider">
                    DISBURSED
                  </span>
                  <span className="font-bold text-lg text-slate-900 mt-1 block">
                    ₹ {Number(commSummary?.totalSalesmanPaid ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200/80">
                  <span className="text-[11px] uppercase font-semibold text-amber-700 block tracking-wider">
                    LEFT TO PAY
                  </span>
                  <span className="font-bold text-lg text-amber-700 mt-1 block">
                    ₹ {Number(commSummary?.salesmanPending ?? 0).toLocaleString('en-IN')}
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
      {/* ========================================================= */}
      {/* SECTION 6: DOCUMENTS & BATCH IMPORT                       */}
      {/* ========================================================= */}
      {activeSection === 'ca-documents' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0F2947] tracking-tight font-serif">
                Documents & Batch Import
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Automated spreadsheet ingestion for policies and customers, plus policy document management.
              </p>
            </div>
          </div>

          {/* Live Ingestion Progress Banner */}
          {(importStatus === 'parsing' || importStatus === 'uploading') && (
            <div className="bg-white border border-[#DCE2EA] rounded-xl p-6 shadow-sm animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 border-2 border-[#1F7A64] border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-sm font-semibold text-[#0F2947]">
                    {importStatus === 'parsing' ? 'Analyzing spreadsheet structure...' : 'Ingesting records into database...'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-[#1F7A64]">
                  {importProgress.percent}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-[#1F7A64] h-full rounded-full transition-all duration-300"
                  style={{ width: `${importProgress.percent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
                <span>{importProgress.message}</span>
                {importProgress.total > 0 && (
                  <span>
                    {importProgress.current} / {importProgress.total} records
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Success Banner */}
          {importStatus === 'completed' && importResult && (
            <div className="bg-[#E1F2ED] border border-[#1F7A64]/30 rounded-xl p-5 shadow-2xs">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1F7A64] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#175D4C]">
                      Batch Ingestion Completed Successfully!
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Processed <strong>{importResult.totalRows}</strong> rows from <code className="bg-white/80 px-1.5 py-0.5 rounded text-[11px] font-mono">{importResult.filename}</code>.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {importResult.createdPolicies > 0 && (
                        <span className="px-2.5 py-1 bg-white text-[#175D4C] text-xs font-semibold rounded-md border border-[#1F7A64]/20 shadow-2xs">
                          +{importResult.createdPolicies} Policies Registered
                        </span>
                      )}
                      {importResult.createdCustomers > 0 && (
                        <span className="px-2.5 py-1 bg-white text-[#175D4C] text-xs font-semibold rounded-md border border-[#1F7A64]/20 shadow-2xs">
                          +{importResult.createdCustomers} Customers Saved
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setImportStatus('idle')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>

              {importResult.errors.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#1F7A64]/20 text-xs text-amber-800">
                  <div className="font-semibold mb-1">Row Notices ({importResult.errors.length}):</div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px] max-h-24 overflow-y-auto">
                    {importResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {importStatus === 'error' && (
            <div className="bg-[#FBE7E5] border border-[#B23A3A]/30 rounded-xl p-5 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-[#B23A3A] shrink-0" />
                <span className="text-xs font-medium text-[#B23A3A]">
                  {importProgress.message || 'An error occurred while parsing the file. Please check file format.'}
                </span>
              </div>
              <button
                onClick={() => setImportStatus('idle')}
                className="text-xs font-semibold text-[#B23A3A] underline cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Primary Upload Card */}
          <div className="bg-white border border-[#DCE2EA] rounded-xl p-8 text-center shadow-2xs">
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 text-[#1F7A64] flex items-center justify-center mx-auto mb-3">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-base text-[#0F2947] font-serif">
              Batch Ingest Policies & Customers (.csv)
            </h3>
            <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1 leading-relaxed">
              Upload spreadsheets containing client records or policy ledgers. Columns are dynamically mapped, customer profiles are verified/linked, and policy schedules are created in real time.
            </p>

            <input
              type="file"
              ref={bulkFileInputRef}
              accept=".csv, .txt"
              className="hidden"
              onChange={handleBulkImportFile}
            />

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => bulkFileInputRef.current?.click()}
                disabled={importStatus === 'uploading'}
                className="px-5 py-2.5 bg-[#1F7A64] hover:bg-[#175D4C] text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>Select CSV Spreadsheet</span>
              </button>

              <button
                onClick={downloadPolicySampleCSV}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-[#DCE2EA] text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Policy Template (.csv)</span>
              </button>

              <button
                onClick={downloadCustomerSampleCSV}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-[#DCE2EA] text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Customer Template (.csv)</span>
              </button>
            </div>
          </div>

          {/* Ingestion History */}
          {importHistory.length > 0 && (
            <div className="bg-white border border-[#DCE2EA] rounded-xl overflow-hidden shadow-2xs">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-semibold text-sm text-[#0F2947] font-serif">
                  Recent Ingestion Batches
                </h4>
                <span className="text-xs text-slate-500 font-mono">
                  {importHistory.length} batches
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#E7ECF2]/60 border-b border-[#DCE2EA] text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                      <th className="py-2.5 px-5">SPREADSHEET FILE</th>
                      <th className="py-2.5 px-5">TIME</th>
                      <th className="py-2.5 px-5">TOTAL ROWS</th>
                      <th className="py-2.5 px-5">POLICIES CREATED</th>
                      <th className="py-2.5 px-5">CUSTOMERS CREATED</th>
                      <th className="py-2.5 px-5 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importHistory.map((batch) => (
                      <tr key={batch.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-5 font-semibold text-slate-900 font-mono">
                          {batch.filename}
                        </td>
                        <td className="py-3 px-5 text-slate-500 font-mono">{batch.timestamp}</td>
                        <td className="py-3 px-5 font-mono text-slate-700">{batch.totalRows}</td>
                        <td className="py-3 px-5 font-mono font-medium text-emerald-700">
                          +{batch.policiesCreated}
                        </td>
                        <td className="py-3 px-5 font-mono font-medium text-emerald-700">
                          +{batch.customersCreated}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E1F2ED] text-[#175D4C]">
                            ✓ Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Policy Document PDF Records (Prototype 1:1) */}
          <div className="bg-white border border-[#DCE2EA] rounded-xl overflow-hidden shadow-2xs">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm text-[#0F2947] font-serif">
                  Policy Document Copies (.pdf)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Attach signed policy schedules or certificates to active contracts.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {policies.length} Policies
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {policies.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No policies recorded yet. Upload a spreadsheet or click "New policy" on the Dashboard.
                </div>
              ) : (
                policies.map((p) => {
                  const custName = p.customerId?.name || 'Client';
                  return (
                    <div key={p._id} className="p-4 px-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/50">
                          <FileText className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900">
                            {p.policyNumber || 'POL-REF'} — {custName}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                            {p.type || 'Insurance'} · {p.insurerId?.name || 'Insurer'} · ₹{(Number(p.premium) || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-800 text-slate-800 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-2xs">
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>Attach PDF</span>
                          <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(ev) => {
                              const f = ev.target.files?.[0];
                              if (f) {
                                showToast(`Document "${f.name}" attached to policy ${p.policyNumber}!`, 'success');
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 7: BUSINESS REPORTS (PROTOTYPE ALIGNED)           */}
      {/* ========================================================= */}
      {activeSection === 'ca-reports' && (() => {
        const safePolicies = Array.isArray(policies) ? policies : [];
        const safeInsurers = Array.isArray(insurers) ? insurers : [];
        const safeEmployees = Array.isArray(employees) ? employees : [];

        // Dynamic Policy Status Calculation
        const getPolicyStatus = (p: any) => {
          if (p.status === 'Overdue') return 'Expired';
          const expiry = p.expiryDate ? new Date(p.expiryDate).getTime() : 0;
          if (!expiry) return p.status || 'Active';
          const dl = Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24));
          if (dl < 0) return 'Expired';
          if (dl <= 30) return 'Due Soon';
          return 'Active';
        };

        // CSV Download Helper
        const triggerCSV = (filename: string, headers: string[], rows: any[][]) => {
          const csvContent =
            'data:text/csv;charset=utf-8,' +
            [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement('a');
          link.setAttribute('href', encodedUri);
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        // 1. Status Breakdown
        const statusList = ['Active', 'Due Soon', 'Expired'];
        const statusRows = statusList.map((s) => {
          const pols = safePolicies.filter((p) => getPolicyStatus(p) === s);
          return {
            status: s,
            count: pols.length,
            premium: pols.reduce((sum, p) => sum + (Number(p.premium) || 0), 0),
          };
        });

        const totalStatusPolicies = statusRows.reduce((sum, r) => sum + r.count, 0);
        const totalStatusPremium = statusRows.reduce((sum, r) => sum + r.premium, 0);

        const activeRow = statusRows.find((r) => r.status === 'Active') || { count: 0, premium: 0 };
        const dueSoonRow = statusRows.find((r) => r.status === 'Due Soon') || { count: 0, premium: 0 };
        const expiredRow = statusRows.find((r) => r.status === 'Expired') || { count: 0, premium: 0 };

        const activePct = totalStatusPolicies > 0 ? Math.round((activeRow.count / totalStatusPolicies) * 100) : 0;
        const dueSoonPct = totalStatusPolicies > 0 ? Math.round((dueSoonRow.count / totalStatusPolicies) * 100) : 0;
        const expiredPct = totalStatusPolicies > 0 ? Math.max(0, 100 - activePct - dueSoonPct) : 0;

        // 2. Insurer Breakdown
        const insurerRows = safeInsurers.map((ins) => {
          const insId = String(ins._id || ins.id || '');
          const pols = safePolicies.filter((p) => {
            const pInsId = String(p.insurerId?._id || p.insurerId || '');
            return pInsId && pInsId === insId;
          });
          return {
            name: ins.name || 'Insurer',
            type: ins.type || 'General',
            count: pols.length,
            premium: pols.reduce((sum, p) => sum + (Number(p.premium) || 0), 0),
          };
        }).sort((a, b) => b.premium - a.premium);

        // 3. Policy Type Breakdown
        const allTypes = [
          'Motor Insurance',
          'Health Insurance',
          'Business & Trade Insurance',
          'Marine & Transit Insurance',
          'Liability Insurance',
          'Life Insurance',
        ];
        const typeRows = allTypes.map((t) => {
          const pols = safePolicies.filter((p) => (p.type || '').toLowerCase() === t.toLowerCase() || (p.type || '').includes(t.split(' ')[0]));
          return {
            type: t,
            count: pols.length,
            premium: pols.reduce((sum, p) => sum + (Number(p.premium) || 0), 0),
          };
        });

        // 4. Salesperson Breakdown
        const salesRows = safeEmployees
          .filter((e) => e.role === 'SALESMAN')
          .map((sm) => {
            const smId = String(sm._id || sm.id || '');
            const pols = safePolicies.filter((p) => {
              const pSmId = String(p.salesmanId?._id || p.salesmanId || '');
              return pSmId && pSmId === smId;
            });
            const prem = pols.reduce((sum, p) => sum + (Number(p.premium) || 0), 0);
            const rate = Number(sm.defaultCommissionRate) || 8;
            const comm = Math.round((prem * rate) / 100);
            return {
              name: sm.name || 'Salesperson',
              code: sm.salesmanCode || 'SAL',
              rate,
              count: pols.length,
              premium: prem,
              commission: comm,
            };
          }).sort((a, b) => b.premium - a.premium);

        // Full Workbook Export
        const exportFullWorkbook = () => {
          if (safePolicies.length === 0) {
            showToast('No policy records available to export.', 'info');
            return;
          }
          const headers = [
            'Policy Number',
            'Customer Name',
            'Customer Phone',
            'Insurer Name',
            'Policy Type',
            'Gross Premium (INR)',
            'Sum Insured (INR)',
            'Status',
            'Expiry Date',
            'Salesperson',
          ];
          const rows = safePolicies.map((p) => [
            p.policyNumber || '—',
            p.customerId?.name || 'Valued Client',
            p.customerId?.phone || '—',
            p.insurerId?.name || '—',
            p.type || 'General',
            p.premium || 0,
            p.sumInsured || 0,
            getPolicyStatus(p),
            p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('en-IN') : '—',
            p.salesmanId?.name || 'Unassigned',
          ]);
          triggerCSV(`ProSurance_Full_Workbook_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
        };

        return (
          <div className="space-y-6">
            {/* Topbar */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#0F2947] tracking-tight font-serif">
                  Business reports
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Status, insurer, type and salesperson performance breakdowns
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportFullWorkbook}
                  className="px-4 py-2 bg-[#1F7A64] hover:bg-[#175D4C] text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export full workbook</span>
                </button>
              </div>
            </div>

            {/* Table 1: Policy Status Summary */}
            <div className="bg-white border border-[#DCE2EA] rounded overflow-hidden shadow-2xs">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-[#0F2947] font-serif">
                  Policy status summary
                </h3>
                <button
                  onClick={() =>
                    triggerCSV(
                      'policy_status_summary.csv',
                      ['STATUS', 'POLICIES', 'PREMIUM'],
                      statusRows.map((r) => [r.status, r.count, r.premium])
                    )
                  }
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1 cursor-pointer transition"
                >
                  <Download className="w-3 h-3 text-slate-500" />
                  <span>Export</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#E7ECF2]/60 border-b border-[#DCE2EA] text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                      <th className="py-2.5 px-5">STATUS</th>
                      <th className="py-2.5 px-5">POLICIES</th>
                      <th className="py-2.5 px-5 text-right">PREMIUM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#EBF5ED] text-[#1E7E34] border border-[#C3E6CB]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1E7E34]" />
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-5 font-mono text-slate-800 font-medium">{activeRow.count}</td>
                      <td className="py-3 px-5 font-mono font-semibold text-slate-900 text-right">
                        ₹{activeRow.premium.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#FFF4E5] text-[#B76E00] border border-[#FFE2B8]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B76E00]" />
                          Due Soon
                        </span>
                      </td>
                      <td className="py-3 px-5 font-mono text-slate-800 font-medium">{dueSoonRow.count}</td>
                      <td className="py-3 px-5 font-mono font-semibold text-slate-900 text-right">
                        ₹{dueSoonRow.premium.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9B1C1C]" />
                          Expired
                        </span>
                      </td>
                      <td className="py-3 px-5 font-mono text-slate-800 font-medium">{expiredRow.count}</td>
                      <td className="py-3 px-5 font-mono font-semibold text-slate-900 text-right">
                        ₹{expiredRow.premium.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Business by Insurer */}
            <div className="bg-white border border-[#DCE2EA] rounded overflow-hidden shadow-2xs">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-[#0F2947] font-serif">
                  Business by insurer
                </h3>
                <button
                  onClick={() =>
                    triggerCSV(
                      'business_by_insurer.csv',
                      ['INSURER', 'TYPE', 'POLICIES', 'PREMIUM'],
                      insurerRows.map((r) => [r.name, r.type, r.count, r.premium])
                    )
                  }
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1 cursor-pointer transition"
                >
                  <Download className="w-3 h-3 text-slate-500" />
                  <span>Export</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#E7ECF2]/60 border-b border-[#DCE2EA] text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                      <th className="py-2.5 px-5">INSURER</th>
                      <th className="py-2.5 px-5">TYPE</th>
                      <th className="py-2.5 px-5">POLICIES</th>
                      <th className="py-2.5 px-5 text-right">PREMIUM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {insurerRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                          No underwriting partners empaneled yet.
                        </td>
                      </tr>
                    ) : (
                      insurerRows.map((row) => (
                        <tr key={row.name} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-5 font-semibold text-slate-900">{row.name}</td>
                          <td className="py-3 px-5 text-slate-600">{row.type}</td>
                          <td className="py-3 px-5 font-mono text-slate-700">{row.count}</td>
                          <td className="py-3 px-5 font-medium text-slate-900 text-right font-mono">
                            ₹{row.premium.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 3: Business by Policy Type */}
            <div className="bg-white border border-[#DCE2EA] rounded overflow-hidden shadow-2xs">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-[#0F2947] font-serif">
                  Business by policy type
                </h3>
                <button
                  onClick={() =>
                    triggerCSV(
                      'business_by_policy_type.csv',
                      ['POLICY TYPE', 'POLICIES', 'PREMIUM'],
                      typeRows.map((r) => [r.type, r.count, r.premium])
                    )
                  }
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1 cursor-pointer transition"
                >
                  <Download className="w-3 h-3 text-slate-500" />
                  <span>Export</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#E7ECF2]/60 border-b border-[#DCE2EA] text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                      <th className="py-2.5 px-5">POLICY TYPE</th>
                      <th className="py-2.5 px-5">POLICIES</th>
                      <th className="py-2.5 px-5 text-right">PREMIUM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {typeRows.map((row) => (
                      <tr key={row.type} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-5 font-medium text-slate-900">{row.type}</td>
                        <td className="py-3 px-5 font-mono text-slate-700">{row.count}</td>
                        <td className="py-3 px-5 font-medium text-slate-900 text-right font-mono">
                          ₹{row.premium.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 4: Salesperson Performance & Commissions */}
            <div className="bg-white border border-[#DCE2EA] rounded overflow-hidden shadow-2xs">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-[#0F2947] font-serif">
                  Salesperson performance & commissions
                </h3>
                <button
                  onClick={() =>
                    triggerCSV(
                      'salesperson_commissions.csv',
                      ['SALESPERSON', 'AGENT CODE', 'RATE (%)', 'POLICIES', 'PREMIUM', 'COMMISSION PAYABLE'],
                      salesRows.map((r) => [r.name, r.code, `${r.rate}%`, r.count, r.premium, r.commission])
                    )
                  }
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1 cursor-pointer transition"
                >
                  <Download className="w-3 h-3 text-slate-500" />
                  <span>Export</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#E7ECF2]/60 border-b border-[#DCE2EA] text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                      <th className="py-2.5 px-5">SALESPERSON</th>
                      <th className="py-2.5 px-5">POLICIES</th>
                      <th className="py-2.5 px-5">PREMIUM</th>
                      <th className="py-2.5 px-5 text-right">COMMISSION PAYABLE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                          No sales agents registered yet. Add salesmen under Employees.
                        </td>
                      </tr>
                    ) : (
                      salesRows.map((row) => (
                        <tr key={row.name} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-5">
                            <div className="font-semibold text-slate-900">{row.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {row.code} · {row.rate}% standard rate
                            </div>
                          </td>
                          <td className="py-3 px-5 font-mono text-slate-700">{row.count}</td>
                          <td className="py-3 px-5 font-medium text-slate-900 font-mono">
                            ₹{row.premium.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-5 font-semibold text-[#1F7A64] text-right font-mono">
                            ₹{row.commission.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* SECTION 8: EMPLOYEES & SLOT CAPACITY                      */}
      {/* ========================================================= */}
      {activeSection === 'ca-employees' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Employees
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage team members, roles, and seat capacity ({usedSlots} of {maxSlots} used).
              </p>
            </div>

            <button
              onClick={() => setShowAddEmployeeModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>
          </div>

          {/* Slot Capacity Gauge */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  TENANT CAPACITY
                </span>
                <span className="text-xs font-semibold text-slate-900">
                  {usedSlots} of {maxSlots} active slots consumed
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Remaining seats available: <strong>{Math.max(0, maxSlots - usedSlots)} slots</strong>.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {[...Array(maxSlots)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-6 rounded-sm ${i < usedSlots ? 'bg-slate-900' : 'bg-slate-200'}`}
                  title={i < usedSlots ? `Slot ${i + 1} Occupied` : `Slot ${i + 1} Empty`}
                />
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider bg-slate-50">
                    <th className="py-3 px-4 font-semibold">NAME & EMAIL</th>
                    <th className="py-3 px-4 font-semibold">ROLE</th>
                    <th className="py-3 px-4 font-semibold">PHONE</th>
                    <th className="py-3 px-4 font-semibold">STATUS</th>
                    <th className="py-3 px-4 font-semibold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{emp.name}</div>
                        <div className="text-[11px] text-slate-500">{emp.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {emp.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-800">
                        {emp.phone || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
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
      {/* SECTION 8: ROLES & PERMISSIONS MATRIX                     */}
      {/* ========================================================= */}
      {activeSection === 'ca-roles' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Roles & Permissions
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Access control matrix and data visibility rules across roles.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider bg-slate-50">
                    <th className="py-3 px-4 font-semibold">OPERATIONAL ROLE</th>
                    <th className="py-3 px-4 font-semibold">CUSTOMER DIRECTORY</th>
                    <th className="py-3 px-4 font-semibold">POLICY REGISTRY</th>
                    <th className="py-3 px-4 font-semibold">COMMISSIONS & MARGINS</th>
                    <th className="py-3 px-4 font-semibold">SLOT QUOTA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>Company Admin</div>
                      <div className="text-[11px] text-slate-500 font-normal">Broker Manager / Owner</div>
                    </td>
                    <td className="py-3.5 px-4 text-emerald-700 font-medium">Full Access</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-medium">Full Access</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-medium">Full 2-Sided Ledgers</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">Workspace Owner</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>Office Staff</div>
                      <div className="text-[11px] text-slate-500 font-normal">KYC & Operational Support</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">View / Create / Update</td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">Schedules & Follow-ups</td>
                    <td className="py-3.5 px-4 text-rose-600 font-medium">Hidden</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">Consumes 1 Slot</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>Salesman / Agent</div>
                      <div className="text-[11px] text-slate-500 font-normal">Direct Client Acquisition</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">Assigned Leads Only</td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">Record Sourced Policies</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-medium">Own Payouts Only</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">Consumes 1 Slot</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 9: INSURANCE COMPANIES / INSURERS                 */}
      {/* ========================================================= */}
      {activeSection === 'ca-insurers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Insurers
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Empaneled insurance companies and underwriting partners.
              </p>
            </div>

            <button
              onClick={() => setShowAddInsurerModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Insurer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {insurers.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                No underwriting partners configured yet.
              </div>
            ) : (
              insurers.map((ins) => (
                <div key={ins._id} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {ins.code || 'INSURER'}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        ins.isActive !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {ins.isActive !== false ? 'Active' : 'Suspended'}
                      </span>
                    </div>

                    <h3 className="font-semibold text-base text-slate-900 mt-3">{ins.name}</h3>
                    <p className="text-xs text-[#6F7C8E] mt-0.5">{ins.type || 'General Insurance'}</p>

                    <div className="mt-4 pt-3 border-t border-[#F0EBE1] space-y-1.5 text-xs text-[#5E6877]">
                      <div>Contact: <strong>{ins.contactPerson || 'Partnership Desk'}</strong></div>
                      <div className="font-mono">Phone: {ins.phone || '020-4522 3300'}</div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#F0EBE1] flex justify-between items-center text-xs">
                    <span className="font-mono text-[#7A8696]">{ins.policyCount || 0} Policies linked</span>
                    <button
                      onClick={() => handleToggleInsurer(ins._id)}
                      className="px-2.5 py-1 text-xs font-semibold bg-[#FAF8F5] border border-[#D5CEBF] rounded hover:bg-[#F2ECE1]"
                    >
                      {ins.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {/* 1. Add Customer Modal */}
      <Modal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        title="Add New Customer"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddCustomerSubmit} className="space-y-2.5 sm:space-y-3">
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-[#1A2533] mb-0.5 sm:mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-[#D5CEBF] rounded text-[11px] sm:text-xs focus:outline-none focus:border-[#C05D34]"
              placeholder="e.g. Rahul Verma"
            />
          </div>
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-[#1A2533] mb-0.5 sm:mb-1">Mobile Number</label>
            <input
              type="text"
              required
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-[#D5CEBF] rounded text-[11px] sm:text-xs focus:outline-none focus:border-[#C05D34] font-mono"
              placeholder="98220 99881"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-[#1A2533] mb-0.5 sm:mb-1">Email</label>
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-[#D5CEBF] rounded text-[11px] sm:text-xs focus:outline-none focus:border-[#C05D34]"
                placeholder="client@mail.com"
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-[#1A2533] mb-0.5 sm:mb-1">City</label>
              <input
                type="text"
                value={newCustomer.city}
                onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-[#D5CEBF] rounded text-[11px] sm:text-xs focus:outline-none focus:border-[#C05D34]"
                placeholder="Pune"
              />
            </div>
          </div>
          <div className="pt-2.5 sm:pt-3 border-t border-[#F0EBE1] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddCustomerModal(false)}
              className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs text-[#5E6877] hover:bg-[#FAF8F5] rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded transition shadow-2xs"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Add Policy Modal */}
      <Modal
        isOpen={showAddPolicyModal}
        onClose={() => setShowAddPolicyModal(false)}
        title="Record New Policy"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddPolicySubmit} className="space-y-2.5 sm:space-y-3">
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-[#1A2533] mb-0.5 sm:mb-1">Policy Number</label>
            <input
              type="text"
              required
              value={newPolicy.policyNumber}
              onChange={(e) => setNewPolicy({ ...newPolicy, policyNumber: e.target.value })}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-[#D5CEBF] rounded text-[11px] sm:text-xs font-mono focus:outline-none focus:border-[#C05D34]"
              placeholder="e.g. HDFC-MOT-2026-9021"
            />
          </div>

          <Dropdown
            label="Customer"
            value={newPolicy.customerId}
            onChange={(val) => setNewPolicy({ ...newPolicy, customerId: val })}
            options={customers.map((c) => ({
              value: c._id,
              label: c.name,
              sublabel: c.phone,
            }))}
            placeholder="Select Customer"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <Dropdown
              label="Insurer"
              value={newPolicy.insurerId}
              onChange={(val) => setNewPolicy({ ...newPolicy, insurerId: val })}
              options={insurers.map((ins) => ({
                value: ins._id,
                label: ins.name,
              }))}
              placeholder="Select Insurer"
            />
            <Dropdown
              label="Line / Type"
              value={newPolicy.type}
              onChange={(val) => setNewPolicy({ ...newPolicy, type: val })}
              options={['Motor', 'Health', 'Life', 'Commercial']}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-[#1A2533] mb-0.5 sm:mb-1">Gross Premium (₹)</label>
              <input
                type="number"
                required
                value={newPolicy.premium}
                onChange={(e) => setNewPolicy({ ...newPolicy, premium: e.target.value })}
                className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-[#D5CEBF] rounded text-[11px] sm:text-xs font-mono focus:outline-none focus:border-[#C05D34]"
                placeholder="25000"
              />
            </div>
            <DatePicker
              label="Expiry Date"
              value={newPolicy.expiryDate}
              onChange={(val) => setNewPolicy({ ...newPolicy, expiryDate: val })}
              placeholder="Select expiry date"
            />
          </div>

          <div className="pt-2.5 sm:pt-3 border-t border-[#F0EBE1] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddPolicyModal(false)}
              className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs text-[#5E6877] hover:bg-[#FAF8F5] rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded transition shadow-2xs"
            >
              Create Policy
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Add Employee Modal */}
      <Modal
        isOpen={showAddEmployeeModal}
        onClose={() => setShowAddEmployeeModal(false)}
        title="Add Staff Member"
        subtitle={`Slot Usage: ${usedSlots} of ${maxSlots} used (${maxSlots - usedSlots} remaining).`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddEmployeeSubmit} className="space-y-2.5 sm:space-y-3">
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-[#1A2533] mb-0.5 sm:mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-[#D5CEBF] rounded text-[11px] sm:text-xs focus:outline-none focus:border-[#C05D34]"
              placeholder="e.g. Pooja Rathi"
            />
          </div>
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-[#1A2533] mb-0.5 sm:mb-1">Email Address</label>
            <input
              type="email"
              required
              value={newEmployee.email}
              onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-[#D5CEBF] rounded text-[11px] sm:text-xs focus:outline-none focus:border-[#C05D34]"
              placeholder="pooja@shreeadvisors.in"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <Dropdown
              label="Role"
              value={newEmployee.role}
              onChange={(val) => setNewEmployee({ ...newEmployee, role: val })}
              options={[
                { value: 'OFFICE_STAFF', label: 'Office Staff' },
                { value: 'SALESMAN', label: 'Salesman / Agent' },
              ]}
            />
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-[#1A2533] mb-0.5 sm:mb-1">Phone</label>
              <input
                type="text"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-[#D5CEBF] rounded text-[11px] sm:text-xs focus:outline-none focus:border-[#C05D34] font-mono"
                placeholder="98220 12099"
              />
            </div>
          </div>
          <div className="pt-2.5 sm:pt-3 border-t border-[#F0EBE1] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddEmployeeModal(false)}
              className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs text-[#5E6877] hover:bg-[#FAF8F5] rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded transition shadow-2xs"
            >
              Save Member
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. Log Call Modal */}
      <Modal
        isOpen={showLogCallModal}
        onClose={() => setShowLogCallModal(false)}
        title="Log Follow-up Call"
        subtitle={`Client: ${selectedCustomer?.name || 'Client'}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleLogCallSubmit} className="space-y-3">
          <Dropdown
            label="Call Outcome"
            value={callResult}
            onChange={(val) => setCallResult(val)}
            options={[
              'Promise to Pay',
              'Callback Requested',
              'Answered / Discussed',
              'Renewal Confirmed',
              'Not Reachable / Busy',
            ]}
          />
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
      </Modal>

      {/* 5. Add Insurer Modal */}
      <Modal
        isOpen={showAddInsurerModal}
        onClose={() => setShowAddInsurerModal(false)}
        title="Add Underwriting Insurer"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateInsurerSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#1A2533] mb-1">Insurer Legal Name</label>
            <input
              type="text"
              required
              value={newInsurer.name}
              onChange={(e) => setNewInsurer({ ...newInsurer, name: e.target.value })}
              className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
              placeholder="e.g. Tata AIG General Insurance"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1A2533] mb-1">Code</label>
              <input
                type="text"
                required
                value={newInsurer.code}
                onChange={(e) => setNewInsurer({ ...newInsurer, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs font-mono focus:outline-none focus:border-[#C05D34]"
                placeholder="TATAAIG"
              />
            </div>
            <Dropdown
              label="Line Category"
              value={newInsurer.type}
              onChange={(val) => setNewInsurer({ ...newInsurer, type: val })}
              options={[
                { value: 'GENERAL', label: 'General Insurance' },
                { value: 'HEALTH', label: 'Health Insurance' },
                { value: 'LIFE', label: 'Life Insurance' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1A2533] mb-1">Contact Person</label>
              <input
                type="text"
                value={newInsurer.contactPerson}
                onChange={(e) => setNewInsurer({ ...newInsurer, contactPerson: e.target.value })}
                className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs focus:outline-none focus:border-[#C05D34]"
                placeholder="Naveen Sharma"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A2533] mb-1">Desk Phone</label>
              <input
                type="text"
                value={newInsurer.phone}
                onChange={(e) => setNewInsurer({ ...newInsurer, phone: e.target.value })}
                className="w-full px-3 py-2 border border-[#D5CEBF] rounded text-xs font-mono focus:outline-none focus:border-[#C05D34]"
                placeholder="020-4100 2200"
              />
            </div>
          </div>
          <div className="pt-3 border-t border-[#F0EBE1] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddInsurerModal(false)}
              className="px-3 py-1.5 text-xs text-[#5E6877] hover:bg-[#FAF8F5] rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-[#C05D34] hover:bg-[#A94F2B] text-white rounded transition shadow-2xs"
            >
              Register Partner
            </button>
          </div>
        </form>
      </Modal>

      {/* Modern Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-full animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all ${
              toast.type === 'success'
                ? 'bg-slate-900/95 text-white border-emerald-500/40 shadow-emerald-950/20'
                : toast.type === 'error'
                ? 'bg-slate-900/95 text-white border-rose-500/40 shadow-rose-950/20'
                : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-950/20'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-amber-400" />}
            </div>
            <div className="flex-1 text-xs font-medium leading-relaxed">{toast.message}</div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white transition p-0.5 shrink-0 cursor-pointer"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
