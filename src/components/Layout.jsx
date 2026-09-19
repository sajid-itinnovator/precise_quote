import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, TopBar, BottomNav } from './Navigation';
import { NewProjectModal } from './Modals';
import { InstallAppModal, InstallAppBanner } from './InstallAppModal';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, LogOut, Building2, Settings, User, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export function Layout({ children, title }) {
  const [showNewProject, setShowNewProject] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showAccountDrawer, setShowAccountDrawer] = useState(false);

  return (
    <>
      {/* ONE shell for every width. Sidebar/TopBar and MobileTopBar/BottomNav
          are display-toggled by CSS, so page content renders exactly once. */}
      <Sidebar
        onNewProject={() => setShowNewProject(true)}
        onOpenInstall={() => setShowInstallModal(true)}
      />
      <TopBar
        title={title}
        onOpenInstall={() => setShowInstallModal(true)}
      />
      <MobileTopBar
        title={title}
        onOpenInstall={() => setShowInstallModal(true)}
        onOpenAccount={() => setShowAccountDrawer(true)}
      />
      <main className="app-content">
        {children}
      </main>
      <BottomNav />
      <InstallAppBanner onOpenModal={() => setShowInstallModal(true)} />

      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} />}
      <InstallAppModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
      <UserAccountDrawer 
        isOpen={showAccountDrawer} 
        onClose={() => setShowAccountDrawer(false)} 
        onOpenInstall={() => { setShowAccountDrawer(false); setShowInstallModal(true); }}
      />
    </>
  );
}

function MobileTopBar({ onOpenInstall, onOpenAccount }) {
  const { userProfile, logout } = useAuth();
  const { tenantLogo, companyProfile } = useApp();
  const { isStandalone } = usePWAInstall();
  const navigate = useNavigate();

  const tenantBrandName = companyProfile?.companyName || userProfile?.tenantName || 'Workspace';
  const subtitle = companyProfile?.workspaceSubtitle || (companyProfile?.tagline ? companyProfile.tagline : 'Interior Studio');
  const initials = userProfile?.name 
    ? userProfile.name.substring(0,2).toUpperCase() 
    : (tenantBrandName ? tenantBrandName.substring(0, 2).toUpperCase() : 'PQ');

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <header className="mobile-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
        {tenantLogo ? (
          <img src={tenantLogo} alt="Logo" style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 34, height: 34, borderRadius: 6, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold', flexShrink: 0 }}>
            {tenantBrandName ? tenantBrandName.substring(0, 1).toUpperCase() : 'W'}
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="truncate" style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {tenantBrandName}
          </div>
          <div className="truncate" style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {subtitle}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {!isStandalone && (
          <button
            onClick={onOpenInstall}
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              padding: '4px 9px',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(26, 86, 255, 0.25)'
            }}
            title="Install App"
          >
            <Smartphone size={13} />
            <span>App</span>
          </button>
        )}

        {/* 1-Tap Logout Button on Mobile Topbar */}
        <button
          onClick={handleLogout}
          style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: 8,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Log Out of Workspace"
        >
          <LogOut size={16} />
        </button>

        {/* Avatar opens Account Drawer */}
        <div 
          onClick={onOpenAccount}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.7rem',
            flexShrink: 0,
            cursor: 'pointer',
            border: '2px solid rgba(255,255,255,0.2)'
          }}
          title="Open Account Menu"
        >
          {initials}
        </div>
      </div>
    </header>
  );
}

function UserAccountDrawer({ isOpen, onClose, onOpenInstall }) {
  const { currentUser, userProfile, isPlatformAdmin, logout } = useAuth();
  const { companyProfile } = useApp();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const tenantBrandName = companyProfile?.companyName || userProfile?.tenantName || 'Workspace';
  const initials = userProfile?.name 
    ? userProfile.name.substring(0,2).toUpperCase() 
    : (tenantBrandName ? tenantBrandName.substring(0, 2).toUpperCase() : 'PQ');

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center'
    }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: 500,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        animation: 'slideUp 0.25s ease-out'
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
            Account & Session
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#e2e8f0',
              border: 'none',
              borderRadius: '50%',
              width: 30,
              height: 30,
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

        {/* User Identity Info */}
        <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--secondary) 0%, #1e3a8a 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 800,
              flexShrink: 0
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }} className="truncate">
                {userProfile?.name || 'Workspace User'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }} className="truncate">
                {currentUser?.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{
                  background: '#eff6ff',
                  color: 'var(--primary)',
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontWeight: 700,
                  border: '1px solid #bfdbfe'
                }}>
                  {tenantBrandName}
                </span>
                <span style={{
                  background: userProfile?.role === 'admin' ? '#fdf2f8' : '#f1f5f9',
                  color: userProfile?.role === 'admin' ? '#be185d' : '#475569',
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  {userProfile?.role || 'Staff'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Menu Options */}
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            onClick={() => handleNavigate('/company-profile')}
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontWeight: 600,
              fontSize: '0.9rem',
              color: '#1e293b',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Building2 size={18} color="var(--primary)" />
            <span>Manage Company Profile & Branding</span>
          </button>

          {userProfile?.role === 'admin' && (
            <button
              onClick={() => handleNavigate('/admin')}
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#1e293b',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Settings size={18} color="var(--primary)" />
              <span>Admin & Team Management</span>
            </button>
          )}

          {isPlatformAdmin && (
            <button
              onClick={() => handleNavigate('/super-admin')}
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontWeight: 700,
                fontSize: '0.9rem',
                color: '#1a56ff',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <ShieldCheck size={18} color="#1a56ff" />
              <span>Platform Super Admin (Tenants)</span>
            </button>
          )}

          <button
            onClick={onOpenInstall}
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontWeight: 600,
              fontSize: '0.9rem',
              color: '#1e293b',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Smartphone size={18} color="var(--primary)" />
            <span>Install Mobile / Desktop App</span>
          </button>
        </div>

        {/* Prominent Log Out Button */}
        <div style={{ padding: '12px 16px 28px', borderTop: '1px solid #f1f5f9' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: '1px solid #fca5a5',
              background: '#fef2f2',
              color: '#b91c1c',
              fontWeight: 800,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(185, 28, 28, 0.08)'
            }}
          >
            <LogOut size={20} />
            <span>Log Out of Precise Quote</span>
          </button>
        </div>
      </div>
    </div>
  );
}
