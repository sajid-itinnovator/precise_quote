import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Users, Phone, Mail, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ClientModal, ConfirmModal } from '../components/Modals';

export default function Clients() {
  const { clients, deleteClient, quotations } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const getQuoteCount = (clientId) => quotations.filter(q => q.clientId === clientId).length;

  const initials = (name) => (name || 'UN').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Manage your client profiles and contact information.</p>
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
          {clients.map(client => (
            <div key={client.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar" style={{ width: 44, height: 44, fontSize: '1rem', background: 'var(--secondary)', color: '#fff' }}>
                    {initials(client.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{client.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {getQuoteCount(client.id)} Quotation{getQuoteCount(client.id) !== 1 ? 's' : ''}
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
          ))}
        </div>
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
