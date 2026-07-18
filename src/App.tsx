// src/App.tsx
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AppProvider, useApp } from './context/AppContext.tsx';
import LoginSignup from './pages/LoginSignup.tsx';
import Onboarding from './pages/Onboarding.tsx';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Invoices from './pages/Invoices.tsx';
import Products from './pages/Products.tsx';
import Suppliers from './pages/Suppliers.tsx';
import Savings from './pages/Savings.tsx';
import AiAssistantPage from './pages/AiAssistantPage.tsx';
import CategoriesPage from './pages/CategoriesPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import AiAgentsPage from './pages/AiAgentsPage.tsx';
import UploadModal from './components/UploadModal.tsx';
import { Sparkles } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentTab, uploadModalOpen, setCurrentTab, orgSettings } = useApp();
  const [onboarded, setOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('pulse_onboarded') === 'true';
  });

  const handleOnboardingComplete = () => {
    localStorage.setItem('pulse_onboarded', 'true');
    setOnboarded(true);
  };

  useEffect(() => {
    if (orgSettings?.is_onboarded) {
      localStorage.setItem('pulse_onboarded', 'true');
      setOnboarded(true);
    }
  }, [orgSettings]);

  if (!onboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Render correct page view depending on currentTab context
  const renderPage = () => {
    switch (currentTab) {
      case 'Overview':
        return <Dashboard />;
      case 'Invoices':
        return <Invoices />;
      case 'Products':
        return <Products />;
      case 'Suppliers':
        return <Suppliers />;
      case 'Savings':
        return <Savings />;
      case 'AI Assistant':
        return <AiAssistantPage />;
      case 'Categories':
        return <CategoriesPage />;
      case 'Settings':
        return <SettingsPage />;
      case 'AI Agents':
        return <AiAgentsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="animate-fade-in">
          {renderPage()}
        </main>
      </div>

      {/* Floating Action Button (FAB) for AI Assistant */}
      {currentTab !== 'AI Assistant' && (
        <button 
          className="fab-ai" 
          onClick={() => setCurrentTab('AI Assistant')}
          title="AI Assistant"
        >
          <Sparkles size={24} />
        </button>
      )}

      {uploadModalOpen && <UploadModal />}
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Initializing ProcureIQ Dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginSignup />;
  }

  return <MainLayout />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
