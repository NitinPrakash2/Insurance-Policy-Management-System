import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { LandingPage } from './components/landing/LandingPage';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { SuperAdminPanel } from './components/panels/SuperAdminPanel';
import { CompanyAdminPanel } from './components/panels/CompanyAdminPanel';
import { OfficeStaffPanel } from './components/panels/OfficeStaffPanel';
import { SalesmanPanel } from './components/panels/SalesmanPanel';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NotificationProvider } from './context/NotificationContext';

const WorkspaceShell: React.FC = () => {
  const { user, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 1. Persist viewMode ('landing' vs 'login') across browser refreshes
  const [viewMode, setViewModeState] = useState<'landing' | 'login'>(() => {
    const saved = localStorage.getItem('viewMode');
    if (saved === 'login' || saved === 'landing') return saved;
    return 'landing';
  });

  const setViewMode = (mode: 'landing' | 'login') => {
    setViewModeState(mode);
    localStorage.setItem('viewMode', mode);
  };

  const [initialLoginRole, setInitialLoginRole] = useState<'COMPANY_ADMIN' | 'OFFICE_STAFF' | 'SALESMAN' | 'SUPER_ADMIN' | undefined>(() => {
    const saved = localStorage.getItem('initialLoginRole');
    if (saved) return saved as any;
    return undefined;
  });

  const handleRoleSelectForLogin = (role: 'COMPANY_ADMIN' | 'OFFICE_STAFF' | 'SALESMAN' | 'SUPER_ADMIN') => {
    setInitialLoginRole(role);
    localStorage.setItem('initialLoginRole', role);
    setViewMode('login');
  };

  // 2. Persist currentSection across browser refreshes
  const [currentSection, setCurrentSectionState] = useState<string>(() => {
    return localStorage.getItem('currentSection') || '';
  });

  const handleSelectSection = (section: string) => {
    setCurrentSectionState(section);
    localStorage.setItem('currentSection', section);
  };

  // Synchronize section when user or role changes, preserving the user's current section if valid
  useEffect(() => {
    if (!user) return;
    const savedSection = localStorage.getItem('currentSection');

    // If existing saved section belongs to this user's role, KEEP IT!
    if (savedSection) {
      if (user.role === 'SUPER_ADMIN' && savedSection.startsWith('sa-')) {
        setCurrentSectionState(savedSection);
        return;
      }
      if (user.role === 'COMPANY_ADMIN' && savedSection.startsWith('ca-')) {
        setCurrentSectionState(savedSection);
        return;
      }
      if (user.role === 'OFFICE_STAFF' && savedSection.startsWith('os-')) {
        setCurrentSectionState(savedSection);
        return;
      }
      if (user.role === 'SALESMAN' && savedSection.startsWith('sm-')) {
        setCurrentSectionState(savedSection);
        return;
      }
    }

    // Default fallback section for this role
    let defaultSec = 'ca-dashboard';
    if (user.role === 'SUPER_ADMIN') defaultSec = 'sa-overview';
    else if (user.role === 'COMPANY_ADMIN') defaultSec = 'ca-dashboard';
    else if (user.role === 'OFFICE_STAFF') defaultSec = 'os-today';
    else if (user.role === 'SALESMAN') defaultSec = 'sm-dashboard';

    setCurrentSectionState(defaultSec);
    localStorage.setItem('currentSection', defaultSec);
  }, [user?.role]);

  // While restoring session from server, show a clean loader instead of flashing LandingPage
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C05D34] text-white flex items-center justify-center shadow-xs animate-pulse">
            <span className="font-serif font-bold text-lg">P</span>
          </div>
          <div className="text-xs font-semibold text-[#7A8696] tracking-wider uppercase">Loading Workspace...</div>
        </div>
      </div>
    );
  }

  // Unauthenticated view (Landing Page vs Login Page)
  if (!user) {
    if (viewMode === 'landing') {
      return (
        <LandingPage
          onLaunchApp={() => setViewMode('login')}
          onQuickRoleLogin={handleRoleSelectForLogin}
        />
      );
    }
    return (
      <LoginPage
        initialRole={initialLoginRole}
        onBackToLanding={() => setViewMode('landing')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] flex font-sans">
      {/* Responsive Sidebar (Slide-out drawer on mobile, fixed on desktop) */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={handleSelectSection}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Viewport (Zero margin on mobile, 260px on desktop) */}
      <div className="flex-1 ml-0 lg:ml-[260px] flex flex-col min-h-screen w-full overflow-x-hidden">
        <main className="flex-1 px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-5 max-w-[1340px] w-full mx-auto">
          {/* Top Header with Mobile Hamburger Menu Trigger */}
          <Header onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />

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
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <WorkspaceShell />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
