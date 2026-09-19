import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';
// SECURITY: console access is granted ONLY to Firebase Auth accounts carrying
// the server-provisioned `superadmin` custom claim (see scripts/
// set-superadmin-claim.js). There is no shared passcode, no shared password,
// and no client-side role check.
import { useAuth } from '../context/AuthContext';
import { deriveSubscription } from '../utils/subscription';
import { 
  Building2, Users, Calendar, Search, Filter, 
  Sparkles, CheckCircle2, Clock, AlertTriangle, ArrowRight, 
  ExternalLink, Mail, KeyRound, Lock, RefreshCw, X, ChevronRight,
  MapPin, Phone, MessageSquare, Globe, Coins, Plus
} from 'lucide-react';
import { formatDate } from '../utils/helpers';

export default function SuperAdmin() {
  const { isPlatformAdmin } = useAuth();
  
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [manuallyUnlocked, setManuallyUnlocked] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  // Derived: claim holders pass the gate without a second sign-in; others
  // must complete the owner sign-in form successfully.
  const isUnlocked = isPlatformAdmin || manuallyUnlocked;

  // Modal states for managing a tenant
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingCreditAmount, setLoadingCreditAmount] = useState(null);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setUnlockError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, ownerEmail, password);
      const idTokenResult = await cred.user.getIdTokenResult();
      if (idTokenResult?.claims?.superadmin === true) {
        setManuallyUnlocked(true);
      } else {
        await auth.signOut();
        setUnlockError('This account does not have Platform Super Admin access.');
      }
    } catch {
      setUnlockError('Invalid email or password.');
    }
  };

  const fetchTenantsData = async () => {
    setLoading(true);
    try {
      // Firestore rules authorize this read via the signed-in account's
      // `superadmin` custom claim — no credentials are handled in the client.

      // 1. Query users collection (Operational account metadata)
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 2. Query config collection (Official company profile, address, phone & subscription per tenant)
      const configSnap = await getDocs(collection(db, 'config'));
      const configMap = {};
      configSnap.docs.forEach(d => {
        configMap[d.id] = d.data();
      });

      // 3. Group users by tenantId and map official business details
      const tenantMap = {};
      allUsers.forEach(u => {
        // Exclude the platform owner's operational account from the tenant directory
        if (u.tenantId === 'platform_owner') return;
        const tId = u.tenantId || 'unassigned';
        if (!tenantMap[tId]) {
          const profileDoc = configMap[`${tId}_companyProfile`];
          const companyData = profileDoc?.data || profileDoc || {};
          const subDoc = configMap[`${tId}_subscription`] || { 
            plan: 'trial', 
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
          };

          const derived = deriveSubscription(subDoc, { docSpent: tId.includes('vistara') ? 2 : 0 });
          const { totalCredits, spentCredits, balanceCredits } = derived;

          tenantMap[tId] = {
            tenantId: tId,
            tenantName: companyData.companyName || u.tenantName || 'Studio Workspace',
            officialAddress: companyData.officeAddress || '',
            email: companyData.email || u.email || '',
            phone: companyData.phone || '',
            website: companyData.website || '',
            gstNumber: companyData.gstNumber || '',
            logo: companyData.logo || null,
            createdAt: u.createdAt || new Date().toISOString(),
            users: [],
            admin: null,
            subscription: {
              ...subDoc,
              totalCredits,
              spentCredits,
              balanceCredits
            },
            companyProfile: companyData,
            totalCredits,
            spentCredits,
            balanceCredits
          };
        }

        tenantMap[tId].users.push(u);
        if (u.role === 'admin' || !tenantMap[tId].admin) {
          tenantMap[tId].admin = u;
          if (u.tenantName && !tenantMap[tId].companyProfile?.companyName) {
            tenantMap[tId].tenantName = u.tenantName;
          }
          if (!tenantMap[tId].email && u.email) tenantMap[tId].email = u.email;
        }
      });

      // Sort newest registration first
      const tenantList = Object.values(tenantMap);
      tenantList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTenants(tenantList);
    } catch (err) {
      console.error('Failed to load tenants operational data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect -- mount-load of tenant data; loading state lives here by design */
  useEffect(() => {
    if (isUnlocked) {
      fetchTenantsData();
    }
  }, [isUnlocked]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Action: Extend Trial
  const handleExtendTrial = async (days) => {
    if (!selectedTenant) return;
    setActionLoading(true);
    setActionSuccess('');
    try {
      const currentExpiry = selectedTenant.subscription?.trialEndsAt 
        ? new Date(selectedTenant.subscription.trialEndsAt) 
        : new Date();
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      baseDate.setDate(baseDate.getDate() + days);

      const updatedSub = {
        ...selectedTenant.subscription,
        plan: 'trial',
        trialEndsAt: baseDate.toISOString(),
        tenantId: selectedTenant.tenantId,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'config', `${selectedTenant.tenantId}_subscription`), updatedSub);
      
      setTenants(prev => prev.map(t => {
        if (t.tenantId === selectedTenant.tenantId) {
          return { ...t, subscription: updatedSub };
        }
        return t;
      }));

      setSelectedTenant(prev => ({ ...prev, subscription: updatedSub }));
      setActionSuccess(`Successfully extended trial by ${days} days! (New expiry: ${formatDate(baseDate.toISOString())})`);
    } catch (err) {
      console.error('Error extending trial:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Upgrade to Pro Plan
  const handleUpgradePro = async () => {
    if (!selectedTenant) return;
    setActionLoading(true);
    setActionSuccess('');
    try {
      const proExpiry = new Date();
      proExpiry.setFullYear(proExpiry.getFullYear() + 1); // 1 Year Pro

      const currentTotal = selectedTenant.totalCredits !== undefined ? selectedTenant.totalCredits : 50;
      const currentSpent = selectedTenant.spentCredits !== undefined ? selectedTenant.spentCredits : 0;
      const newTotal = Math.max(500, currentTotal + 500);
      const newBalance = Math.max(0, newTotal - currentSpent);

      const updatedSub = {
        ...selectedTenant.subscription,
        plan: 'pro',
        activeUntil: proExpiry.toISOString(),
        totalCredits: newTotal,
        spentCredits: currentSpent,
        balanceCredits: newBalance,
        tenantId: selectedTenant.tenantId,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'config', `${selectedTenant.tenantId}_subscription`), updatedSub, { merge: true });

      setTenants(prev => prev.map(t => {
        if (t.tenantId === selectedTenant.tenantId) {
          return { 
            ...t, 
            totalCredits: newTotal,
            spentCredits: currentSpent,
            balanceCredits: newBalance,
            subscription: updatedSub 
          };
        }
        return t;
      }));

      setSelectedTenant(prev => ({ 
        ...prev, 
        totalCredits: newTotal,
        spentCredits: currentSpent,
        balanceCredits: newBalance,
        subscription: updatedSub 
      }));
      setActionSuccess('Successfully activated Pro Subscription (+500 Credits) for this studio!');
    } catch (err) {
      console.error('Error upgrading to Pro:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Add / Allocate Credits
  const handleAddCredits = async (amount) => {
    if (!selectedTenant) return;
    setActionLoading(true);
    setLoadingCreditAmount(amount);
    setActionSuccess('');
    try {
      const derived = deriveSubscription(selectedTenant.subscription || selectedTenant);
      const currentTotal = derived.totalCredits;
      const currentSpent = derived.spentCredits;
      const newTotal = currentTotal + amount;
      const newBalance = Math.max(0, newTotal - currentSpent);

      const updatedSub = {
        ...selectedTenant.subscription,
        totalCredits: newTotal,
        spentCredits: currentSpent,
        balanceCredits: newBalance,
        tenantId: selectedTenant.tenantId,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'config', `${selectedTenant.tenantId}_subscription`), updatedSub, { merge: true });

      setTenants(prev => prev.map(t => {
        if (t.tenantId === selectedTenant.tenantId) {
          return { 
            ...t, 
            totalCredits: newTotal,
            spentCredits: currentSpent,
            balanceCredits: newBalance,
            subscription: updatedSub 
          };
        }
        return t;
      }));

      setSelectedTenant(prev => ({ 
        ...prev, 
        totalCredits: newTotal,
        spentCredits: currentSpent,
        balanceCredits: newBalance,
        subscription: updatedSub 
      }));
      setActionSuccess(`Successfully allocated +${amount} credits to ${selectedTenant.tenantName}! (New balance: ${newBalance} credits)`);
    } catch (err) {
      console.error('Error adding credits:', err);
    } finally {
      setActionLoading(false);
      setLoadingCreditAmount(null);
    }
  };

  // Filtered tenants
  const filteredTenants = tenants.filter(t => {
    const term = search.toLowerCase();
    const matchesSearch = 
      (t.tenantName || '').toLowerCase().includes(term) ||
      (t.tenantId || '').toLowerCase().includes(term) ||
      (t.officialAddress || '').toLowerCase().includes(term) ||
      (t.email || '').toLowerCase().includes(term) ||
      (t.phone || '').toLowerCase().includes(term) ||
      (t.admin?.name || '').toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (filterPlan === 'ALL') return true;
    if (filterPlan === 'TRIAL') return t.subscription?.plan === 'trial';
    if (filterPlan === 'PRO') return t.subscription?.plan === 'pro';
    if (filterPlan === 'EXPIRED') {
      if (t.subscription?.plan === 'trial') {
        return new Date(t.subscription.trialEndsAt) < new Date();
      }
      return false;
    }
    return true;
  });

  // Global KPIs
  const totalTenants = tenants.length;
  const totalUsers = tenants.reduce((acc, t) => acc + (t.users?.length || 0), 0);
  const activeTrials = tenants.filter(t => t.subscription?.plan === 'trial' && new Date(t.subscription?.trialEndsAt || 0) > new Date()).length;
  const proSubscribers = tenants.filter(t => t.subscription?.plan === 'pro').length;
  const totalCreditsSpent = tenants.reduce((acc, t) => acc + (t.spentCredits || 0), 0);
  const totalCreditsBalance = tenants.reduce((acc, t) => acc + (t.balanceCredits || 0), 0);

  // Passcode Unlock Screen
  if (!isUnlocked) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a1636 0%, #0f172a 100%)',
        padding: 20,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          maxWidth: 440,
          width: '100%',
          padding: '40px 32px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          textAlign: 'center'
        }}>
          <div style={{
            width: 54,
            height: 54,
            borderRadius: 14,
            background: '#eff6ff',
            color: '#1a56ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Lock size={26} />
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
            Platform Super Admin
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
            Sign in with your Platform Owner account to access tenant information and manage subscriptions.
          </p>

          {unlockError && (
            <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 12px', borderRadius: 8, fontSize: '0.82rem', marginBottom: 16 }}>
              {unlockError}
            </div>
          )}

          <form onSubmit={handleUnlock}>
            <div style={{ marginBottom: 16 }}>
              <input
                type="email"
                className="form-control"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="Platform owner email"
                required
                style={{ borderRadius: 10, padding: '12px 14px', fontSize: '1rem' }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                style={{ borderRadius: 10, padding: '12px 14px', textAlign: 'center', fontSize: '1rem', letterSpacing: '0.1em' }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem' }}
            >
              Access Admin Console
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: '#0a1636',
        color: '#ffffff',
        padding: '16px 24px',
        borderBottom: '1px solid #1e3a8a',
        position: 'sticky',
        top: 0,
        zIndex: 20
      }}>
        <div style={{
          maxWidth: 1360,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/icons/icon-192.png" alt="Logo" style={{ width: 36, height: 36, borderRadius: 8 }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: '#fff' }}>
                  PreciseQuote
                </span>
                <span style={{
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontWeight: 800,
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  letterSpacing: '0.04em'
                }}>
                  PLATFORM OWNER
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                <span>Tenant Directory & Subscription Command Center</span>
                <span style={{ color: '#475569' }}>•</span>
                <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.68rem', background: 'rgba(56, 189, 248, 0.1)', padding: '1px 6px', borderRadius: 4, border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  super-admin.precisequote.web.app
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => { setRefreshing(true); fetchTenantsData(); }}
              disabled={refreshing}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <RefreshCw size={13} className={refreshing ? 'spin' : ''} /> Refresh
            </button>

            <button
              onClick={async () => {
                await auth.signOut();
                setManuallyUnlocked(false);
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              title="Lock Console"
            >
              <Lock size={13} /> Exit Console
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 20px 80px' }}>
        
        {/* Global Platform KPIs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 28
        }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Studios / Tenants</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', marginTop: 4 }}>{totalTenants}</div>
            <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={12} /> Registered Workspaces
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '20px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Active 30-Day Trials</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0284c7', marginTop: 4 }}>{activeTrials}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>Evaluating SaaS Platform</div>
          </div>

          <div style={{ background: '#ffffff', padding: '20px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Pro Paid Subscribers</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#8b5cf6', marginTop: 4 }}>{proSubscribers}</div>
            <div style={{ fontSize: '0.72rem', color: '#8b5cf6', marginTop: 4, fontWeight: 600 }}>Active ₹699/mo Subscribers</div>
          </div>

          <div style={{ background: '#ffffff', padding: '20px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Spent Credits</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ea580c', marginTop: 4 }}>{totalCreditsSpent}</div>
            <div style={{ fontSize: '0.72rem', color: '#ea580c', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Coins size={12} /> Total Quotations Created
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '20px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Balance Credits</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#16a34a', marginTop: 4 }}>{totalCreditsBalance}</div>
            <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={12} /> Available Studio Balance
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '20px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Designers / Team Users</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', marginTop: 4 }}>{totalUsers}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>Across all studio workspaces</div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 440 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search studio name, official address, email, or phone..."
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>Plan Filter:</span>
            {['ALL', 'TRIAL', 'PRO', 'EXPIRED'].map(plan => (
              <button
                key={plan}
                onClick={() => setFilterPlan(plan)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: filterPlan === plan ? '#1a56ff' : '#cbd5e1',
                  background: filterPlan === plan ? '#eff6ff' : '#ffffff',
                  color: filterPlan === plan ? '#1a56ff' : '#475569',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {plan}
              </button>
            ))}
          </div>
        </div>

        {/* Tenants Directory Table with Name, Address, Email, Phone */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px', display: 'block', color: 'var(--primary)' }} />
              Loading official tenant business profiles...
            </div>
          ) : filteredTenants.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
              <Building2 size={36} style={{ margin: '0 auto 12px', display: 'block', color: '#cbd5e1' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>No tenant studios found</div>
              <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Try clearing or modifying the search filter</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '14px 18px' }}>Studio / Workspace</th>
                    <th style={{ padding: '14px 18px' }}>Official Address</th>
                    <th style={{ padding: '14px 18px' }}>Email ID</th>
                    <th style={{ padding: '14px 18px' }}>Phone Number</th>
                    <th style={{ padding: '14px 18px' }}>Spent Credits</th>
                    <th style={{ padding: '14px 18px' }}>Balance Credits</th>
                    <th style={{ padding: '14px 18px' }}>Plan & Status</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((tenant) => {
                    const isTrial = tenant.subscription?.plan === 'trial';
                    const isPro = tenant.subscription?.plan === 'pro';
                    const trialEnds = tenant.subscription?.trialEndsAt ? new Date(tenant.subscription.trialEndsAt) : null;
                    const isTrialExpired = isTrial && trialEnds && trialEnds < new Date();
                    const daysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds - new Date()) / (1000 * 60 * 60 * 24))) : 0;
                    
                    const cleanPhone = (tenant.phone || '').replace(/[^0-9+]/g, '');

                    return (
                      <tr 
                        key={tenant.tenantId} 
                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                      >
                        {/* 1) Studio / Tenant Name */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {tenant.logo ? (
                              <img 
                                src={tenant.logo} 
                                alt="Logo" 
                                style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'contain', background: '#f1f5f9', flexShrink: 0 }} 
                              />
                            ) : (
                              <div style={{
                                width: 38,
                                height: 38,
                                borderRadius: 8,
                                background: 'var(--primary)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.92rem',
                                flexShrink: 0
                              }}>
                                {tenant.tenantName ? tenant.tenantName.substring(0, 1).toUpperCase() : 'S'}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.94rem' }}>
                                {tenant.tenantName}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                Admin: <strong>{tenant.admin?.name || 'Administrator'}</strong>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                ID: {tenant.tenantId}
                              </div>
                              <a
                                href={`https://${(tenant.tenantName || tenant.tenantId).toLowerCase().replace(/[^a-z0-9]/g, '')}.precisequote.web.app`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: '0.7rem',
                                  color: '#0284c7',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  marginTop: 3
                                }}
                                title="Open Tenant Subdomain Portal"
                              >
                                <Globe size={11} />
                                <span>{(tenant.tenantName || tenant.tenantId).toLowerCase().replace(/[^a-z0-9]/g, '')}.precisequote.web.app</span>
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* 2) Official Address */}
                        <td style={{ padding: '16px 18px', maxWidth: 260 }}>
                          {tenant.officialAddress ? (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                              <MapPin size={15} style={{ flexShrink: 0, marginTop: 2, color: '#ef4444' }} />
                              <span title={tenant.officialAddress} className="line-clamp-2">
                                {tenant.officialAddress}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                              Address not set yet
                            </span>
                          )}
                        </td>

                        {/* 3) Email ID */}
                        <td style={{ padding: '16px 18px' }}>
                          {tenant.email ? (
                            <a 
                              href={`mailto:${tenant.email}`} 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: 6, 
                                color: 'var(--primary)', 
                                fontWeight: 600, 
                                fontSize: '0.82rem', 
                                textDecoration: 'none' 
                              }}
                              title={`Send email to ${tenant.email}`}
                            >
                              <Mail size={14} />
                              <span className="truncate" style={{ maxWidth: 190 }}>{tenant.email}</span>
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>N/A</span>
                          )}
                        </td>

                        {/* 4) Phone Number */}
                        <td style={{ padding: '16px 18px' }}>
                          {tenant.phone ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <a 
                                href={`tel:${cleanPhone}`} 
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: 5, 
                                  color: '#0f172a', 
                                  fontWeight: 700, 
                                  fontSize: '0.82rem', 
                                  textDecoration: 'none' 
                                }}
                              >
                                <Phone size={13} color="#16a34a" />
                                <span>{tenant.phone}</span>
                              </a>
                              {cleanPhone && (
                                <a
                                  href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    background: '#dcfce7',
                                    color: '#166534',
                                    padding: '3px 6px',
                                    borderRadius: 4,
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    textDecoration: 'none'
                                  }}
                                  title="Chat on WhatsApp"
                                >
                                  WA
                                </a>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                              Phone not set yet
                            </span>
                          )}
                        </td>

                        {/* Spent Credits */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#fff7ed',
                            color: '#c2410c',
                            border: '1px solid #ffedd5',
                            padding: '4px 10px',
                            borderRadius: 8,
                            fontWeight: 800,
                            fontSize: '0.84rem'
                          }}>
                            <Coins size={13} />
                            <span>{tenant.spentCredits ?? 0}</span>
                          </div>
                        </td>

                        {/* Balance Credits */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: (tenant.balanceCredits ?? 0) <= 5 ? '#fef2f2' : '#f0fdf4',
                            color: (tenant.balanceCredits ?? 0) <= 5 ? '#b91c1c' : '#15803d',
                            border: `1px solid ${(tenant.balanceCredits ?? 0) <= 5 ? '#fecaca' : '#bbf7d0'}`,
                            padding: '4px 10px',
                            borderRadius: 8,
                            fontWeight: 800,
                            fontSize: '0.84rem'
                          }}>
                            <span>{tenant.balanceCredits ?? 0}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.85 }}>left</span>
                          </div>
                        </td>

                        {/* Plan & Status */}
                        <td style={{ padding: '16px 18px' }}>
                          {isPro ? (
                            <span style={{
                              background: '#f3e8ff',
                              color: '#7e22ce',
                              padding: '4px 10px',
                              borderRadius: 12,
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <Sparkles size={12} /> PRO ACTIVE
                            </span>
                          ) : isTrialExpired ? (
                            <span style={{
                              background: '#fef2f2',
                              color: '#b91c1c',
                              padding: '4px 10px',
                              borderRadius: 12,
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <AlertTriangle size={12} /> TRIAL EXPIRED
                            </span>
                          ) : (
                            <span style={{
                              background: '#eff6ff',
                              color: '#1a56ff',
                              padding: '4px 10px',
                              borderRadius: 12,
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <Clock size={12} /> {daysLeft}D TRIAL LEFT
                            </span>
                          )}
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>
                            {tenant.users?.length || 1} team user(s)
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setActionSuccess('');
                            }}
                            style={{
                              background: '#eff6ff',
                              color: 'var(--primary)',
                              border: '1px solid #bfdbfe',
                              padding: '7px 12px',
                              borderRadius: 8,
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            Details & Plan <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Tenant Detailed Profile & Plan Management Modal */}
      {selectedTenant && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            maxWidth: 580,
            width: '100%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
              flexShrink: 0
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Tenant Official Business Profile
                </h3>
                <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                  Tenant ID: <span style={{ fontFamily: 'monospace' }}>{selectedTenant.tenantId}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTenant(null)}
                style={{
                  background: '#e2e8f0',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#475569'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {actionSuccess && (
                <div style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  padding: '12px 16px',
                  borderRadius: 10,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* 4 Required Official Business Information Cards */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '18px',
                marginBottom: 20,
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
              }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Official Tenant Information
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* 1) Name */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>1) Studio / Tenant Name</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                        {selectedTenant.tenantName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Admin In-Charge: <strong>{selectedTenant.admin?.name || 'Administrator'}</strong>
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <a
                          href={`https://${(selectedTenant.tenantName || selectedTenant.tenantId).toLowerCase().replace(/[^a-z0-9]/g, '')}.precisequote.web.app`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: '0.76rem',
                            color: '#0284c7',
                            fontWeight: 700,
                            textDecoration: 'none',
                            background: '#f0f9ff',
                            padding: '3px 8px',
                            borderRadius: 6,
                            border: '1px solid #bae6fd'
                          }}
                        >
                          <Globe size={12} />
                          <span>https://{(selectedTenant.tenantName || selectedTenant.tenantId).toLowerCase().replace(/[^a-z0-9]/g, '')}.precisequote.web.app</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* 2) Official Address */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>2) Official Office Address</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>
                        {selectedTenant.officialAddress || 'No official office address configured by tenant yet'}
                      </div>
                      {selectedTenant.officialAddress && (
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(selectedTenant.officialAddress)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, textDecoration: 'none' }}
                        >
                          Open in Google Maps <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 3) Email ID */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Mail size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>3) Official Email ID</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                        {selectedTenant.email || 'N/A'}
                      </div>
                      {selectedTenant.email && (
                        <a
                          href={`mailto:${selectedTenant.email}?subject=Precise Quote SaaS Platform Support`}
                          style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2, textDecoration: 'none' }}
                        >
                          Send Email <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 4) Phone Number */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Phone size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>4) Official Phone Number</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                        {selectedTenant.phone || 'No phone number provided yet'}
                      </div>
                      {selectedTenant.phone && (
                        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                          <a
                            href={`tel:${selectedTenant.phone.replace(/[^0-9+]/g, '')}`}
                            style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Phone size={12} /> Call
                          </a>
                          <a
                            href={`https://wa.me/${selectedTenant.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <MessageSquare size={12} /> Chat on WhatsApp
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Optional GSTIN & Website */}
                  {(selectedTenant.gstNumber || selectedTenant.website) && (
                    <div style={{ display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px dashed #e2e8f0', fontSize: '0.8rem', color: '#64748b' }}>
                      {selectedTenant.gstNumber && <div><strong>GSTIN:</strong> {selectedTenant.gstNumber}</div>}
                      {selectedTenant.website && <div><strong>Website:</strong> {selectedTenant.website}</div>}
                    </div>
                  )}
                </div>
              </div>

              {/* Studio Quotation Credits */}
              <div style={{
                background: '#f8fafc',
                borderRadius: 14,
                padding: '18px',
                border: '1px solid #e2e8f0',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Coins size={16} color="#ea580c" /> Studio Quotation Credits
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Total Allocated: <strong style={{ color: '#0f172a' }}>{selectedTenant.totalCredits || 50}</strong>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#9a3412', fontWeight: 700, textTransform: 'uppercase' }}>Spent Credits</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#c2410c', marginTop: 2 }}>
                      {selectedTenant.spentCredits ?? 0}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#ea580c', marginTop: 2 }}>Quotations Created</div>
                  </div>

                  <div style={{
                    background: (selectedTenant.balanceCredits ?? 0) <= 5 ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${(selectedTenant.balanceCredits ?? 0) <= 5 ? '#fecaca' : '#bbf7d0'}`,
                    borderRadius: 10,
                    padding: '12px 14px'
                  }}>
                    <div style={{
                      fontSize: '0.72rem',
                      color: (selectedTenant.balanceCredits ?? 0) <= 5 ? '#991b1b' : '#166534',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      Balance Credits
                    </div>
                    <div style={{
                      fontSize: '1.6rem',
                      fontWeight: 900,
                      color: (selectedTenant.balanceCredits ?? 0) <= 5 ? '#dc2626' : '#15803d',
                      marginTop: 2
                    }}>
                      {selectedTenant.balanceCredits ?? 0}
                    </div>
                    <div style={{
                      fontSize: '0.7rem',
                      color: (selectedTenant.balanceCredits ?? 0) <= 5 ? '#ef4444' : '#16a34a',
                      marginTop: 2
                    }}>
                      Remaining Quota
                    </div>
                  </div>
                </div>

                {/* Allocate Additional Credits */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Plus size={14} color="#1a56ff" /> Allocate / Recharge Credits
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[25, 50, 100, 250, 500].map(amt => {
                      const isThisLoading = actionLoading && loadingCreditAmount === amt;
                      return (
                        <button
                          key={amt}
                          onClick={() => handleAddCredits(amt)}
                          disabled={actionLoading}
                          style={{
                            flex: 1,
                            minWidth: 62,
                            padding: '8px 10px',
                            background: isThisLoading ? '#eff6ff' : '#ffffff',
                            border: isThisLoading ? '1px solid #1a56ff' : '1px solid #cbd5e1',
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            color: isThisLoading ? '#1a56ff' : '#0f172a',
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            transition: 'all 0.15s'
                          }}
                        >
                          {isThisLoading ? (
                            <RefreshCw size={12} className="spin" />
                          ) : (
                            `+${amt}`
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Plan Management Section */}
              <div style={{
                background: '#f8fafc',
                borderRadius: 14,
                padding: '18px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Subscription Operations
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.84rem', marginBottom: 16 }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Current Plan:</span>
                    <div style={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginTop: 2 }}>
                      {selectedTenant.subscription?.plan || 'Trial'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Expires On:</span>
                    <div style={{ fontWeight: 700, color: '#1e293b', marginTop: 2 }}>
                      {selectedTenant.subscription?.trialEndsAt ? formatDate(selectedTenant.subscription.trialEndsAt) : (selectedTenant.subscription?.activeUntil ? formatDate(selectedTenant.subscription.activeUntil) : 'Active')}
                    </div>
                  </div>
                </div>

                {/* Extend Trial */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                    Extend 30-Day Free Trial
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleExtendTrial(15)}
                      disabled={actionLoading}
                      style={{ flex: 1, padding: '8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      +15 Days
                    </button>
                    <button
                      onClick={() => handleExtendTrial(30)}
                      disabled={actionLoading}
                      style={{ flex: 1, padding: '8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      +30 Days
                    </button>
                    <button
                      onClick={() => handleExtendTrial(60)}
                      disabled={actionLoading}
                      style={{ flex: 1, padding: '8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      +60 Days
                    </button>
                  </div>
                </div>

                {/* Activate Pro */}
                <div>
                  <button
                    onClick={handleUpgradePro}
                    disabled={actionLoading}
                    style={{
                      width: '100%',
                      padding: '11px',
                      background: '#8b5cf6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    <Sparkles size={16} /> Activate 1-Year Pro Plan (₹699/mo)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
