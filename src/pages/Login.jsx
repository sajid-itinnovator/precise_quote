import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Register new company (Tenant)
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newTenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
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
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: 24 }}>
              P
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary)' }}>PreciseQuote</span>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', marginBottom: 20 }}>
            <button 
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: !isRegister ? '2px solid var(--primary)' : 'none', color: !isRegister ? 'var(--primary)' : 'var(--text-muted)', fontWeight: !isRegister ? 700 : 500, cursor: 'pointer' }}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: isRegister ? '2px solid var(--primary)' : 'none', color: isRegister ? 'var(--primary)' : 'var(--text-muted)', fontWeight: isRegister ? 700 : 500, cursor: 'pointer' }}
            >
              Register Company
            </button>
          </div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--secondary)' }}>
            {isRegister ? 'Start your SaaS workspace' : 'Welcome Back'}
          </h1>
        </div>

        {error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '12px 16px', borderRadius: 8, fontSize: '0.875rem', marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Company Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="Acme Interiors"
                  required={isRegister}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Admin Full Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required={isRegister}
                />
              </div>
            </>
          )}

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@vistarainteriors.com"
              required
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: 10 }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isRegister ? 'Create Company Account' : 'Sign In')}
          </button>
        </form>
      </div>
    </div>
  );
}
