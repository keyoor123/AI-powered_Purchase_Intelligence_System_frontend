// src/pages/AiAgentsPage.tsx
import React, { useState, useEffect } from 'react';
import { api, AgentSettings, AgentExecutionLog } from '../services/api.ts';
import { useApp } from '../context/AppContext.tsx';
import { 
  Cpu, 
  Plus, 
  Trash2, 
  Download, 
  Check, 
  Mail, 
  Calendar, 
  Info,
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

const AiAgentsPage: React.FC = () => {
  const { addNotification } = useApp();

  // Settings states
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  
  // Day of Month & enabled form states
  const [dayOfMonth, setDayOfMonth] = useState<number>(2);
  const [agentEnabled, setAgentEnabled] = useState<boolean>(true);

  // Email input state
  const [newEmail, setNewEmail] = useState<string>('');
  const [emailLoading, setEmailLoading] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Custom alert/confirm dialog state
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isConfirm: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isConfirm: false,
    onConfirm: () => {}
  });

  const showAlertDialog = (title: string, message: string) => {
    setDialog({
      isOpen: true,
      title,
      message,
      isConfirm: false,
      onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
    });
  };

  const showConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
    setDialog({
      isOpen: true,
      title,
      message,
      isConfirm: true,
      onConfirm: () => {
        onConfirm();
        setDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };


  // Logs states
  const [logs, setLogs] = useState<AgentExecutionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(true);

  // Fetch Agent Settings
  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const data = await api.getAgentSettings();
      setSettings(data);
      setDayOfMonth(data.schedule_config?.day_of_month || 2);
      setAgentEnabled(data.is_enabled);
    } catch (err) {
      console.error('Failed to load agent settings:', err);
      addNotification('Could not load AI Agent settings.', 'failed');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Fetch Execution Logs
  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const data = await api.getAgentLogs();
      // Sort logs descending by run date (latest first)
      const sortedLogs = data.sort((a, b) => 
        new Date(b.run_at).getTime() - new Date(a.run_at).getTime()
      );
      setLogs(sortedLogs);
    } catch (err) {
      console.error('Failed to load agent execution logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  // Update Scheduler settings (enabled & day of month)
  const saveSchedulerSettings = async (enabled: boolean, day: number) => {
    try {
      setSavingSettings(true);
      const updated = await api.updateAgentSettings({
        is_enabled: enabled,
        day_of_month: day
      });
      setSettings(updated);
      setAgentEnabled(updated.is_enabled);
      setDayOfMonth(updated.schedule_config?.day_of_month || 2);
      addNotification('AI Agent scheduler settings updated successfully.', 'ready');
    } catch (err: any) {
      console.error(err);
      showAlertDialog('Update Failed', err.message || 'Failed to update scheduler settings');
      if (settings) {
        setAgentEnabled(settings.is_enabled);
        setDayOfMonth(settings.schedule_config?.day_of_month || 2);
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSchedulerSettings(agentEnabled, dayOfMonth);
  };

  // Add Recipient Email
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setEmailError(null);
    try {
      setEmailLoading(true);
      const updated = await api.addAgentRecipient(newEmail.trim());
      setSettings(updated);
      setNewEmail('');
      addNotification('Email recipient added successfully.', 'ready');
    } catch (err: any) {
      console.error(err);
      setEmailError(err.message || 'Failed to add recipient');
    } finally {
      setEmailLoading(false);
    }
  };

  // Toggle Email Recipient Delivery
  const handleToggleEmail = async (email: string, currentStatus: boolean) => {
    try {
      const updated = await api.toggleAgentRecipient(email, !currentStatus);
      setSettings(updated);
      addNotification(`Delivery state updated for ${email}.`, 'ready');
    } catch (err: any) {
      console.error(err);
      showAlertDialog('Toggle Failed', err.message || 'Failed to toggle delivery status');
    }
  };

  // Remove Recipient Email
  const handleRemoveEmail = (email: string) => {
    showConfirmDialog(
      'Remove Recipient',
      `Are you sure you want to remove ${email} from the distribution list?`,
      async () => {
        try {
          const updated = await api.removeAgentRecipient(email);
          setSettings(updated);
          addNotification('Email recipient removed.', 'ready');
        } catch (err: any) {
          console.error(err);
          showAlertDialog('Removal Failed', err.message || 'Failed to remove recipient');
        }
      }
    );
  };


  // Download PDF file
  const handleDownloadReport = async (fileId: string, runDateStr: string) => {
    try {
      const date = new Date(runDateStr);
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const filename = `ProcureIQ_Monthly_Report_${formattedDate}.pdf`;
      await api.downloadAgentReport(fileId, filename);
      addNotification('PDF Report downloaded successfully.', 'ready');
    } catch (err: any) {
      console.error(err);
      showAlertDialog('Download Failed', err.message || 'Failed to download PDF report. The report might have been archived or replaced by a newer version.');
    }
  };

  // Format UTC dates nicely
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Limit checks (max 5 emails total including primary)
  const deliveryEmails = settings?.delivery_emails || [];
  const maxEmailsLimit = 5;
  const isLimitReached = deliveryEmails.length >= maxEmailsLimit;

  return (
    <div className="agents-page-container animate-fade-in" style={{ paddingBottom: '3rem' }}>
      

      {/* Hero Header Section */}
      <div className="agent-hero-banner premium-card" style={{ 
        background: 'linear-gradient(135deg, hsl(222, 47%, 12%) 0%, hsl(221, 83%, 4%) 100%)',
        color: '#ffffff',
        marginBottom: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div className="agent-hero-layout" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="agent-hero-icon" style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(46, 124, 240, 0.3)'
          }}>
            <Cpu size={32} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ color: '#ffffff', marginBottom: '0.25rem', fontSize: '1.8rem' }}>AI Agents Hub</h1>
            <p style={{ color: 'var(--sidebar-text-secondary)', fontSize: '0.95rem' }}>
              Deploy and manage autonomous AI agents to analyze purchases and automate procurement workflows.
            </p>
          </div>
        </div>
      </div>

      {settingsLoading ? (
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 0' }}>
          <div className="loading-spinner" style={{ marginBottom: '1rem' }}></div>
          <p>Loading Agent settings...</p>
        </div>
      ) : (
        <div className="agent-grid-layout" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {selectedAgentId === null ? (
            /* AI Agent Grid Selection View */
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu size={20} style={{ color: 'var(--primary)' }} />
                Active AI Agents
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem' }}>
                
                {/* Agent Card 1: Monthly Report Sender */}
                <div 
                  onClick={() => setSelectedAgentId('monthly_report')}
                  className="premium-card"
                  style={{
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 'var(--border-radius-md)',
                    overflow: 'hidden',
                    padding: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(99, 102, 241, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ position: 'relative', height: '180px', width: '100%' }}>
                    <img 
                      src="/images/monthly_agent.jpeg" 
                      alt="Monthly Report Sender Agent" 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <span className={`badge ${settings?.is_enabled ? 'badge-success' : 'badge-danger'}`} style={{ position: 'absolute', top: '1rem', right: '1rem', margin: 0 }}>
                      {settings?.is_enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1 }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>
                      Monthly Report Sender
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                      Generates and emails PDF summaries to your team distribution list.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Configure Settings →</span>
                    </div>
                  </div>
                </div>

                {/* Agent Card 2: Price Watcher Agent (Coming Soon) */}
                {/* Agent Card 2: Price Watcher Agent (Coming Soon) */}
                <div 
                  className="premium-card"
                  style={{
                    border: '1px solid var(--border-color)',
                    opacity: 0.55,
                    background: 'var(--bg-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 'var(--border-radius-md)',
                    overflow: 'hidden',
                    padding: 0,
                    minHeight: '335px',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-color)',
                    marginBottom: '1rem'
                  }}>
                    <Cpu size={30} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <span className="badge badge-warning" style={{ margin: 0, padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                    Coming Soon
                  </span>
                </div>

                {/* Agent Card 3: Supplier Scout Agent (Coming Soon) */}
                <div 
                  className="premium-card"
                  style={{
                    border: '1px solid var(--border-color)',
                    opacity: 0.55,
                    background: 'var(--bg-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 'var(--border-radius-md)',
                    overflow: 'hidden',
                    padding: 0,
                    minHeight: '335px',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-color)',
                    marginBottom: '1rem'
                  }}>
                    <Cpu size={30} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <span className="badge badge-warning" style={{ margin: 0, padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                    Coming Soon
                  </span>
                </div>

              </div>
            </div>
          ) : (
            /* Selected Agent Configuration Detail View */
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Back Button */}
              <button 
                onClick={() => setSelectedAgentId(null)}
                className="btn btn-secondary"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  marginBottom: '0.5rem', 
                  alignSelf: 'flex-start',
                  padding: '0.6rem 1.2rem',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                ← Back to AI Agents
              </button>

              {/* Configurations Card */}
              {selectedAgentId === 'monthly_report' && (
                <div className="premium-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                    <img 
                      src="/images/monthly_agent.jpeg" 
                      alt="Monthly Report Sender Agent" 
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: '1.5px solid var(--border-color)'
                      }}
                    />
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>
                        Monthly Report Sender Agent Configuration
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                        Configure the scheduling trigger, team notification emails, and configurations.
                      </p>
                    </div>
                  </div>

                  {/* Agent status, next run times */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                    gap: '1rem', 
                    marginBottom: '2rem',
                    padding: '1rem',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Clock size={18} style={{ color: 'var(--primary)' }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>LAST EXECUTION</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{formatDate(settings?.last_run)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Calendar size={18} style={{ color: 'var(--secondary)' }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>NEXT SCHEDULED RUN</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{formatDate(settings?.next_run)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Configurations Form */}
                  <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Scheduling Switch & Day select */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                      <div className="form-group" style={{ flex: 1, minWidth: '240px' }}>
                        <label className="form-label">Agent Execution Trigger Status</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                          <label className="agent-switch">
                            <input 
                              type="checkbox" 
                              checked={agentEnabled} 
                              onChange={(e) => {
                                const val = e.target.checked;
                                setAgentEnabled(val);
                                saveSchedulerSettings(val, dayOfMonth);
                              }} 
                              disabled={savingSettings}
                            />
                            <span className="agent-slider"></span>
                          </label>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: agentEnabled ? 'var(--success)' : 'var(--text-muted)' }}>
                            {agentEnabled ? 'Enabled (Autonomous runs active)' : 'Disabled (Autonomous runs paused)'}
                          </span>
                        </div>
                      </div>

                      <div className="form-group" style={{ width: '180px' }}>
                        <label className="form-label" htmlFor="day-of-month-select">Day of Month Scheduled</label>
                        <select 
                          id="day-of-month-select"
                          value={dayOfMonth} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setDayOfMonth(val);
                            saveSchedulerSettings(agentEnabled, val);
                          }} 
                          className="input-field"
                          style={{ marginTop: '0.5rem' }}
                          disabled={savingSettings}
                        >
                          {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>Day {day}</option>
                          ))}
                        </select>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Limited to days 1-28 to avoid shorter month overflows.
                        </span>
                      </div>
                    </div>

                    {/* Recipient Emails list */}
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Mail size={16} style={{ color: 'var(--primary)' }} />
                            Email Report Distribution List
                          </h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Recipients scheduled to receive reports. Maximum 5 total email recipients.
                          </p>
                        </div>
                        <span className="badge badge-info" style={{ fontWeight: 600 }}>
                          {deliveryEmails.length} / {maxEmailsLimit} Total
                        </span>
                      </div>

                      {/* Email list elements */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        {deliveryEmails.length === 0 ? (
                          <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                            No recipients added yet.
                          </p>
                        ) : (
                          deliveryEmails.map((item, index) => {
                            const isPrimary = index === 0; // Assume first is primary user account email
                            return (
                              <div 
                                key={item.email} 
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  padding: '0.75rem 1rem',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: 'var(--border-radius-sm)',
                                  backgroundColor: isPrimary ? 'var(--primary-glow)' : 'var(--bg-card)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <Mail size={16} style={{ color: item.is_enabled ? 'var(--primary)' : 'var(--text-muted)' }} />
                                  <div>
                                    <span style={{ 
                                      fontSize: '0.9rem', 
                                      fontWeight: isPrimary ? '600' : '400',
                                      color: item.is_enabled ? 'var(--text-primary)' : 'var(--text-muted)',
                                      textDecoration: item.is_enabled ? 'none' : 'line-through'
                                    }}>
                                      {item.email}
                                    </span>
                                    {isPrimary && (
                                      <span className="badge badge-info" style={{ fontSize: '0.65rem', marginLeft: '0.5rem', padding: '0.1rem 0.4rem' }}>
                                        Primary
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                  {/* Delivery Toggle check button */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <input 
                                      type="checkbox" 
                                      id={`toggle-email-${index}`}
                                      checked={item.is_enabled}
                                      onChange={() => handleToggleEmail(item.email, item.is_enabled)}
                                      style={{ cursor: 'pointer' }}
                                    />
                                    <label htmlFor={`toggle-email-${index}`} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                                      {item.is_enabled ? 'Delivering' : 'Muted'}
                                    </label>
                                  </div>

                                  {/* Delete recipient button */}
                                  {!isPrimary && (
                                    <button 
                                      type="button"
                                      onClick={() => handleRemoveEmail(item.email)}
                                      style={{ 
                                        background: 'none', 
                                        border: 'none', 
                                        color: 'var(--danger)', 
                                        cursor: 'pointer',
                                        padding: '0.2rem',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}
                                      title="Delete Recipient"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Add Email Recipient Form */}
                      <div style={{ 
                        backgroundColor: 'var(--bg-app)', 
                        padding: '1rem', 
                        borderRadius: 'var(--border-radius-sm)',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <input 
                              type="email" 
                              placeholder="Add partner or team email (e.g. finance@acme.com)..."
                              value={newEmail}
                              onChange={(e) => {
                                setNewEmail(e.target.value);
                                if (emailError) setEmailError(null);
                              }}
                              className="input-field"
                              disabled={isLimitReached || emailLoading}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleAddEmail}
                            disabled={isLimitReached || emailLoading || !newEmail.trim()}
                            className="btn btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}
                          >
                            {emailLoading ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />}
                            <span>Add Email</span>
                          </button>
                        </div>

                        {/* Error message under the input box */}
                        {emailError && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginTop: '0.75rem', fontSize: '0.82rem', fontWeight: 500 }} className="animate-fade-in">
                            <AlertTriangle size={15} />
                            <span>{emailError}</span>
                          </div>
                        )}

                        {/* Limit indicator alerts */}
                        {isLimitReached && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', marginTop: '0.75rem', fontSize: '0.82rem', fontWeight: 500 }}>
                            <AlertTriangle size={15} />
                            <span>You have reached the maximum limit of 5 email recipients.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions / Save Settings Row */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={savingSettings}
                        style={{ minWidth: '160px' }}
                      >
                        {savingSettings ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                        <span>Save Scheduler Settings</span>
                      </button>
                    </div>

                  </form>

                </div>
              )}
            </div>
          )}

          {/* Audit Logs panel */}
          {selectedAgentId === 'monthly_report' && (
            <div className="premium-card animate-slide-up">
              <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
                <Cpu size={18} style={{ color: 'var(--primary)' }} />
                Agent Execution Audit Logs
              </h3>

              {logsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0' }}>
                  <div className="loading-spinner" style={{ marginBottom: '0.75rem', width: '32px', height: '32px' }}></div>
                  <p style={{ fontSize: '0.85rem' }}>Loading execution history...</p>
                </div>
              ) : logs.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem 1rem', 
                  border: '1px dashed var(--border-color)', 
                  borderRadius: 'var(--border-radius-sm)',
                  backgroundColor: 'var(--bg-app)' 
                }}>
                  <Clock size={28} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No runs recorded yet.</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Use the "Compile & Run Now" action above to trigger the agent's first run.</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Run Timestamp</th>
                        <th>Agent Type</th>
                        <th>Status</th>
                        <th>Emailed Recipients</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => {
                        const hasPdf = log.status === 'success' && log.pdf_grid_file_id;
                        return (
                          <tr key={log._id}>
                            <td style={{ fontWeight: 500, fontSize: '0.88rem' }}>
                              {formatDate(log.run_at)}
                            </td>
                            <td style={{ fontSize: '0.85rem' }}>
                              <code>{log.agent_type}</code>
                            </td>
                            <td>
                              <span className={`badge ${log.status === 'success' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                                {log.status}
                              </span>
                              {log.error_message && (
                                <div style={{ 
                                  color: 'var(--danger)', 
                                  fontSize: '0.75rem', 
                                  marginTop: '0.25rem',
                                  maxWidth: '240px',
                                  whiteSpace: 'normal',
                                  wordBreak: 'break-word' 
                                }}>
                                  {log.error_message}
                                </div>
                              )}
                            </td>
                            <td style={{ fontSize: '0.82rem' }}>
                              {log.emails_sent_to && log.emails_sent_to.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                  {log.emails_sent_to.map(email => (
                                    <span key={email} className="badge badge-info" style={{ fontSize: '0.65rem', textTransform: 'none', letterSpacing: 'normal' }}>
                                      {email}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>None</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {hasPdf ? (
                                <button
                                  onClick={() => handleDownloadReport(log.pdf_grid_file_id!, log.run_at)}
                                  className="btn btn-secondary"
                                  style={{ 
                                    padding: '0.35rem 0.75rem', 
                                    fontSize: '0.8rem', 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '0.25rem' 
                                  }}
                                  title="Download Report PDF"
                                >
                                  <Download size={14} />
                                  <span>Download PDF</span>
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  No Archive
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Custom Premium Alert/Confirm Dialog Modal */}
      {dialog.isOpen && (
        <div className="agent-trigger-overlay" style={{ zIndex: 10000 }}>
          <div className="overlay-content premium-card animate-scale-in" style={{ maxWidth: '420px', width: '90%', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              {dialog.isConfirm ? <AlertTriangle size={20} style={{ color: 'var(--warning)' }} /> : <Info size={20} style={{ color: 'var(--primary)' }} />}
              {dialog.title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.92rem', lineHeight: '1.5' }}>
              {dialog.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              {dialog.isConfirm && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setDialog(prev => ({ ...prev, isOpen: false }))}
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
                >
                  Cancel
                </button>
              )}
              <button 
                className="btn btn-primary" 
                onClick={dialog.onConfirm}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
              >
                {dialog.isConfirm ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAgentsPage;
