// src/pages/SettingsPage.tsx
import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Building, User, Check, RefreshCw } from 'lucide-react';

type SettingsTab = 'org' | 'profile';

const SettingsPage: React.FC = () => {
  const { 
    orgSettings, 
    profileSettings, 
    updateOrgSettingsState, 
    updateProfileSettingsState,
    addNotification 
  } = useApp();
  const { updateUserDisplayName } = useAuth();
  
  const [activeSubTab, setActiveSubTab] = useState<SettingsTab>('org');
  const [saving, setSaving] = useState(false);

  // Form states initialized with context values or default fallbacks
  const [orgName, setOrgName] = useState(orgSettings?.org_name || 'Acme Procurement');
  const [currency, setCurrency] = useState(orgSettings?.currency || 'Indian Rupee (₹)');
  const [timezone, setTimezone] = useState(orgSettings?.timezone || 'Asia/Kolkata');
  const [dateFormat, setDateFormat] = useState(orgSettings?.date_format || '10 Apr 2026');

  // Profile options
  const [displayName, setDisplayName] = useState(profileSettings?.display_name || 'Aarav Mehta');
  const [email, setEmail] = useState(profileSettings?.email || 'aarav@acme.in');
  const [locale, setLocale] = useState(profileSettings?.locale || 'English (India)');
  const [timeFormat, setTimeFormat] = useState(profileSettings?.time_format || '24-hour');

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateOrgSettings({
        org_name: orgName,
        currency,
        timezone,
        date_format: dateFormat
      });
      updateOrgSettingsState(updated);
      addNotification('Organization settings updated.', 'ready');
    } catch (err) {
      console.error(err);
      alert('Failed to update organization settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateProfileSettings({
        display_name: displayName,
        email,
        locale,
        time_format: timeFormat
      });
      updateProfileSettingsState(updated);
      updateUserDisplayName(displayName);
      addNotification('User profile preferences saved.', 'ready');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-container animate-fade-in">
      {/* Sidebar Nav */}
      <div className="settings-nav">
        <button
          onClick={() => setActiveSubTab('org')}
          className={`settings-nav-btn ${activeSubTab === 'org' ? 'active' : ''}`}
        >
          Organization
        </button>
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`settings-nav-btn ${activeSubTab === 'profile' ? 'active' : ''}`}
        >
          Profile
        </button>
      </div>

      {/* Content Form */}
      <div className="settings-content-area">
        {activeSubTab === 'org' && (
          <form onSubmit={handleSaveOrg} className="premium-card animate-slide-up">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={18} style={{ color: 'var(--primary)' }} />
              Organization Settings
            </h3>
            
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Default Currency</label>
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)} 
                className="input-field"
              >
                <option value="Indian Rupee (₹)">Indian Rupee (₹)</option>
                <option value="US Dollar ($)">US Dollar ($)</option>
                <option value="Euro (€)">Euro (€)</option>
                <option value="British Pound (£)">British Pound (£)</option>
              </select>
            </div>

            <div className="settings-form-row">
              <div className="form-group">
                <label className="form-label">Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date Format</label>
                <input
                  type="text"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
              <span>Save changes</span>
            </button>
          </form>
        )}

        {activeSubTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="premium-card animate-slide-up">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} style={{ color: 'var(--primary)' }} />
              User Profile Preferences
            </h3>

            <div className="settings-form-row">
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="settings-form-row">
              <div className="form-group">
                <label className="form-label">Locale</label>
                <select 
                  value={locale} 
                  onChange={(e) => setLocale(e.target.value)} 
                  className="input-field"
                >
                  <option value="English (India)">English (India)</option>
                  <option value="English (US)">English (US)</option>
                  <option value="English (UK)">English (UK)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Time Format</label>
                <select 
                  value={timeFormat} 
                  onChange={(e) => setTimeFormat(e.target.value)} 
                  className="input-field"
                >
                  <option value="12-hour">12-hour (AM/PM)</option>
                  <option value="24-hour">24-hour</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
              <span>Save changes</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
