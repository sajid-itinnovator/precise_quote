import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Eye, Trash2, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatIndianCurrency, formatDate } from '../utils/helpers';
import { ConfirmModal } from '../components/Modals';
import QuotationPreview from '../components/QuotationPreview';

const STATUS_BADGE = {
  APPROVED: 'badge-success',
  PENDING: 'badge-warning',
  DRAFT: 'badge-draft',
};

const PAGE_SIZE = 5;

function QuotationCard({ quotation, onDelete, onView }) {
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
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{formatDate(quotation.date)}</div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`badge ${STATUS_BADGE[quotation.status] || 'badge-draft'}`} style={{ fontSize: '0.65rem' }}>
              {quotation.quotationNo}
            </span>
            {quotation.status && (
              <span className={`badge ${STATUS_BADGE[quotation.status]}`} style={{ fontSize: '0.65rem' }}>
                {quotation.status}
              </span>
            )}
            {quotation.projectTitle && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }} className="truncate">
                {quotation.projectTitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {menuOpen && (
        <div style={{
          position: 'absolute', top: 36, right: 12, zIndex: 10,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-md)', minWidth: 140, overflow: 'hidden',
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
  const { quotations, deleteQuotation } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [previewQuotation, setPreviewQuotation] = useState(null);

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
          {['ALL', 'APPROVED', 'PENDING', 'DRAFT'].map(s => (
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
    </div>
  );
}
