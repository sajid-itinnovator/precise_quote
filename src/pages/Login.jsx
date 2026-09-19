import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Modal from '../components/Modal';
import { Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { getDomainContext } from '../utils/domainRouting';

/** Tenant IDs are generated at submit time, not during render (render purity). */
function makeTenantId() {
  return `tenant_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export default function Login() {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const domain = getDomainContext();
  
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [tenantName, setTenantName] = useState(
    domain.tenantSubdomain ? domain.tenantSubdomain.replace(/[-_]/g, ' ').toUpperCase() : ''
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Register new company (Tenant)
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newTenantId = makeTenantId();
        
        // Write the admin role and tenant ID to Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          name: name,
          tenantId: newTenantId,
          tenantName: tenantName,
          role: 'admin',
          dataAccess: 'shared', 
          createdAt: new Date().toISOString()
        });
        
        navigate('/dashboard');
      } else {
        // Standard login
        await login(email, password);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(formatAuthError(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(formatAuthError(err.code || err.message));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    if (!resetEmail) {
      setResetError('Please enter your account email address.');
      return;
    }
    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetSuccess(`Password reset instructions have been sent to ${resetEmail}. Check your inbox!`);
    } catch (err) {
      console.error(err);
      setResetError(formatAuthError(err.code || err.message));
    } finally {
      setResetLoading(false);
    }
  };

  function formatAuthError(codeOrMsg) {
    if (codeOrMsg.includes('invalid-credential') || codeOrMsg.includes('wrong-password') || codeOrMsg.includes('user-not-found')) {
      return 'Invalid email or password. Please verify your credentials.';
    }
    if (codeOrMsg.includes('email-already-in-use')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (codeOrMsg.includes('weak-password')) {
      return 'Password should be at least 6 characters long.';
    }
    if (codeOrMsg.includes('invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (codeOrMsg.includes('network-request-failed')) {
      return 'Network connection error. Please check your internet.';
    }
    return codeOrMsg || 'Authentication failed. Please try again.';
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #09122a 0%, #0f172a 100%)',
      padding: '20px 16px'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: 440,
        padding: '36px 32px',
        borderRadius: 20,
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        background: '#ffffff',
        border: '1px solid #e2e8f0'
      }}>
        {/* Top App Identity */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
            <img 
              src="/icons/icon-192.png" 
              alt="Precise Quote" 
              style={{ width: 44, height: 44, borderRadius: 10, boxShadow: '0 4px 12px rgba(26, 86, 255, 0.3)' }} 
            />
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '-0.02em' }}>
              {domain.tenantSubdomain && domain.tenantSubdomain.includes('vistara') 
                ? 'Vistara Interiors' 
                : (domain.tenantSubdomain ? domain.tenantSubdomain.replace(/[-_]/g, ' ').toUpperCase() : 'PreciseQuote')}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
            {domain.tenantSubdomain 
              ? `${domain.tenantSubdomain.replace(/[-_]/g, ' ').toUpperCase()} Studio Workspace`
              : 'Interior Quotation & Estimation Studio Platform'}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Register */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          borderRadius: 10,
          padding: 4,
          marginBottom: 24
        }}>
          <button 
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            style={{
              flex: 1,
              padding: '9px 12px',
              background: !isRegister ? '#ffffff' : 'none',
              border: 'none',
              borderRadius: 8,
              color: !isRegister ? '#0f172a' : '#64748b',
              fontWeight: !isRegister ? 700 : 500,
              fontSize: '0.88rem',
              boxShadow: !isRegister ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In
          </button>
          <button 
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            style={{
              flex: 1,
              padding: '9px 12px',
              background: isRegister ? '#ffffff' : 'none',
              border: 'none',
              borderRadius: 8,
              color: isRegister ? '#0f172a' : '#64748b',
              fontWeight: isRegister ? 700 : 500,
              fontSize: '0.88rem',
              boxShadow: isRegister ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Register Studio
          </button>
        </div>

        {error && (
          <div role="alert"
            style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '11px 14px',
            borderRadius: 10,
            fontSize: '0.84rem',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Google Sign-In Option */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          style={{
            width: '100%',
            padding: '11px 16px',
            borderRadius: 10,
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#1e293b',
            fontWeight: 600,
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: 'pointer',
            marginBottom: 20,
            transition: 'background 0.15s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          {/* Google Color G Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>{googleLoading ? 'Connecting to Google...' : (isRegister ? 'Register with Google' : 'Continue with Google')}</span>
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            or with email
          </span>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label htmlFor="register-tenant-name" className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Company / Studio Name</label>
                <input 
                  id="register-tenant-name"
                  type="text" 
                  className="form-control" 
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="e.g. Apex Living Studio"
                  autoComplete="organization"
                  required={isRegister}
                  style={{ borderRadius: 8, padding: '10px 14px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label htmlFor="register-name" className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Your Full Name</label>
                <input 
                  id="register-name"
                  type="text" 
                  className="form-control" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  autoComplete="name"
                  required={isRegister}
                  style={{ borderRadius: 8, padding: '10px 14px' }}
                />
              </div>
            </>
          )}

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label htmlFor="auth-email" className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Email Address</label>
            <input 
              id="auth-email"
              type="email" 
              className="form-control" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
              style={{ borderRadius: 8, padding: '10px 14px' }}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label htmlFor="auth-password" className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', margin: 0 }}>Password</label>
              {!isRegister && (
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setShowForgotPassword(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Forgot Password?
                </button>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <input 
                id="auth-password"
                type={showPassword ? 'text' : 'password'} 
                className="form-control" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                style={{ borderRadius: 8, padding: '10px 42px 10px 14px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '0.96rem',
              fontWeight: 700,
              borderRadius: 10,
              boxShadow: '0 4px 14px rgba(26, 86, 255, 0.35)',
              cursor: 'pointer'
            }}
            disabled={loading || googleLoading}
          >
            {loading ? 'Processing...' : (isRegister ? 'Create Studio Workspace' : 'Sign In to Studio')}
          </button>
        </form>

        {/* Registration hint */}
        <div style={{
          marginTop: 22,
          padding: '12px 14px',
          background: '#f8fafc',
          borderRadius: 10,
          border: '1px dashed #cbd5e1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10
        }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>
            <span style={{ fontWeight: 700, color: '#334155' }}>New to PreciseQuote?</span>
            <div>Switch to <strong>Register Studio</strong> above to create your workspace.</div>
          </div>
        </div>

        {/* Back to Home / Landing */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <ArrowLeft size={14} /> Back to Homepage
          </button>
        </div>

        {/* Legal notice for Google OAuth and SaaS compliance */}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.5 }}>
          By continuing, you agree to PreciseQuote's{' '}
          <button
            type="button"
            onClick={() => navigate('/terms')}
            style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
          >
            Terms of Service
          </button>{' '}
          and{' '}
          <button
            type="button"
            onClick={() => navigate('/privacy')}
            style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
          >
            Privacy Policy
          </button>.
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <Modal
          onClose={() => { setShowForgotPassword(false); setResetError(''); setResetSuccess(''); }}
          zLevel={9999}
          maxWidth={400}
          labelledBy="forgot-password-title"
          style={{
            background: '#ffffff',
            borderRadius: 16,
            width: '100%',
            padding: 28,
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <KeyRound size={20} />
              </div>
              <div>
                <h3 id="forgot-password-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Reset Password</h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>We will send a reset link to your email</p>
              </div>
            </div>

            {resetSuccess ? (
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                padding: '14px',
                borderRadius: 8,
                fontSize: '0.85rem',
                margin: '16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>{resetSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} style={{ marginTop: 16 }}>
                {resetError && (
                  <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 12px', borderRadius: 8, fontSize: '0.82rem', marginBottom: 12 }}>
                    {resetError}
                  </div>
                )}
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label htmlFor="reset-email" className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Your Registered Email</label>
                  <input
                    id="reset-email"
                    type="email"
                    className="form-control"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetError('');
                      setResetSuccess('');
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#f1f5f9',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 600,
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '10px', fontWeight: 700, borderRadius: 8 }}
                  >
                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}

            {resetSuccess && (
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSuccess('');
                }}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 12, padding: '10px', borderRadius: 8 }}
              >
                Done
              </button>
            )}
        </Modal>
      )}
    </div>
  );
}
