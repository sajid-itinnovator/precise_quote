import React, { useState } from 'react';
import { Search, TrendingUp, FileText, Eye, Pencil, Plus, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { formatIndianCurrency, formatDate } from '../utils/helpers';
import { NewProjectModal } from '../components/Modals';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import QuotationPreview from '../components/QuotationPreview';

const STATUS_BADGE = {
  'INVOICE CREATED': 'badge-primary',
  'APPROVED': 'badge-success',
  'IN PROGRESS': 'badge-success',
  'PENDING': 'badge-warning',
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

function ProjectCard({ project, client, latestQuote, index, onViewQuote }) {
  const navigate = useNavigate();

  // If there is an invoice/quote for this client/project, display its latest values
  const displayAmount = latestQuote?.total !== undefined ? (Number(latestQuote.total) || 0) : (project.amount || 0);
  const displayStatus = latestQuote?.status || project.status || 'DRAFT';

  const handleEdit = () => {
    if (latestQuote?.id) {
      if (latestQuote.status === 'APPROVED') {
        navigate(`/builder?revise=${latestQuote.id}`);
      } else {
        navigate(`/builder?edit=${latestQuote.id}`);
      }
    } else if (project.clientId) {
      navigate(`/builder?clientId=${project.clientId}`);
    } else {
      navigate('/builder');
    }
  };

  const handleView = () => {
    if (latestQuote && onViewQuote) {
      onViewQuote(latestQuote);
    } else {
      navigate('/history');
    }
  };

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
        <span className={`badge ${STATUS_BADGE[displayStatus] || 'badge-draft'}`} style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(255,255,255,0.92)',
          color: displayStatus === 'APPROVED' || displayStatus === 'IN PROGRESS' ? '#166534' : displayStatus === 'INVOICE CREATED' ? '#1d4ed8' : displayStatus === 'COMMERCIAL' ? '#5b21b6' : '#374151',
          fontWeight: 700,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {displayStatus}
        </span>
      </div>
      <div className="project-card-body">
        <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 2 }}>{project.name}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
          Client: {client?.name || 'Unknown'}
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>
            ₹{formatIndianCurrency(displayAmount)}
          </div>
          {latestQuote && (
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <span>Latest Invoice #{latestQuote.quotationNo}</span>
              {(latestQuote.date || latestQuote.createdAt) && (
                <>
                  <span style={{ opacity: 0.6 }}>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Calendar size={10} style={{ opacity: 0.7 }} />
                    {formatDate(latestQuote.date || latestQuote.createdAt)}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {(project.tags || []).map(tag => <span key={tag} className="tag">{tag}</span>)}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={handleView}>
            <Eye size={14} /> View
          </button>
          <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleEdit}>
            <Pencil size={14} /> {latestQuote?.status === 'APPROVED' ? 'Revise' : 'Edit'}
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
  const [previewQuotation, setPreviewQuotation] = useState(null);

  const totalRevenue = quotations.filter(q => q.status === 'APPROVED').reduce((s, q) => s + (q.total || 0), 0);
  const pendingQuotes = quotations.filter(q => q.status === 'PENDING');
  const pendingValue = pendingQuotes.reduce((s, q) => s + (q.total || 0), 0);

  const getClient = (clientId) => clients.find(c => c.id === clientId);

  // Helper to find the latest invoice/quotation for a given project or client
  const getLatestQuote = (project) => {
    if (!quotations || quotations.length === 0) return null;
    const client = getClient(project.clientId);
    const clientNameNorm = (client?.name || '').trim().toLowerCase();
    const projNameNorm = (project.name || '').trim().toLowerCase();

    // Find all matching quotations for this project/client
    const matches = quotations.filter(q => {
      // Direct clientId match
      if (project.clientId && q.clientId === project.clientId) return true;
      // Client name match
      if (clientNameNorm && (q.clientName || '').trim().toLowerCase() === clientNameNorm) return true;
      // Project title match with project name
      if (projNameNorm && (q.projectTitle || '').trim().toLowerCase().includes(projNameNorm)) return true;
      return false;
    });

    if (matches.length === 0) return null;

    // Sort by createdAt or date descending to get the latest invoice
    matches.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date || 0).getTime();
      const timeB = new Date(b.createdAt || b.date || 0).getTime();
      return timeB - timeA;
    });

    return matches[0];
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (getClient(p.clientId)?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  // ─── Analytics Data Prep ───────────────────────────────────────────────
  
  // 1. Conversion Rates (Pie Chart)
  const statusCounts = quotations.reduce((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});
  const conversionData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = { 'DRAFT': '#94a3b8', 'PENDING': '#eab308', 'APPROVED': '#22c55e', 'REJECTED': '#ef4444', 'COMMERCIAL': '#8b5cf6' };

  // 2. Monthly Revenue & Growth (Area & Bar Charts)
  const monthlyDataMap = {};
  quotations.forEach(q => {
    if (!q.date) return;
    const month = q.date.substring(0, 7); // e.g. "2026-05"
    if (!monthlyDataMap[month]) {
      monthlyDataMap[month] = { name: month, revenue: 0, quotes: 0 };
    }
    monthlyDataMap[month].quotes += 1;
    if (q.status === 'APPROVED' || q.status === 'COMMERCIAL') {
      monthlyDataMap[month].revenue += (Number(q.total) || 0);
    }
  });
  
  const monthlyData = Object.values(monthlyDataMap).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      {/* Hero */}
      <div className="hero-banner">
        <div className="hero-title">Create something<br />new today.</div>
        <div className="hero-sub">Launch a new client project or add a new contact to your professional hub.</div>
        <button 
          type="button"
          className="btn" 
          style={{ 
            background: '#fff', 
            color: 'var(--primary)', 
            fontWeight: 700, 
            gap: 8,
            position: 'relative',
            zIndex: 5,
            cursor: 'pointer'
          }} 
          onClick={() => setShowNewProject(true)}
        >
          <Plus size={16} />
          <span>Add New Customer/Project</span>
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

      {/* Analytics Dashboard */}
      {quotations.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 32, marginBottom: 16 }}>
            <div>
              <div className="section-title">Analytics Overview</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Revenue and conversion metrics</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 32 }}>
            {/* Revenue Trend Area Chart */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: 16 }}>Revenue Growth</div>
              <div style={{ height: 220, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={(value) => `₹${value >= 100000 ? (value/100000).toFixed(1) + 'L' : value}`} />
                    <Tooltip formatter={(value) => `₹${formatIndianCurrency(value)}`} />
                    <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Conversion Rates Pie Chart */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: 16 }}>Conversion Rates (Quotes)</div>
              <div style={{ height: 220, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={conversionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {conversionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || 'var(--primary)'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 10 }}>
                {conversionData.map(entry => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[entry.name] || 'var(--primary)' }} />
                    {entry.name}: {entry.value}
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Output Bar Chart */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: 16 }}>Quotations Generated</div>
              <div style={{ height: 220, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                    <Tooltip />
                    <Bar dataKey="quotes" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

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
          <ProjectCard
            key={p.id}
            project={p}
            client={getClient(p.clientId)}
            latestQuote={getLatestQuote(p)}
            index={i}
            onViewQuote={(q) => setPreviewQuotation(q)}
          />
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

      {previewQuotation && (
        <QuotationPreview quotation={previewQuotation} onClose={() => setPreviewQuotation(null)} />
      )}
    </div>
  );
}
