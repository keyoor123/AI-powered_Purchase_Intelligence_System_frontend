// src/context/AppContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, Category, OrganizationSettings, ProfileSettings } from '../services/api.ts';
import { useAuth } from './AuthContext.tsx';

interface AppContextType {
  categories: Category[];
  orgSettings: OrganizationSettings | null;
  profileSettings: ProfileSettings | null;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  uploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;
  refreshCategories: () => Promise<void>;
  refreshOrgSettings: () => Promise<void>;
  updateOrgSettingsState: (settings: OrganizationSettings) => void;
  refreshProfileSettings: () => Promise<void>;
  updateProfileSettingsState: (settings: ProfileSettings) => void;
  notifications: AppNotification[];
  addNotification: (message: string, type: AppNotification['type']) => void;
  clearNotifications: () => void;
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'price' | 'savings' | 'ready' | 'failed' | 'info';
  timestamp: Date;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings | null>(null);
  const [profileSettings, setProfileSettings] = useState<ProfileSettings | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('Overview');
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const refreshCategories = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const refreshOrgSettings = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getOrgSettings();
      setOrgSettings(data);
    } catch (err) {
      console.error('Failed to fetch organization settings:', err);
    }
  };

  const refreshProfileSettings = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getProfileSettings();
      setProfileSettings(data);
    } catch (err) {
      console.error('Failed to fetch profile settings:', err);
    }
  };

  const updateOrgSettingsState = (settings: OrganizationSettings) => {
    setOrgSettings(settings);
  };

  const updateProfileSettingsState = (settings: ProfileSettings) => {
    setProfileSettings(settings);
  };

  const addNotification = (message: string, type: AppNotification['type']) => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const fetchDynamicAlerts = async () => {
    try {
      const [insightsData, savingsData, dealersData] = await Promise.all([
        api.getInsights(),
        api.getSavingsOpportunities(),
        api.getDealers(),
      ]);

      const newAlerts: AppNotification[] = [];

      // 1. Price Spike alerts (MoM)
      if (insightsData && insightsData.rising_prices) {
        insightsData.rising_prices.slice(0, 3).forEach((item, idx) => {
          newAlerts.push({
            id: `p-${idx}-${Date.now()}`,
            message: `${item.product_name} average price rose ${item.value}% MoM.`,
            type: 'price',
            timestamp: new Date()
          });
        });
      }

      // 2. Savings Opportunities alerts
      if (savingsData && savingsData.opportunities) {
        savingsData.opportunities.slice(0, 2).forEach((item, idx) => {
          newAlerts.push({
            id: `s-${idx}-${Date.now()}`,
            message: `Save ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.potential_savings)}/mo by switching ${item.product_name.split(' ')[0]} to ${item.cheapest_dealer.split(' ')[0]}.`,
            type: 'savings',
            timestamp: new Date(Date.now() - 30 * 60 * 1000)
          });
        });
      }

      // 3. Supplier Risk / Concentration Alerts
      if (dealersData && dealersData.length > 0) {
        const totalSpend = dealersData.reduce((sum, d) => sum + d.total_purchase_amount, 0);
        if (totalSpend > 0) {
          dealersData.forEach((dealer, idx) => {
            const ratio = dealer.total_purchase_amount / totalSpend;
            if (ratio > 0.3) {
              newAlerts.push({
                id: `r-${idx}-${Date.now()}`,
                message: `Risk Alert: ${dealer.dealer_name} accounts for ${Math.round(ratio * 100)}% of total spend.`,
                type: 'failed',
                timestamp: new Date(Date.now() - 60 * 60 * 1000)
              });
            }
          });
        }
      }

      setNotifications(newAlerts);
    } catch (err) {
      console.error('Failed to load dynamic notifications:', err);
    }
  };

  // Automatically fetch profile-related items when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshCategories();
      refreshOrgSettings();
      refreshProfileSettings();
      fetchDynamicAlerts();
    } else {
      setCategories([]);
      setOrgSettings(null);
      setProfileSettings(null);
      setNotifications([]);
    }
  }, [isAuthenticated]);

  return (
    <AppContext.Provider
      value={{
        categories,
        orgSettings,
        profileSettings,
        currentTab,
        setCurrentTab,
        uploadModalOpen,
        setUploadModalOpen,
        refreshCategories,
        refreshOrgSettings,
        updateOrgSettingsState,
        refreshProfileSettings,
        updateProfileSettingsState,
        notifications,
        addNotification,
        clearNotifications
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
