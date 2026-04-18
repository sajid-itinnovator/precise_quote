import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductModal, ConfirmModal } from '../components/Modals';

export default function Products() {
  const { products, deleteProduct } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Products & Materials</h1>
          <p className="page-subtitle">Manage your material library for quick quote building.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditProduct(null); setShowModal(true); }}>
          <Plus size={15} /> Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Package size={40} /></div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No products yet</div>
          <div className="text-sm">Add materials/products to use them in the Quotation Builder</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {products.map(p => (
            <div key={p.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, background: 'var(--primary-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={18} style={{ color: 'var(--primary)' }} />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-icon btn-ghost" onClick={() => { setEditProduct(p); setShowModal(true); }}><Pencil size={15} /></button>
                  <button className="btn-icon btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setDeleteId(p.id)}><Trash2 size={15} /></button>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{p.name}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="tag">{p.unit}</span>
                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>₹{(p.defaultRate || 0).toLocaleString('en-IN')}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>per {p.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ProductModal product={editProduct} onClose={() => { setShowModal(false); setEditProduct(null); }} />
      )}
      {deleteId && (
        <ConfirmModal
          message="Delete this product from the library?"
          onConfirm={() => deleteProduct(deleteId)}
          onClose={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
