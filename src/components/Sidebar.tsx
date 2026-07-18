// src/components/Sidebar.tsx
import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  Users, 
  TrendingUp, 
  Bot, 
  Cpu,
  Tags, 
  Settings, 
  LogOut 
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { currentTab, setCurrentTab } = useApp();
  const { logout, user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const primaryNavItems = [
    { name: 'Overview', icon: LayoutDashboard },
    { name: 'Invoices', icon: FileText },
    { name: 'Products', icon: Package },
    { name: 'Suppliers', icon: Users },
    { name: 'Savings', icon: TrendingUp },
    { name: 'AI Assistant', icon: Bot },
    { name: 'AI Agents', icon: Cpu },
  ];

  const manageNavItems = [
    { name: 'Categories', icon: Tags },
    { name: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">P</div>
        <h2 className="sidebar-title">ProcureIQ</h2>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Purchase Intelligence</div>
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.name;
          return (
            <button
              key={item.name}
              onClick={() => setCurrentTab(item.name)}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </button>
          );
        })}

        <div className="sidebar-section">
          <div className="sidebar-section-title">Management</div>
        </div>
        {manageNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.name;
          return (
            <button
              key={item.name}
              onClick={() => setCurrentTab(item.name)}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-profile">
            <div className="profile-avatar">
              {getInitials(user.display_name)}
            </div>
            <span className="profile-name" title={user.display_name}>
              {user.display_name}
            </span>
          </div>
        )}
        <button className="sidebar-item" onClick={logout} style={{ color: 'var(--danger)' }}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
