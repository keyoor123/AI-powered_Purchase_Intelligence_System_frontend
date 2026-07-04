// src/pages/LoginSignup.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Lock, Mail, User, ArrowRight, RefreshCw, Key, Eye, EyeOff } from 'lucide-react';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';

const LoginSignup: React.FC = () => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  
  // Form values
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Feedback
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clearMessages = () => {
    setError(null);
    setInfo(null);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    clearMessages();
    setPassword('');
    setShowPassword(false);
    setShowNewPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setSubmitting(true);
    
    try {
      if (mode === 'login') {
        if (!email || !password) throw new Error('Please fill in all fields.');
        await login(email, password);
      } else if (mode === 'signup') {
        if (!email || !password || !displayName) throw new Error('Please fill in all fields.');
        await signup(email, password, displayName);
      } else if (mode === 'forgot') {
        if (!email) throw new Error('Please enter your email.');
        const res = await api.forgotPassword(email);
        setInfo(res.message);
        if (res.debug_token) {
          console.log('DEBUG RESET TOKEN:', res.debug_token);
          setResetToken(res.debug_token);
          setInfo(res.message + ' (Check backend terminal logs for token or proceed directly to Reset below.)');
        }
      } else if (mode === 'reset') {
        if (!resetToken || !newPassword) throw new Error('Token and password are required.');
        const res = await api.resetPassword({ token: resetToken, new_password: newPassword });
        if (res.success) {
          setInfo(res.message + ' Redirecting to Login...');
          setTimeout(() => handleModeChange('login'), 2000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel animate-scale-in">
        <div className="auth-header">
          <div className="auth-logo">ProcureIQ</div>
          <p style={{ color: 'var(--text-secondary)' }}>AI-Powered Purchase Intelligence</p>
        </div>

        {/* Auth Mode Selection Tabs */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="auth-tabs">
            <button
              onClick={() => handleModeChange('login')}
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            >
              Sign In
            </button>
            <button
              onClick={() => handleModeChange('signup')}
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            >
              Register
            </button>
          </div>
        )}

        {error && (
          <div className="badge badge-danger" style={{ display: 'block', padding: '0.75rem', marginBottom: '1.25rem', borderRadius: 'var(--border-radius-sm)', textTransform: 'none' }}>
            {error}
          </div>
        )}

        {info && (
          <div className="badge badge-info" style={{ display: 'block', padding: '0.75rem', marginBottom: '1.25rem', borderRadius: 'var(--border-radius-sm)', textTransform: 'none' }}>
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-group animate-slide-up">
              <label className="form-label">Display Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Aarav Mehta"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.75rem' }}
                  required
                />
              </div>
            </div>
          )}

          {mode !== 'reset' && (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder="aarav@acme.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.75rem' }}
                  required
                />
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <div className="form-group animate-slide-up">
              <label className="form-label">Reset Token</label>
              <div style={{ position: 'relative' }}>
                <Key size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Paste JWT token here..."
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.75rem' }}
                  required
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleModeChange('forgot')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="password-toggle-btn"
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '0.5rem' }}>
            {submitting ? (
              <RefreshCw size={18} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Link'}
                  {mode === 'reset' && 'Reset Password'}
                </span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {mode === 'forgot' && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              onClick={() => handleModeChange('login')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Back to Sign In
            </button>
            {resetToken && (
              <button
                onClick={() => handleModeChange('reset')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', cursor: 'pointer', display: 'block', margin: '0.5rem auto 0' }}
              >
                Proceed to Reset Password
              </button>
            )}
          </div>
        )}

        {mode === 'reset' && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              onClick={() => handleModeChange('login')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginSignup;
