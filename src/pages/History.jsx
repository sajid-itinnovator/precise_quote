import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, MoreVertical, Eye, Trash2, FileText, Pencil, Copy, Calendar, MessageSquare, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatIndianCurrency, formatDateTime } from '../utils/helpers';
import { ConfirmModal } from '../components/Modals';
import QuotationPreview from '../components/QuotationPreview';
import WhatsAppShareModal from '../components/WhatsAppShareModal';

const STATUS_BADGE = {
  'INVOICE CREATED': 'badge-primary',
  APPROVED: 'badge-success',
  PENDING: 'badge-warning',
  DRAFT: 'badge-draft',
  REJECTED: 'badge-danger',
  REJECT: 'badge-danger',
};

const PAGE_SIZE = 10;

function QuotationCard({ quotation, onDelete, onView, onWhatsApp, onUpdateStatus }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = (quotation.clientName || 'UN').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="history-item" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div className="avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }} className="truncate">{quotation.clientName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={11} /> {formatDateTime(quotation.createdAt || quotation.date)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                ₹{formatIndianCurrency(quotation.total || 0)}
              </div>
              <button
                className="btn-icon btn-ghost"
                onClick={() => setMenuOpen(m => !m)}
                style={{ padding: 4 }}
              >
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px dashed var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span className={`badge ${STATUS_BADGE[quotation.status] || 'badge-draft'}`} style={{ fontSize: '0.65rem' }}>
                #{quotation.quotationNo}
              </span>
              {quotation.status && (
                <span className={`badge ${STATUS_BADGE[quotation.status] || 'badge-draft'}`} style={{ fontSize: '0.65rem' }}>
                  {quotation.status}
                </span>
              )}
              {quotation.projectTitle && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }} className="truncate">
                  {quotation.projectTitle}
                </span>
              )}
            </div>

            {/* Direct action buttons on card for 1-click access */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {quotation.status !== 'APPROVED' ? (
                <button
                  type="button"
                  className={`btn btn-sm ${quotation.status === 'DRAFT' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => navigate(`/builder?edit=${quotation.id}`)}
                  title={quotation.status === 'DRAFT' ? 'Edit this draft invoice in Builder' : 'Edit this invoice'}
                >
                  <Pencil size={12} />
                  {quotation.status === 'DRAFT' ? 'Edit Draft' : 'Edit Invoice'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => navigate(`/builder?revise=${quotation.id}`)}
                  title="Approved invoice is locked. Click to create a new revision."
                >
                  <Copy size={12} /> Revise
                </button>
              )}

              <button
                type="button"
                className="btn btn-sm btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={onView}
              >
                <Eye size={12} /> View
              </button>

              <button
                type="button"
                className="btn btn-sm"
                style={{
                  padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600,
                  background: '#25D366', color: '#fff', border: 'none',
                  display: 'flex', alignItems: 'center', gap: 4,
                  boxShadow: '0 1px 4px rgba(37,211,102,0.3)'
                }}
                onClick={onWhatsApp}
                title="Send invoice to client on WhatsApp"
              >
                <MessageSquare size={12} /> WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div style={{
          position: 'absolute', top: 36, right: 12, zIndex: 10,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-md)', minWidth: 175, overflow: 'hidden',
        }}>
          <button
            className="btn-ghost"
            style={{ width: '100%', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', justifyContent: 'flex-start' }}
            onClick={() => { onView(); setMenuOpen(false); }}
          >
            <Eye size={14} /> View &amp; Print
          </button>
          <button
            className="btn-ghost"
            style={{ width: '100%', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', justifyContent: 'flex-start', color: '#16a34a', fontWeight: 600 }}
            onClick={() => { onWhatsApp(); setMenuOpen(false); }}
          >
            <MessageSquare size={14} /> Send on WhatsApp
          </button>
          {quotation.status !== 'APPROVED' && (
            <button
              className="btn-ghost"
              style={{ width: '100%', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', justifyContent: 'flex-start', fontWeight: quotation.status === 'DRAFT' ? 700 : 400 }}
              onClick={() => {
                setMenuOpen(false);
                navigate(`/builder?edit=${quotation.id}`);
              }}
            >
              <Pencil size={14} /> {quotation.status === 'DRAFT' ? 'Edit Draft Invoice' : 'Edit Invoice'}
            </button>
          )}
          <button
            className="btn-ghost"
            style={{ width: '100%', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', justifyContent: 'flex-start' }}
            onClick={() => {
              setMenuOpen(false);
              navigate(`/builder?revise=${quotation.id}`);
            }}
          >
            <Copy size={14} /> Create Revision
          </button>

          {/* Quick Status Changers */}
          {onUpdateStatus && (
            <>
              <div style={{ height: 1, background: 'var(--border-light)', margin: '4px 0' }} />
              <div style={{ padding: '4px 14px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Set Status
              </div>
              <button
                className="btn-ghost"
                style={{ width: '100%', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', justifyContent: 'flex-start', color: '#16a34a' }}
                onClick={() => { onUpdateStatus(quotation.id, 'APPROVED'); setMenuOpen(false); }}
              >
                <CheckCircle size={13} /> Mark Approved
              </button>
              <button
                className="btn-ghost"
                style={{ width: '100%', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', justifyContent: 'flex-start', color: '#d97706' }}
                onClick={() => { onUpdateStatus(quotation.id, 'PENDING'); setMenuOpen(false); }}
              >
                <Clock size={13} /> Mark Pending
              </button>
              <button
                className="btn-ghost"
                style={{ width: '100%', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', justifyContent: 'flex-start', color: '#dc2626' }}
                onClick={() => { onUpdateStatus(quotation.id, 'REJECTED'); setMenuOpen(false); }}
              >
                <XCircle size={13} /> Mark Rejected
              </button>
            </>
          )}

          <div style={{ height: 1, background: 'var(--border-light)', margin: '4px 0' }} />
          <button
            className="btn-ghost"
            style={{ width: '100%', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--danger)', justifyContent: 'flex-start' }}
            onClick={() => { onDelete(); setMenuOpen(false); }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}


export default function History() {
  const { quotations, deleteQuotation, updateQuotation, updateProject, projects } = useApp();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialStatus = queryParams.get('status') || 'ALL';

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState(initialStatus);
  const [showFilters, setShowFilters] = useState(initialStatus !== 'ALL');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [previewQuotation, setPreviewQuotation] = useState(null);
  const [whatsAppQuotation, setWhatsAppQuotation] = useState(null);

  /* eslint-disable react-hooks/set-state-in-effect -- URL param is the source of truth; apply it to local filter state on change */
  useEffect(() => {
    const s = new URLSearchParams(location.search).get('status');
    if (s) {
      setFilterStatus(s);
      setShowFilters(true);
      setPage(1);
    }
  }, [location.search]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleUpdateStatus = async (quotationId, newStatus) => {
    try {
      await updateQuotation(quotationId, { status: newStatus });
      // Sync corresponding project in Firestore
      const q = quotations.find(item => item.id === quotationId);
      if (q && projects && updateProject) {
        const qProjTitle = (q.projectTitle || '').toLowerCase();
        const matchingProj = projects.find(p =>
          (q.projectId && p.id === q.projectId) ||
          (p.clientId && q.clientId && p.clientId === q.clientId) ||
          (p.name && qProjTitle && qProjTitle.includes(p.name.toLowerCase()))
        );
        if (matchingProj) {
          await updateProject(matchingProj.id, { status: newStatus });
        }
      }
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const filtered = quotations.filter(q => {
    const matchSearch = (q.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.quotationNo || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.projectTitle || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || q.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);


  return (
    <div>
      <h1 className="page-title">Quotation History</h1>
      <p className="page-subtitle">View and manage historical customer quotations through your studio archive.</p>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom: 8 }}>
        <Search size={15} style={{ color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by customer name, QT number..." />
      </div>

      {/* Filters toggle */}
      <button className="btn btn-secondary w-full" style={{ marginBottom: 16 }} onClick={() => setShowFilters(f => !f)}>
        <Filter size={14} />
        Filters
        {filterStatus !== 'ALL' && <span className="badge badge-info" style={{ marginLeft: 4 }}>{filterStatus}</span>}
      </button>

      {showFilters && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, padding: '12px 14px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
          {['ALL', 'INVOICE CREATED', 'APPROVED', 'PENDING', 'REJECTED', 'DRAFT'].map(s => (
            <button
              key={s}
              className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setFilterStatus(s); setPage(1); }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {paged.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FileText size={40} /></div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No quotations found</div>
          <div className="text-sm">Create your first quotation in the Builder tab</div>
        </div>
      ) : (
        paged.map(q => (
          <QuotationCard
            key={q.id}
            quotation={q}
            onDelete={() => setDeleteId(q.id)}
            onView={() => setPreviewQuotation(q)}
            onWhatsApp={() => setWhatsAppQuotation(q)}
            onUpdateStatus={handleUpdateStatus}
          />
        ))
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 10 }}>
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} quotations
          </div>
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
          </div>
        </>
      )}

      {deleteId && (
        <ConfirmModal
          message="Are you sure you want to delete this quotation? This cannot be undone."
          onConfirm={() => deleteQuotation(deleteId)}
          onClose={() => setDeleteId(null)}
        />
      )}

      {previewQuotation && (
        <QuotationPreview quotation={previewQuotation} onClose={() => setPreviewQuotation(null)} />
      )}

      {whatsAppQuotation && (
        <WhatsAppShareModal
          quotation={whatsAppQuotation}
          onClose={() => setWhatsAppQuotation(null)}
        />
      )}
    </div>
  );
}
