import React, { useState } from 'react';
import { Search, TrendingUp, FileText, Eye, Pencil, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { formatIndianCurrency } from '../utils/helpers';
import { NewProjectModal } from '../components/Modals';

const STATUS_BADGE = {
  'IN PROGRESS': 'badge-success',
  'DRAFT': 'badge-draft',
  'COMMERCIAL': 'badge-commercial',
  'COMPLETED': 'badge-info',
};

const PROJECT_COLORS = [
  'linear-gradient(135deg, #0d40cc, #1a56ff)',
  'linear-gradient(135deg, #064e3b, #047857)',
  'linear-gradient(135deg, #1e1b4b, #3730a3)',
  'linear-gradient(135deg, #7c2d12, #c2410c)',
  'linear-gradient(135deg, #0c4a6e, #0284c7)',
];

function ProjectCard({ project, client, index }) {
  const navigate = useNavigate();

  return (
    <div className="project-card" style={{ position: 'relative' }}>
      <div style={{
        height: 140,
        background: PROJECT_COLORS[index % PROJECT_COLORS.length],
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '12px',
      }}>
        {/* Abstract geometric decoration */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          width: 60, height: 60, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <div style={{
          position: 'absolute', top: 30, right: 30,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <span className={`badge ${STATUS_BADGE[project.status] || 'badge-draft'}`} style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(255,255,255,0.9)',
          color: project.status === 'IN PROGRESS' ? '#166534' : project.status === 'COMMERCIAL' ? '#5b21b6' : '#374151',
        }}>
          {project.status}
        </span>
      </div>
      <div className="project-card-body">
        <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 2 }}>{project.name}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
          Client: {client?.name || 'Unknown'}
        </div>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)', marginBottom: 10 }}>
          ₹{formatIndianCurrency(project.amount || 0)}
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {(project.tags || []).map(tag => <span key={tag} className="tag">{tag}</span>)}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => navigate('/history')}>
            <Eye size={14} /> View
          </button>
          <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => navigate('/builder')}>
            <Pencil size={14} /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Hub() {
  const { clients, projects, quotations } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);

  const totalRevenue = quotations.filter(q => q.status === 'APPROVED').reduce((s, q) => s + (q.total || 0), 0);
  const pendingQuotes = quotations.filter(q => q.status === 'PENDING');
  const pendingValue = pendingQuotes.reduce((s, q) => s + (q.total || 0), 0);

  const getClient = (clientId) => clients.find(c => c.id === clientId);

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (getClient(p.clientId)?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Hero */}
      <div className="hero-banner">
        <div className="hero-title">Create something<br />new today.</div>
        <div className="hero-sub">Launch a new client project or add a new contact to your professional hub.</div>
        <button className="btn" style={{ background: '#fff', color: 'var(--primary)', fontWeight: 700, gap: 8 }} onClick={() => setShowNewProject(true)}>
          <Plus size={16} />
          Add New Customer/Project
        </button>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">₹{formatIndianCurrency(totalRevenue)}</div>
            </div>
            <div style={{ width: 36, height: 36, background: 'var(--primary-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
            </div>
          </div>
          <div className="stat-change">+12% from last month</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">Pending Quotes</div>
              <div className="stat-value">₹{formatIndianCurrency(pendingValue)}</div>
            </div>
            <div style={{ width: 36, height: 36, background: '#fef9c3', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} style={{ color: '#713f12' }} />
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{pendingQuotes.length} Quote{pendingQuotes.length !== 1 ? 's' : ''} awaiting approval</div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="section-header">
        <div>
          <div className="section-title">Recent Projects</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Manage and track your active interior commissions</div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }} onClick={() => navigate('/history')}>
          View All →
        </button>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom: 16 }}>
        <Search size={15} style={{ color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers or projects..." />
      </div>

      {/* Project grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {filtered.length > 0 ? filtered.map((p, i) => (
          <ProjectCard key={p.id} project={p} client={getClient(p.clientId)} index={i} />
        )) : (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state-icon">📋</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No projects found</div>
            <div className="text-sm">Create your first project to get started</div>
          </div>
        )}
      </div>

      {/* FAB on mobile */}
      <button className="fab mobile-only" onClick={() => setShowNewProject(true)}>
        <Plus size={22} />
      </button>

      {/* Status bar (desktop) */}
      <div className="desktop-only" style={{ marginTop: 32, padding: '12px 16px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>System Live: All project modules operating at peak performance.</span>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last Sync: 2 Minutes Ago</span>
      </div>

      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} />}
    </div>
  );
}
