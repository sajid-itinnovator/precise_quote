import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Users, Phone, Mail, MapPin, FileText, Eye, Copy, Calendar, X, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatIndianCurrency, formatDate, formatDateTime } from '../utils/helpers';
import { ClientModal, ConfirmModal } from '../components/Modals';
import QuotationPreview from '../components/QuotationPreview';

const STATUS_BADGE = {
  'INVOICE CREATED': 'badge-primary',
  APPROVED: 'badge-success',
  PENDING: 'badge-warning',
  DRAFT: 'badge-draft',
};

// ─── Client Invoices & History Modal ───────────────────────────────────────
function ClientInvoicesModal({ client, onClose }) {
  const navigate = useNavigate();
  const { quotations, deleteQuotation } = useApp();
  const [previewQuotation, setPreviewQuotation] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Filter invoices for this client, sorted newest first
  const clientQuotes = quotations
    .filter(q => q.clientId === client.id)
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {client.name}
              </h3>
              <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                {clientQuotes.length} Historical Record{clientQuotes.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {client.contact && <span><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />{client.contact}</span>}
              {client.email && <span><Mail size={12} style={{ display: 'inline', marginRight: 4 }} />{client.email}</span>}
              {client.address && <span><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />{client.address}</span>}
            </div>
          </div>
          <button className="btn-icon btn-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Action toolbar inside modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 10px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Invoices &amp; Quotations History
          </span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              onClose();
              navigate(`/builder?clientId=${client.id}`);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> New Quotation for {client.name.split(' ')[0]}
          </button>
        </div>

        {/* Invoice list */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {clientQuotes.length === 0 ? (
            <div className="empty-state" style={{ padding: '36px 16px', background: 'var(--surface-2)', borderRadius: 8 }}>
              <div className="empty-state-icon"><FileText size={36} /></div>
              <div style={{ fontWeight: 600, margin: '6px 0 2px' }}>No invoices or quotations yet</div>
              <div className="text-sm" style={{ marginBottom: 14 }}>Create the first estimate or invoice for this client</div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  navigate(`/builder?clientId=${client.id}`);
                }}
              >
                Create First Quotation
              </button>
            </div>
          ) : (
            clientQuotes.map(q => {
              const statusClass = STATUS_BADGE[q.status] || (q.status === 'INVOICE CREATED' ? 'badge-primary' : 'badge-draft');
              const itemCount = (q.rooms || []).reduce((s, r) => s + (r.items || []).length, 0);

              return (
                <div
                  key={q.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 8,
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {q.projectTitle || 'Interior Project'}
                        </span>
                        <span className={`badge ${statusClass}`} style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                          {q.status || 'DRAFT'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          #{q.quotationNo || 'QT'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} />
                          {formatDateTime(q.createdAt || q.date)}
                        </span>
                        <span>•</span>
                        <span>{(q.rooms || []).length} Rooms, {itemCount} Items</span>
                        {q.totalSqft > 0 && <span>• {q.totalSqft} SQFT</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        ₹{formatIndianCurrency(q.total || 0)}
                      </div>
                      {q.createdByName && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          by {q.createdByName}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, paddingTop: 6, borderTop: '1px dashed var(--border-light)' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPreviewQuotation(q)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', padding: '5px 10px' }}
                    >
                      <Eye size={13} /> View &amp; Print
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${q.status === 'DRAFT' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => {
                        onClose();
                        navigate(`/builder?edit=${q.id}`);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', padding: '5px 10px', fontWeight: q.status === 'DRAFT' ? 700 : 500 }}
                      title={q.status === 'DRAFT' ? "Edit this draft quotation in Builder" : "Edit this invoice directly in Builder"}
                    >
                      <Pencil size={13} /> {q.status === 'DRAFT' ? 'Edit Draft' : 'Edit Invoice'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        onClose();
                        navigate(`/builder?revise=${q.id}`);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', padding: '5px 10px' }}
                      title="Create a new revision while keeping this version"
                    >
                      <Copy size={13} /> Create Revision
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-ghost"
                      onClick={() => setDeleteId(q.id)}
                      style={{ color: 'var(--danger)', padding: 6 }}
                      title="Delete invoice"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quotation Preview Modal */}
        {previewQuotation && (
          <QuotationPreview
            quotation={previewQuotation}
            onClose={() => setPreviewQuotation(null)}
          />
        )}

        {/* Delete confirmation */}
        {deleteId && (
          <ConfirmModal
            message="Delete this historical invoice? This action cannot be undone."
            onConfirm={async () => {
              await deleteQuotation(deleteId);
              setDeleteId(null);
            }}
            onClose={() => setDeleteId(null)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Main Clients Page ────────────────────────────────────────────────────
export default function Clients() {
  const { clients, deleteClient, quotations } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedClientForInvoices, setSelectedClientForInvoices] = useState(null);

  const getQuoteCount = (clientId) => quotations.filter(q => q.clientId === clientId).length;

  const initials = (name) => (name || 'UN').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Manage client profiles and view individual historical invoices.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditClient(null); setShowModal(true); }}>
          <Plus size={15} /> New Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={40} /></div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No clients yet</div>
          <div className="text-sm">Add your first client to get started</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {clients.map(client => {
            const count = getQuoteCount(client.id);
            return (
              <div key={client.id} className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="avatar" style={{ width: 44, height: 44, fontSize: '1rem', background: 'var(--secondary)', color: '#fff' }}>
                        {initials(client.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{client.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {count} Historical Invoice{count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon btn-ghost" onClick={() => { setEditClient(client); setShowModal(true); }}><Pencil size={15} /></button>
                      <button className="btn-icon btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setDeleteId(client.id)}><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {client.contact && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <Phone size={13} /> {client.contact}
                      </div>
                    )}
                    {client.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <Mail size={13} /> {client.email}
                      </div>
                    )}
                    {client.address && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={13} /> {client.address}
                      </div>
                    )}
                  </div>
                </div>

                {/* View Invoices Trigger Button */}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontWeight: 600 }}
                  onClick={() => setSelectedClientForInvoices(client)}
                >
                  <FileText size={14} /> View Invoices ({count})
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Client Historical Invoices Modal */}
      {selectedClientForInvoices && (
        <ClientInvoicesModal
          client={selectedClientForInvoices}
          onClose={() => setSelectedClientForInvoices(null)}
        />
      )}

      {showModal && (
        <ClientModal client={editClient} onClose={() => { setShowModal(false); setEditClient(null); }} />
      )}
      {deleteId && (
        <ConfirmModal
          message="Delete this client? Their quotation records will remain."
          onConfirm={() => deleteClient(deleteId)}
          onClose={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
