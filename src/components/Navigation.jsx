import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Package, Users, Plus, HelpCircle, LogOut, Home, Clock, Settings, Building2, Smartphone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export function Sidebar({ onNewProject, onOpenInstall }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { userProfile, isPlatformAdmin, logout } = useAuth();
  const { tenantLogo, companyProfile } = useApp();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Quotation Builder', path: '/builder' },
    { icon: Clock, label: 'Quotation History', path: '/history' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: Users, label: 'Clients', path: '/clients' },
    { icon: Building2, label: 'Company Profile', path: '/company-profile' },
  ];

  if (userProfile?.role === 'admin') {
    navItems.push({ icon: Settings, label: 'Admin Panel', path: '/admin' });
  }

  if (isPlatformAdmin) {
    navItems.push({ icon: ShieldCheck, label: 'Platform Admin', path: '/super-admin' });
  }

  const tenantBrandName = companyProfile?.companyName || userProfile?.tenantName || 'Workspace';
  const subtitle = companyProfile?.workspaceSubtitle || (companyProfile?.tagline ? companyProfile.tagline : 'Interior Studio');

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
          {tenantLogo ? (
            <img src={tenantLogo} alt="Logo" style={{ width: 44, height: 44, objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 'bold' }}>
              {tenantBrandName ? tenantBrandName.substring(0, 1).toUpperCase() : 'W'}
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="sidebar-logo-title truncate" style={{ fontSize: '0.95rem', fontWeight: 800 }} title={tenantBrandName}>
              {tenantBrandName}
            </div>
            <div className="sidebar-logo-sub truncate" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {subtitle}
            </div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <button 
          className="sidebar-nav-item" 
          onClick={onOpenInstall}
          style={{ 
            color: 'var(--primary)', 
            marginBottom: 10, 
            background: '#eff6ff', 
            borderRadius: 8, 
            border: '1px solid #bfdbfe',
            fontWeight: 700,
            cursor: 'pointer',
            width: '100%'
          }}
        >
          <Smartphone size={18} />
          <span>Install Mobile App</span>
        </button>

        <button className="new-project-btn" onClick={onNewProject}>
          <Plus size={18} />
          <span>New Quotation</span>
        </button>

        {/* User Profile & Sign Out Footer */}
        <div style={{
          marginTop: 12,
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.72rem',
              fontWeight: 700,
              flexShrink: 0
            }}>
              {userProfile?.name ? userProfile.name.substring(0,2).toUpperCase() : 'PQ'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="truncate" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                {userProfile?.name || 'User'}
              </div>
              <div className="truncate" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                {userProfile?.role || 'Member'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 6,
              padding: '4px 8px',
              color: '#f87171',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.72rem',
              fontWeight: 700,
              flexShrink: 0
            }}
            title="Sign Out of Precise Quote"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export function TopBar({ title, onOpenInstall }) {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const { userProfile, logout } = useAuth();
  const { companyProfile } = useApp();
  
  const tenantBrandName = companyProfile?.companyName || userProfile?.tenantName || 'Workspace';
  const initials = userProfile?.name 
    ? userProfile.name.substring(0,2).toUpperCase() 
    : (tenantBrandName ? tenantBrandName.substring(0, 2).toUpperCase() : 'PQ');

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {title || tenantBrandName}
        </span>
        {(!companyProfile?.hidePlatformAttribution) ? (
          <span style={{ fontSize: '0.68rem', background: '#eff6ff', color: 'var(--primary)', padding: '2px 8px', borderRadius: 10, fontWeight: 700, border: '1px solid #bfdbfe', letterSpacing: '0.02em' }}>
            Precise Quote
          </span>
        ) : (
          companyProfile?.tagline ? (
            <span className="truncate" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: 220 }}>
              {companyProfile.tagline}
            </span>
          ) : null
        )}
      </div>
      <div className="search-bar" style={{ width: 240 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-muted)' }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers or projects..." />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onOpenInstall}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            fontSize: '0.78rem',
            borderRadius: 20,
            border: '1px solid #bfdbfe',
            color: 'var(--primary)',
            background: '#eff6ff',
            fontWeight: 700,
            cursor: 'pointer'
          }}
          title="Install iOS / Android / Desktop App"
        >
          <Smartphone size={15} />
          <span>Install App</span>
        </button>
        <button className="btn-icon btn-ghost" onClick={() => navigate('/company-profile')} title="Company Profile">
          <Building2 size={18} />
        </button>
        <button className="btn-icon btn-ghost" onClick={logout} title="Logout">
          <LogOut size={18} />
        </button>
        <div
          onClick={() => navigate('/company-profile')}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
          title={`Profile & Settings: ${userProfile?.name || 'Workspace'}`}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const tabs = [
    { icon: Home, label: 'Hub', path: '/dashboard' },
    { icon: Plus, label: 'Quote', path: '/builder' },
    { icon: Clock, label: 'History', path: '/history' },
    { icon: Building2, label: 'Profile', path: '/company-profile' },
  ];

  if (userProfile?.role === 'admin') {
    tabs.push({ icon: Settings, label: 'Admin', path: '/admin' });
  }

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
