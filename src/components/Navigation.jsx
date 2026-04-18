import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Package, Users, Plus, HelpCircle, LogOut, Home, Clock } from 'lucide-react';

export function Sidebar({ onNewProject }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FileText, label: 'Quotations', path: '/builder' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: Users, label: 'Clients', path: '/clients' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
          <div style={{
            width: 34, height: 34, background: 'var(--secondary)', borderRadius: 6,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, lineHeight: 1 }}>V</span>
          </div>
          <div>
            <div className="sidebar-logo-title">Vistara Hub</div>
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
        <button className="sidebar-nav-item btn-ghost">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export function TopBar({ title }) {
  const [search, setSearch] = React.useState('');

  return (
    <header className="topbar">
      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', flex: 1 }}>
        {title || 'Vistara Interiors'}
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
        <button className="btn-icon btn-ghost">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
        </button>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
          VI
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { icon: Home, label: 'Hub', path: '/' },
    { icon: FileText, label: 'Builder', path: '/builder' },
    { icon: Clock, label: 'History', path: '/history' },
  ];

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
