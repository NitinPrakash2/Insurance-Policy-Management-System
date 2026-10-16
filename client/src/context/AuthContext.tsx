import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Company, UserRole } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  quickLoginAs: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Real seed account credentials corresponding to each role in database
const ROLE_ACCOUNTS: Record<UserRole, { email: string; pass: string }> = {
  SUPER_ADMIN: { email: 'superadmin@prosurance.com', pass: 'Password@123' },
  COMPANY_ADMIN: { email: 'anjali@shreeadvisors.in', pass: 'Password@123' },
  OFFICE_STAFF: { email: 'staff@shreeadvisors.in', pass: 'Password@123' },
  SALESMAN: { email: 'amit@shreeadvisors.in', pass: 'Password@123' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and connect WebSocket on session load
  useEffect(() => {
    const initSession = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      const savedCompany = localStorage.getItem('company');

      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          const parsedCompany = savedCompany ? JSON.parse(savedCompany) : null;
          setUser(parsedUser);
          setCompany(parsedCompany);

          // Connect real-time socket
          socketService.connect();
          if (parsedCompany?._id) {
            socketService.joinWorkspace(parsedCompany._id);
          }
        } catch (e) {
          console.error('Failed to parse cached session', e);
        }
      } else {
        // Automatically login as Company Admin on fresh start
        await quickLoginAs('COMPANY_ADMIN');
      }
      setLoading(false);
    };

    initSession();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.post('/auth/login', { email, password: pass });
    const { accessToken, user, company } = res.data;

    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    if (company) localStorage.setItem('company', JSON.stringify(company));

    setUser(user);
    setCompany(company);

    // Connect and join real-time room
    socketService.connect();
    if (company?._id) {
      socketService.joinWorkspace(company._id);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    socketService.disconnect();
    setUser(null);
    setCompany(null);
  };

  const quickLoginAs = async (role: UserRole) => {
    const account = ROLE_ACCOUNTS[role];
    try {
      await login(account.email, account.pass);
    } catch (err) {
      console.error('API login failed for', account.email, err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, company, loading, login, logout, quickLoginAs }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
