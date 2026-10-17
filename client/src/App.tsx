import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { SuperAdminPanel } from './components/panels/SuperAdminPanel';
import { CompanyAdminPanel } from './components/panels/CompanyAdminPanel';
import { OfficeStaffPanel } from './components/panels/OfficeStaffPanel';
import { SalesmanPanel } from './components/panels/SalesmanPanel';

const WorkspaceShell: React.FC = () => {
  const { user } = useAuth();
  const [currentSection, setCurrentSection] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    if (user.role === 'SUPER_ADMIN') setCurrentSection('sa-overview');
    else if (user.role === 'COMPANY_ADMIN') setCurrentSection('ca-dashboard');
    else if (user.role === 'OFFICE_STAFF') setCurrentSection('os-today');
    else if (user.role === 'SALESMAN') setCurrentSection('sm-dashboard');
  }, [user?.role]);

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] flex font-sans">
      {/* Fixed Left Sidebar (245px) */}
      <Sidebar currentSection={currentSection} onSelectSection={setCurrentSection} />

      {/* Main Content Viewport */}
      <div className="flex-1 ml-[245px] flex flex-col min-h-screen">
        <main className="flex-1 px-8 py-4 max-w-[1340px] w-full mx-auto">
          {/* Top subtle bar: Ledger Warm indicator & Search box */}
          <Header />

          {/* Role specific view */}
          {user.role === 'SUPER_ADMIN' && <SuperAdminPanel currentSection={currentSection} />}
          {user.role === 'COMPANY_ADMIN' && <CompanyAdminPanel currentSection={currentSection} />}
          {user.role === 'OFFICE_STAFF' && <OfficeStaffPanel currentSection={currentSection} />}
          {user.role === 'SALESMAN' && <SalesmanPanel currentSection={currentSection} />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceShell />
    </AuthProvider>
  );
}
