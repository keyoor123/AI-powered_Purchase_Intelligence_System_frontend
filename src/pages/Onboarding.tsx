// src/pages/Onboarding.tsx
import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { Shield, ArrowRight, Building, Plus, Trash2, Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { categories, refreshCategories, refreshOrgSettings, addNotification } = useApp();
  const [step, setStep] = useState(1);
  
  // Step 2 values
  const [orgName, setOrgName] = useState('Acme Procurement');
  const [currency, setCurrency] = useState('Indian Rupee (₹)');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [dateFormat, setDateFormat] = useState('10 Apr 2026');

  // Step 3 values (managing categories locally before complete)
  const [customCategory, setCustomCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nextStep = () => {
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSaveOrg = async () => {
    setSubmitting(true);
    try {
      await api.updateOrgSettings({
        org_name: orgName,
        currency,
        timezone,
        date_format: dateFormat
      });
      await refreshOrgSettings();
      nextStep();
    } catch (err) {
      console.error(err);
      alert('Failed to save organization settings. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategory = async () => {
    if (!customCategory.trim()) return;
    try {
      await api.createCategory(customCategory);
      setCustomCategory('');
      await refreshCategories();
    } catch (err) {
      console.error(err);
      alert('Failed to add category.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await api.deleteCategory(id);
      await refreshCategories();
    } catch (err) {
      console.error(err);
      alert('Failed to delete category.');
    }
  };

  const handleComplete = () => {
    addNotification('Welcome to ProcureIQ! Project dashboard initialized.', 'ready');
    onComplete();
  };

  return (
    <div className="onboarding-container">
      {/* Left Panel: High Fidelity Setup Progress */}
      <div className="onboarding-left">
        <div>
          <h2 className="sidebar-title" style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>ProcureIQ / SETUP</h2>
          
          <div className="onboarding-steps">
            <div className={`onboarding-step-item ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="step-num-circle">01</div>
              <div className="step-text">
                <span className="step-title">Welcome</span>
                <span className="step-desc">Begin with outcomes</span>
              </div>
            </div>

            <div className={`onboarding-step-item ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="step-num-circle">02</div>
              <div className="step-text">
                <span className="step-title">Organization</span>
                <span className="step-desc">Set reporting context</span>
              </div>
            </div>

            <div className={`onboarding-step-item ${step === 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
              <div className="step-num-circle">03</div>
              <div className="step-text">
                <span className="step-title">Categories</span>
                <span className="step-desc">Useful purchase taxonomy</span>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card" style={{ background: 'hsla(222, 47%, 4%, 0.5)', borderStyle: 'dashed' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={16} style={{ color: 'var(--primary)' }} />
            ProcureIQ Core Value Engine
          </h3>
          <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <li>Review AI extraction before saving</li>
            <li>Track price changes across suppliers</li>
            <li>Surface savings with traceable evidence</li>
          </ul>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>0{step} / 03</span>
          <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>ONBOARDING · CALM PROGRESS</span>
        </div>
      </div>

      {/* Right Panel: Stepper forms */}
      <div className="onboarding-right animate-fade-in">
        {step === 1 && (
          <div className="animate-slide-up" style={{ maxWidth: '480px' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: '1.2' }}>Welcome to ProcureIQ</h1>
            <p style={{ fontSize: '1.1rem', marginBottom: '2.5rem', color: 'var(--text-secondary)' }}>
              Let's turn your paper invoices and bills into structured, high-impact procurement decisions. We'll set up your workspace in just two minutes.
            </p>
            <button className="btn btn-primary" onClick={nextStep} style={{ width: '100%' }}>
              <span>Begin Setup</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up" style={{ maxWidth: '480px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Organization Setup</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Set currency, dates, and reporting context.
            </p>

            <div className="auth-form" style={{ gap: '1.2rem' }}>
              <div className="form-group">
                <label className="form-label">Organization Name</label>
                <div style={{ position: 'relative' }}>
                  <Building size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '2.75rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
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

              <div className="settings-form-row" style={{ marginBottom: 0 }}>
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

              <button className="btn btn-primary" onClick={handleSaveOrg} disabled={submitting} style={{ marginTop: '1rem' }}>
                <span>Save & Continue</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-slide-up" style={{ maxWidth: '480px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Category Taxonomy</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Categories help organize your products. We've seeded default categories specifically for your items.
            </p>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Create Custom Category</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="e.g. Plumbing, Safety"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="input-field"
                />
                <button type="button" className="btn btn-secondary" onClick={handleAddCategory} style={{ padding: '0.75rem' }}>
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Active Categories</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', padding: '0.25rem' }}>
                {categories.length === 0 ? (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading default categories...</span>
                ) : (
                  categories.map((cat) => (
                    <span 
                      key={cat.id} 
                      className="badge badge-info" 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.4rem', 
                        fontSize: '0.8rem', 
                        textTransform: 'none', 
                        padding: '0.4rem 0.75rem', 
                        borderRadius: '6px' 
                      }}
                    >
                      {cat.name}
                      <button 
                        type="button" 
                        onClick={() => handleDeleteCategory(cat.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={prevStep}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleComplete} style={{ flexGrow: 1 }}>
                <span>Complete Setup</span>
                <Check size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
