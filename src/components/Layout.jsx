import React, { useState } from 'react';
import { Sidebar, TopBar, BottomNav } from './Navigation';
import { NewProjectModal } from './Modals';

export function Layout({ children, title }) {
  const [showNewProject, setShowNewProject] = useState(false);

  return (
    <>
      {/* Desktop */}
      <div className="desktop-only" style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar onNewProject={() => setShowNewProject(true)} />
        <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TopBar title={title} />
          <main className="main-content">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile */}
      <div className="mobile-only mobile-layout">
        <MobileTopBar title={title} />
        <main className="mobile-content">
          {children}
        </main>
        <BottomNav />
      </div>

      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} />}
    </>
  );
}

function MobileTopBar({ title }) {
  return (
    <header className="mobile-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, background: 'var(--secondary)', borderRadius: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>V</span>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Vistara Interiors
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Project & Customer Hub
          </div>
        </div>
      </div>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.7rem' }}>
        VI
      </div>
    </header>
  );
}
