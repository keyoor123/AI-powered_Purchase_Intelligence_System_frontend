// src/components/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Bell, Shield, TrendingUp, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Header: React.FC = () => {
  const { currentTab, notifications, clearNotifications, setUploadModalOpen } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSubtitles = () => {
    switch (currentTab) {
      case 'Overview':
        return 'Procurement health, trends, and high-impact actions.';
      case 'Invoices':
        return 'Find, filter, and monitor every invoice record.';
      case 'Products':
        return 'Scan product performance and identify change.';
      case 'Suppliers':
        return 'Locate and compare supplier performance.';
      case 'Savings':
        return 'Rank cost-saving actions by impact and evidence.';
      case 'AI Assistant':
        return 'Conversational analysis with visible sources.';
      case 'Categories':
        return 'Maintain taxonomy with safe destructive actions.';
      case 'Settings':
        return 'Personal identity and workspace settings.';
      default:
        return '';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'price':
        return <TrendingUp size={14} style={{ color: 'var(--warning)' }} />;
      case 'savings':
        return <Shield size={14} style={{ color: 'var(--success)' }} />;
      case 'ready':
        return <CheckCircle size={14} style={{ color: 'var(--info)' }} />;
      case 'failed':
        return <AlertCircle size={14} style={{ color: 'var(--danger)' }} />;
      default:
        return <Info size={14} style={{ color: 'var(--text-muted)' }} />;
    }
  };


  return (
    <header className="header">
      <div className="header-title-area">
        <h1 className="header-title">
          {currentTab === 'Invoices' ? 'All Invoices' : currentTab === 'Overview' ? 'Dashboard' : currentTab}
        </h1>
        <span className="header-subtitle">{getSubtitles()}</span>
      </div>

      <div className="header-actions">
        {/* Notification Bell Dropdown */}
        <div className="notif-widget" ref={dropdownRef}>
          <button 
            className="notif-btn" 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title="Notifications"
          >
            <Bell size={20} />
            {notifications.length > 0 && <span className="notif-badge"></span>}
          </button>

          {dropdownOpen && (
            <div className="notif-dropdown glass-panel">
              <div className="notif-header">
                <h4>Notifications</h4>
                {notifications.length > 0 && (
                  <button className="notif-clear-btn" onClick={clearNotifications}>
                    Clear all
                  </button>
                )}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No new notifications
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <div className="notif-item" key={notif.id}>
                      <div 
                        className="notif-item-icon" 
                        style={{ 
                          backgroundColor: notif.type === 'price' ? 'var(--warning-glow)' : 
                                           notif.type === 'savings' ? 'var(--success-glow)' : 
                                           notif.type === 'ready' ? 'hsla(210, 90%, 55%, 0.1)' : 'var(--danger-glow)'
                        }}
                      >
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="notif-item-body">
                        <span className="notif-item-text">{notif.message}</span>
                        <span className="notif-item-time">
                          {Math.round((Date.now() - notif.timestamp.getTime()) / 60000)}m ago
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Global Upload Invoice button replacing the user profile widget */}
        <button 
          className="btn btn-primary" 
          onClick={() => setUploadModalOpen(true)}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          Upload invoice
        </button>
      </div>
    </header>
  );
};

export default Header;
