import { api } from './api';

export const workspaceService = {
  // Customers
  async getCustomers(search?: string) {
    const res = await api.get('/customers', { params: { search } });
    return res.data;
  },

  async createCustomer(data: { name: string; phone: string; email?: string; city?: string; address?: string }) {
    const res = await api.post('/customers', data);
    return res.data;
  },

  // Policies
  async getPolicies(filters?: { search?: string; status?: string; insurerId?: string; salesmanId?: string }) {
    const res = await api.get('/policies', { params: filters });
    return res.data;
  },

  async createPolicy(data: {
    policyNumber: string;
    customerId: string;
    insurerId: string;
    salesmanId: string;
    type: string;
    sumInsured: number;
    premium: number;
    startDate: string;
    expiryDate: string;
    vehicleNumber?: string;
  }) {
    const res = await api.post('/policies', data);
    return res.data;
  },

  async markInstalmentPaid(instalmentId: string, data?: { paymentMode?: string; transactionReference?: string }) {
    const res = await api.patch(`/instalments/${instalmentId}/mark-paid`, data || { paymentMode: 'Online' });
    return res.data;
  },

  // Follow-ups
  async getFollowups() {
    const res = await api.get('/followups');
    return res.data;
  },

  async createFollowup(data: {
    customerId: string;
    policyId?: string;
    channel?: string;
    result?: string;
    notes: string;
    nextFollowUpDate?: string;
  }) {
    const res = await api.post('/followups', data);
    return res.data;
  },

  async completeFollowup(id: string) {
    const res = await api.patch(`/followups/${id}/complete`);
    return res.data;
  },

  // Commissions
  async getCommissionSummary() {
    const res = await api.get('/commissions/summary');
    return res.data;
  },

  async getCommissionLedger() {
    const res = await api.get('/commissions/ledger');
    return res.data;
  },

  // Employees
  async getEmployees() {
    const res = await api.get('/employees');
    return res.data;
  },

  async createEmployee(data: {
    name: string;
    email: string;
    password?: string;
    role: string;
    phone?: string;
    defaultCommissionRate?: number;
  }) {
    const res = await api.post('/employees', {
      ...data,
      password: data.password || 'Password@123',
    });
    return res.data;
  },

  async toggleEmployeeStatus(id: string) {
    const res = await api.patch(`/employees/${id}/toggle-status`);
    return res.data;
  },

  // Companies (Super Admin)
  async getPlatformOverview() {
    const res = await api.get('/companies/platform-overview');
    return res.data;
  },

  async getCompanies() {
    const res = await api.get('/companies');
    return res.data;
  },

  async createCompany(data: {
    name: string;
    slug: string;
    maxSlots: number;
    adminName: string;
    adminEmail: string;
    address?: string;
    phone?: string;
  }) {
    const res = await api.post('/companies', data);
    return res.data;
  },

  async toggleCompanyStatus(id: string) {
    const res = await api.patch(`/companies/${id}/status`);
    return res.data;
  },

  async updateCompanySlots(id: string, maxSlots: number) {
    const res = await api.patch(`/companies/${id}/slots`, { maxSlots });
    return res.data;
  },

  // Insurers
  async getInsurers() {
    const res = await api.get('/insurers');
    return res.data;
  },

  // Audit Logs
  async getAuditLogs() {
    const res = await api.get('/audit-logs');
    return res.data;
  },

  // Reports
  async getReports() {
    const res = await api.get('/reports/dashboard');
    return res.data;
  },
};
