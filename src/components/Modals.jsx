import React, { useState } from 'react';
import { X, User, Building } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import ClientPicker from './ClientPicker';
import Modal from './Modal';
import { useToast } from './Toast';

function ModalOverlay({ children, onClose }) {
  return <Modal onClose={onClose}>{children}</Modal>;
}

// ---- New Project Modal ----
export function NewProjectModal({ onClose }) {
  const { addProject, addClient } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const [mode, setMode] = useState('existing'); // 'existing' | 'new'
  const [form, setForm] = useState({ name: '', clientId: '', status: 'DRAFT', tags: '' });
  const [newClient, setNewClient] = useState({ name: '', contact: '', email: '', address: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      let finalClientId = form.clientId;
      if (mode === 'new') {
        if (!newClient.name.trim()) {
          toast.error('Please enter a Client Name');
          setIsSubmitting(false);
          return;
        }
        finalClientId = await addClient(newClient);
      }
      if (!form.name.trim() || !finalClientId) {
        toast.error('Please select or create a client, and enter a project name.');
        setIsSubmitting(false);
        return;
      }
      
      const tagsArr = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const projectId = await addProject({
        name: form.name.trim(),
        clientId: finalClientId,
        status: form.status || 'DRAFT',
        tags: tagsArr,
        amount: 0
      });

      onClose();
      // Directly navigate to Quotation Builder with project title and client preloaded
      navigate(`/builder?clientId=${finalClientId}&projectTitle=${encodeURIComponent(form.name.trim())}&projectId=${projectId}`);
    } catch (err) {
      console.error('Failed to create project:', err);
      toast.error('An error occurred while creating the project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-header">
        <h2 className="modal-title">New Project</h2>
        <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Project Name</label>
          <input className="form-input" placeholder="e.g. Sharma Residence 3BHK" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
            <option value="DRAFT">Draft</option>
            <option value="IN PROGRESS">In Progress</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {/* Client toggle */}
        <div>
          <div className="form-label" style={{ marginBottom: 8 }}>Client</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button type="button" className={`btn btn-sm ${mode === 'existing' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('existing')}>
              <User size={14} /> Existing
            </button>
            <button type="button" className={`btn btn-sm ${mode === 'new' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('new')}>
              <Building size={14} /> New Client
            </button>
          </div>
          {mode === 'existing' ? (
            <ClientPicker
              value={form.clientId}
              onChange={(selectedId) => setForm(p => ({ ...p, clientId: selectedId }))}
              onAddNew={() => setMode('new')}
              placeholder="Select a client..."
              required
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="form-input" placeholder="Client Name" value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} required />
              <input className="form-input" placeholder="Contact (+91 ...)" value={newClient.contact} onChange={e => setNewClient(p => ({ ...p, contact: e.target.value }))} />
              <input className="form-input" placeholder="Email" value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))} />
              <input className="form-input" placeholder="Billing Address" value={newClient.address} onChange={e => setNewClient(p => ({ ...p, address: e.target.value }))} />
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Tags (comma separated)</label>
          <input className="form-input" placeholder="e.g. 2BHK, Luxury" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Create & Open Builder →</button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// ---- Add/Edit Client Modal ----
export function ClientModal({ client, onClose }) {
  const { addClient, updateClient } = useApp();
  const [form, setForm] = useState(client || { name: '', contact: '', email: '', address: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (client) updateClient(client.id, form);
    else addClient(form);
    onClose();
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-header">
        <h2 className="modal-title">{client ? 'Edit Client' : 'New Client'}</h2>
        <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Mr. John Doe" /></div>
        <div className="form-group"><label className="form-label">Contact</label><input className="form-input" value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} placeholder="+91 9XXXXXXXXX" /></div>
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="client@email.com" /></div>
        <div className="form-group"><label className="form-label">Billing Address</label><textarea className="form-input" rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Street, City, Pincode" style={{ resize: 'vertical' }} /></div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{client ? 'Save Changes' : 'Add Client'}</button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// ---- Add/Edit Product Modal ----
export function ProductModal({ product, onClose }) {
  const { addProduct, updateProduct } = useApp();
  const [form, setForm] = useState(product || { name: '', unit: 'sqft', defaultRate: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (product) updateProduct(product.id, form);
    else addProduct(form);
    onClose();
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-header">
        <h2 className="modal-title">{product ? 'Edit Product' : 'New Product'}</h2>
        <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="form-group"><label className="form-label">Product / Material Name</label><input className="form-input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Italian Marble" /></div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Unit</label>
            <select className="form-select" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
              <option value="sqft">sqft</option>
              <option value="unit">unit</option>
              <option value="rft">rft</option>
              <option value="lot">lot</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Default Rate (₹)</label>
            <input className="form-input" type="number" min="0" value={form.defaultRate} onChange={e => setForm(p => ({ ...p, defaultRate: parseFloat(e.target.value) || 0 }))} placeholder="0" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{product ? 'Save Changes' : 'Add Product'}</button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// ---- Confirm Delete Modal ----
export function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-header">
        <h2 className="modal-title">Confirm Delete</h2>
        <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{message || 'Are you sure? This action cannot be undone.'}</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { onConfirm(); onClose(); }}>Delete</button>
      </div>
    </ModalOverlay>
  );
}
