import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Package, Users, Plus, HelpCircle, LogOut, Home, Clock, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export function Sidebar({ onNewProject }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { userProfile, logout } = useAuth();
  const { tenantLogo } = useApp();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Quotations', path: '/builder' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: Users, label: 'Clients', path: '/clients' },
  ];

  if (userProfile?.role === 'admin') {
    navItems.push({ icon: Settings, label: 'Admin Panel', path: '/admin' });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
          {tenantLogo ? (
            <img src={tenantLogo} alt="Logo" style={{ width: 44, height: 44, objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 'bold' }}>
              {userProfile?.tenantName ? userProfile.tenantName.substring(0, 1).toUpperCase() : 'W'}
            </div>
          )}
          <div>
            <div className="sidebar-logo-title" style={{ fontSize: '1rem' }}>{userProfile?.tenantName || 'Workspace'}</div>
            <div className="sidebar-logo-sub">Interior Management</div>
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
        <button className="new-project-btn" onClick={onNewProject}>
          <Plus size={16} />
          New Project
        </button>
        <button className="sidebar-nav-item btn-ghost" style={{ marginTop: 4 }}>
          <HelpCircle size={16} />
          <span>Support</span>
        </button>
        <button className="sidebar-nav-item btn-ghost" onClick={logout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export function TopBar({ title }) {
  const [search, setSearch] = React.useState('');
  const { userProfile, logout } = useAuth();
  
  const initials = userProfile?.name 
    ? userProfile.name.substring(0,2).toUpperCase() 
    : 'VI';

  return (
    <header className="topbar">
      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', flex: 1 }}>
        {title || userProfile?.tenantName || 'Workspace'}
      </span>
      <div className="search-bar" style={{ width: 260 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-muted)' }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers or projects..." />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn-icon btn-ghost">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </button>
        <button className="btn-icon btn-ghost" onClick={logout} title="Logout">
          <LogOut size={18} />
        </button>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }} title={userProfile?.name}>
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
