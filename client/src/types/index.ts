export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'OFFICE_STAFF' | 'SALESMAN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  salesmanCode?: string;
  defaultCommissionRate?: number;
  permissions?: string[];
  companyId?: string;
}

export interface Company {
  _id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  maxSlots: number;
  address?: string;
  phone?: string;
  email?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
}

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  dob?: string;
  address?: string;
  policyCount?: number;
}

export interface Insurer {
  _id: string;
  name: string;
  code: string;
  type: 'General' | 'Life' | 'Health';
  contactPerson?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  policyCount?: number;
}

export interface Policy {
  _id: string;
  policyNumber: string;
  customerId: Customer | any;
  insurerId: Insurer | any;
  salesmanId: User | any;
  type: string;
  sumInsured: number;
  premium: number;
  startDate: string;
  expiryDate: string;
  paymentFrequency: string;
  status: 'Active' | 'Due Soon' | 'Expired' | 'Lapsed' | 'Cancelled';
  computedStatus?: string;
  daysRemaining?: number;
  vehicleNumber?: string;
  hasDocument: boolean;
  documentFileName?: string;
}

export interface Instalment {
  _id: string;
  policyId: any;
  instalmentNumber: number;
  totalInstalments: number;
  dueDate: string;
  graceEndDate?: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Overdue';
  paymentMode?: string;
  paidDate?: string;
  transactionReference?: string;
  notes?: string;
}

export interface Commission {
  _id: string;
  policyId: any;
  salesmanId: any;
  insurerCommissionRate?: number;
  insurerExpectedAmount?: number;
  insurerReceivedAmount?: number;
  insurerReceivedDate?: string;
  insurerReference?: string;
  salesmanCommissionRate: number;
  salesmanEarnedAmount: number;
  salesmanPaidAmount: number;
  salesmanPaidDate?: string;
  salesmanReference?: string;
  status: 'Unpaid' | 'Partial' | 'Settled';
  notes?: string;
}
