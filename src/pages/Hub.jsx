import React, { useState } from 'react';
import { Search, TrendingUp, FileText, Eye, Pencil, Plus, Calendar, Trash2, CheckCircle, Clock, FileCheck, FileEdit, XCircle, ArrowRight } from 'lucide-react';
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
  'REJECTED': 'badge-danger',
  'REJECT': 'badge-danger',
};

const PROJECT_COLORS = [
  'linear-gradient(135deg, #0d40cc, #1a56ff)',
  'linear-gradient(135deg, #064e3b, #047857)',
  'linear-gradient(135deg, #1e1b4b, #3730a3)',
  'linear-gradient(135deg, #7c2d12, #c2410c)',
  'linear-gradient(135deg, #0c4a6e, #0284c7)',
];

function ProjectCard({ project, client, latestQuote, index, onViewQuote, onDeleteProject, onUpdateStatus }) {
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
        {/* Delete Project button */}
        {onDeleteProject && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Are you sure you want to delete project "${project.name}"?`)) {
                onDeleteProject(project.id);
              }
            }}
            style={{
              position: 'absolute', top: 10, left: 10,
              background: 'rgba(0,0,0,0.35)',
              border: 'none',
              borderRadius: '50%',
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              transition: 'background 0.2s',
              zIndex: 2,
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.9)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
            title="Delete Project"
          >
            <Trash2 size={13} />
          </button>
        )}

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

        {/* Interactive Status Selector on Project Tile */}
        <select
          value={displayStatus}
          onChange={(e) => {
            const newStat = e.target.value;
            if (onUpdateStatus) {
              onUpdateStatus(project.id, newStat, latestQuote?.id);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(255,255,255,0.95)',
            color: (displayStatus === 'APPROVED' || displayStatus === 'IN PROGRESS' || displayStatus === 'COMPLETED') ? '#166534'
                 : displayStatus === 'INVOICE CREATED' ? '#1d4ed8'
                 : (displayStatus === 'REJECTED' || displayStatus === 'REJECT') ? '#b91c1c'
                 : displayStatus === 'PENDING' ? '#b45309'
                 : displayStatus === 'COMMERCIAL' ? '#5b21b6'
                 : '#374151',
            fontWeight: 700,
            fontSize: '0.72rem',
            padding: '3px 7px',
            borderRadius: 4,
            border: '1px solid rgba(0,0,0,0.15)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            outline: 'none',
            zIndex: 2,
          }}
          title="Project Status: Click to change to Approved, Reject, Pending, etc."
        >
          <option value="DRAFT">DRAFT</option>
          <option value="INVOICE CREATED">INVOICE CREATED</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECT</option>
          <option value="IN PROGRESS">IN PROGRESS</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
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
  const { clients, projects, quotations, deleteProject, updateProject, updateQuotation } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState(null);

  const handleUpdateStatus = async (projectId, newStatus, latestQuoteId) => {
    try {
      await updateProject(projectId, { status: newStatus });
      if (latestQuoteId) {
        await updateQuotation(latestQuoteId, { status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  // ─── Quotation Stages & Financial Metric Totals ───
  const approvedQuotes = quotations.filter(q => q.status === 'APPROVED');
  const totalRevenue = approvedQuotes.reduce((s, q) => s + (q.total || 0), 0);

  const pendingQuotes = quotations.filter(q => q.status === 'PENDING');
  const pendingValue = pendingQuotes.reduce((s, q) => s + (q.total || 0), 0);

  const invoiceCreatedQuotes = quotations.filter(q => q.status === 'INVOICE CREATED');
  const invoiceCreatedValue = invoiceCreatedQuotes.reduce((s, q) => s + (q.total || 0), 0);

  const draftQuotes = quotations.filter(q => q.status === 'DRAFT' || !q.status);
  const draftValue = draftQuotes.reduce((s, q) => s + (q.total || 0), 0);

  const rejectedQuotes = quotations.filter(q => q.status === 'REJECTED' || q.status === 'REJECT');
  const rejectedValue = rejectedQuotes.reduce((s, q) => s + (q.total || 0), 0);

  const stageTiles = [
    {
      id: 'approved',
      status: 'APPROVED',
      label: 'Approved / Total Revenue',
      subtitle: `${approvedQuotes.length} Closed Won`,
      amount: totalRevenue,
      count: approvedQuotes.length,
      icon: CheckCircle,
      iconColor: '#16a34a',
      iconBg: '#dcfce7',
      borderColor: '#bbf7d0',
      badgeClass: 'badge-success',
      actionText: 'View Approved'
    },
    {
      id: 'pending',
      status: 'PENDING',
      label: 'Pending Quotes',
      subtitle: `${pendingQuotes.length} Awaiting Client Decision`,
      amount: pendingValue,
      count: pendingQuotes.length,
      icon: Clock,
      iconColor: '#d97706',
      iconBg: '#fef3c7',
      borderColor: '#fde68a',
      badgeClass: 'badge-warning',
      actionText: 'Review Pending'
    },
    {
      id: 'invoice_created',
      status: 'INVOICE CREATED',
      label: 'Invoices Created',
      subtitle: `${invoiceCreatedQuotes.length} Formal Invoices Issued`,
      amount: invoiceCreatedValue,
      count: invoiceCreatedQuotes.length,
      icon: FileCheck,
      iconColor: '#2563eb',
      iconBg: '#dbeafe',
      borderColor: '#bfdbfe',
      badgeClass: 'badge-primary',
      actionText: 'View Invoices'
    },
    {
      id: 'draft',
      status: 'DRAFT',
      label: 'Draft Quotations',
      subtitle: `${draftQuotes.length} Work In Progress`,
      amount: draftValue,
      count: draftQuotes.length,
      icon: FileEdit,
      iconColor: '#64748b',
      iconBg: '#f1f5f9',
      borderColor: '#e2e8f0',
      badgeClass: 'badge-draft',
      actionText: 'Open Drafts'
    },
    {
      id: 'rejected',
      status: 'REJECTED',
      label: 'Lost / Rejected',
      subtitle: `${rejectedQuotes.length} Declined Proposals`,
      amount: rejectedValue,
      count: rejectedQuotes.length,
      icon: XCircle,
      iconColor: '#dc2626',
      iconBg: '#fee2e2',
      borderColor: '#fecaca',
      badgeClass: 'badge-danger',
      actionText: 'View Lost'
    },
  ];

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

      {/* Quotation Pipeline & Stages Overview */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--secondary)' }}>
              Quotation Pipeline &amp; Stages
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Real-time financial status, pipeline distribution, and stages
            </div>
          </div>
          <button 
            className="btn btn-ghost btn-sm" 
            style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => navigate('/history')}
          >
            Full Archive <ArrowRight size={14} />
          </button>
        </div>

        {/* 5-Stage Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 12,
        }}>
          {stageTiles.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.id}
                onClick={() => navigate(`/history?status=${encodeURIComponent(stage.status)}`)}
                className="stat-card"
                style={{
                  cursor: 'pointer',
                  border: `1px solid ${stage.borderColor}`,
                  background: 'var(--surface)',
                  padding: '16px 14px',
                  borderRadius: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'transform 0.16s, box-shadow 0.16s, border-color 0.16s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 120,
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                }}
                title={`Click to filter quotes in ${stage.status} stage`}
              >
                {/* Top header: Title & Icon */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                      {stage.label}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                      ₹{formatIndianCurrency(stage.amount)}
                    </div>
                  </div>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: stage.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={18} color={stage.iconColor} />
                  </div>
                </div>

                {/* Bottom footer: count pill & CTA link */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-light)', paddingTop: 8, marginTop: 4 }}>
                  <span className={`badge ${stage.badgeClass}`} style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                    {stage.count} Quote{stage.count !== 1 ? 's' : ''}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    {stage.actionText} →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Projects (Appears before Analytics Overview) */}
      <div className="section-header" style={{ marginTop: 24 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
        {filtered.length > 0 ? filtered.map((p, i) => (
          <ProjectCard
            key={p.id}
            project={p}
            client={getClient(p.clientId)}
            latestQuote={getLatestQuote(p)}
            index={i}
            onViewQuote={(q) => setPreviewQuotation(q)}
            onDeleteProject={deleteProject}
            onUpdateStatus={handleUpdateStatus}
          />
        )) : (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state-icon">📋</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No projects found</div>
            <div className="text-sm">Create your first project to get started</div>
          </div>
        )}
      </div>

      {/* Analytics Dashboard */}
      {quotations.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 16, marginBottom: 16 }}>
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
