import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, Home, ArrowRight, Building, Layers, FileCheck, Copy, Pencil, RotateCcw, Lock, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatIndianCurrency, getNextRevisionTitle } from '../utils/helpers';
import { calculateItemSqft } from '../utils/dimensions';
import { GST_RATE, ROOM_PRESET_ITEMS, ALL_PRESET_ITEMS } from '../constants/quoteCatalog';
import QuotationPreview from '../components/QuotationPreview';
import MaterialSpecEditor from '../components/MaterialSpecEditor';
import ClientPicker from '../components/ClientPicker';
import BuilderLeft from '../components/builder/BuilderLeft';
import BuilderRight from '../components/builder/BuilderRight';
import useQuotationSave from '../components/builder/useQuotationSave';

// ─── Main Builder Page ────────────────────────────────────────────────────
export default function Builder() {
  const { clients, quotations, materialSpec, updateMaterialSpec, nextQuoteNo, calculateNextQuoteNo } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const editId = searchParams.get('edit');
  const reviseId = searchParams.get('revise');
  const preClientId = searchParams.get('clientId');
  const preProjectTitle = searchParams.get('projectTitle');

  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [quotationNo, setQuotationNo] = useState('');

  const [projectTitle, setProjectTitle] = useState('2 BHK INTERIOR DESIGN');
  const [rooms, setRooms] = useState([]);
  const [customRoom, setCustomRoom] = useState('');
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [includeGST, setIncludeGST] = useState(true);
  const [showItemAmount, setShowItemAmount] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // Material & Brand customization state for this quotation
  const [quoteMaterialSpec, setQuoteMaterialSpec] = useState(() =>
    materialSpec && materialSpec.length > 0 ? JSON.parse(JSON.stringify(materialSpec)) : []
  );
  const [activeTab, setActiveTab] = useState('scope'); // 'scope' | 'materials'

  const loadedQuoteRef = useRef(null);

  /* eslint-disable react-hooks/set-state-in-effect -- one-time seed of the quote's spec from tenant defaults */
  useEffect(() => {
    if (materialSpec && materialSpec.length > 0 && quoteMaterialSpec.length === 0) {
      setQuoteMaterialSpec(JSON.parse(JSON.stringify(materialSpec)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-seed when tenant defaults change
  }, [materialSpec]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Load quote for edit or revision — one-shot init guarded by loadedQuoteRef
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const targetId = editId || reviseId;
    if (!targetId || !quotations || quotations.length === 0) return;
    if (loadedQuoteRef.current === targetId) return;

    const targetQuote = quotations.find(q => q.id === targetId);
    if (targetQuote) {
      loadedQuoteRef.current = targetId;
      if (targetQuote.clientId) setClientId(targetQuote.clientId);
      if (targetQuote.clientName) setClientName(targetQuote.clientName);
      if (targetQuote.clientContact) setClientContact(targetQuote.clientContact);
      if (targetQuote.clientAddress) setClientAddress(targetQuote.clientAddress);

      if (reviseId) {
        setProjectTitle(getNextRevisionTitle(targetQuote.projectTitle));
        setQuotationNo(String(calculateNextQuoteNo(quotations, nextQuoteNo)));
      } else {
        setProjectTitle(targetQuote.projectTitle || '2 BHK INTERIOR DESIGN');
        if (targetQuote.quotationNo) setQuotationNo(targetQuote.quotationNo);
      }
      setRooms(targetQuote.rooms ? JSON.parse(JSON.stringify(targetQuote.rooms)) : []);
      if (targetQuote.showItemAmount !== undefined) {
        setShowItemAmount(targetQuote.showItemAmount);
      }
      if (targetQuote.materialSpec && targetQuote.materialSpec.length > 0) {
        setQuoteMaterialSpec(JSON.parse(JSON.stringify(targetQuote.materialSpec)));
      }
    }
  }, [editId, reviseId, quotations, nextQuoteNo, calculateNextQuoteNo]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // The invoice number for a NEW quote is assigned at save time inside
  // addQuotation (single owner of numbering), so it can never go stale when a
  // second customer is quoted without a page reload. The field below is
  // display-only: it derives from current quotations on every render.
  const displayQuoteNo = useMemo(() => {
    if (editId || reviseId) return quotationNo; // edit/revise flows pin their own number
    return String(calculateNextQuoteNo(quotations, nextQuoteNo));
  }, [editId, reviseId, quotationNo, quotations, nextQuoteNo, calculateNextQuoteNo]);

  // Pre-fill client if passed in query param — one-shot init
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (preClientId && !editId && !reviseId && clients && clients.length > 0) {
      setClientId(preClientId);
      const found = clients.find(c => c.id === preClientId);
      if (found) {
        setClientName(found.name || '');
        setClientContact(found.contact || '');
        setClientAddress(found.address || '');
      }
    }
  }, [preClientId, clients, editId, reviseId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Pre-fill project title if passed in query param — one-shot init
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (preProjectTitle && !editId && !reviseId) {
      try {
        setProjectTitle(decodeURIComponent(preProjectTitle));
      } catch {
        setProjectTitle(preProjectTitle);
      }
    }
  }, [preProjectTitle, editId, reviseId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleClientChange = (selectedId) => {
    setClientId(selectedId);
    if (selectedId && selectedId !== '__new__') {
      const found = clients.find(c => c.id === selectedId);
      if (found) {
        setClientName(found.name || '');
        setClientContact(found.contact || '');
        setClientAddress(found.address || '');
      }
    } else if (selectedId === '__new__') {
      setClientName('');
      setClientContact('');
      setClientAddress('');
    }
  };

  const existingQuote = (editId || reviseId) ? quotations.find(q => q.id === (editId || reviseId)) : null;

  const subtotal = rooms.reduce((s, r) => s + (r.items || []).reduce((ss, item) => ss + (Number(item.amount) || 0), 0), 0);
  const gst = includeGST ? Math.round(subtotal * GST_RATE) : 0;
  const total = subtotal + gst;
  const totalSqft = Math.round(
    rooms.reduce((s, r) => s + (r.items || []).reduce((ss, item) => ss + calculateItemSqft(item), 0), 0) * 100
  ) / 100;
  const totalItems = rooms.reduce((s, r) => s + (r.items || []).length, 0);

  const getClient = () => clients.find(c => c.id === clientId);
  const isApproved = existingQuote?.status === 'APPROVED';

  const { handleSave, saving, saved, savedMessage } = useQuotationSave({
    editId, reviseId, existingQuote, getClient,
    fields: { clientId, setClientId, clientName, clientContact, clientAddress, quotationNo, projectTitle, rooms, total, totalSqft, quoteMaterialSpec, showItemAmount },
  });

  const addRoom = (name, insertAfterIndex) => {
    if (!name.trim()) return;
    const roomName = name.trim().toUpperCase();
    const newRoom = { name: roomName, items: [] };

    setRooms(prev => {
      let targetIndex;
      let next;
      if (insertAfterIndex !== undefined && insertAfterIndex >= 0 && insertAfterIndex < prev.length) {
        targetIndex = insertAfterIndex + 1;
        next = [...prev];
        next.splice(targetIndex, 0, newRoom);
      } else {
        targetIndex = prev.length;
        next = [...prev, newRoom];
      }
      setScrollTargetRoomIndex(targetIndex);
      return next;
    });
    setCustomRoom('');
    setShowRoomPicker(false);
  };

  const [scrollTargetRoomIndex, setScrollTargetRoomIndex] = useState(null);

  useEffect(() => {
    if (scrollTargetRoomIndex !== null) {
      const timer = setTimeout(() => {
        const roomGroups = document.querySelectorAll('.room-group');
        if (roomGroups && roomGroups[scrollTargetRoomIndex]) {
          roomGroups[scrollTargetRoomIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      setScrollTargetRoomIndex(null);
      return () => clearTimeout(timer);
    }
  }, [rooms, scrollTargetRoomIndex]);

  const updateRoom = (i, data) => setRooms(prev => prev.map((r, idx) => idx === i ? data : r));
  const deleteRoom = (i) => setRooms(prev => prev.filter((_, idx) => idx !== i));
  const moveRoom = (i, dir) => {
    const arr = [...rooms];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setRooms(arr);
  };

  // Build the quotation object for preview
  const buildQuotation = () => {
    const client = getClient();
    const resolvedName = clientName.trim() || client?.name || 'Client';
    const resolvedContact = clientContact.trim() || client?.contact || '';
    const resolvedAddress = clientAddress.trim() || client?.address || '';

    return {
      id: editId || undefined,
      quotationNo: displayQuoteNo,
      date: existingQuote?.date || new Date().toISOString().slice(0, 10),
      createdAt: existingQuote?.createdAt || new Date().toISOString(),
      clientId: clientId === '__new__' ? undefined : (clientId || undefined),
      clientName: resolvedName,
      clientContact: resolvedContact,
      clientAddress: resolvedAddress,
      projectTitle,
      rooms,
      total,
      totalSqft,
      materialSpec: quoteMaterialSpec,
      showItemAmount,
      status: editId ? (existingQuote?.status || 'INVOICE CREATED') : 'DRAFT',
    };
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Home size={13} />
        <span>Quotation</span>
        <ArrowRight size={13} />
        <span>{editId ? (isApproved ? 'Approved Quotation' : existingQuote?.status === 'DRAFT' ? 'Edit Draft Invoice' : 'Edit Invoice') : reviseId ? 'Create Revision' : 'New Quote'}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {editId 
              ? (isApproved ? `Invoice #${existingQuote?.quotationNo || ''} (Approved)` : existingQuote?.status === 'DRAFT' ? `Edit Draft Invoice #${existingQuote?.quotationNo || ''}` : `Edit Invoice #${existingQuote?.quotationNo || ''}`)
              : reviseId 
                ? `Revise Invoice #${existingQuote?.quotationNo || ''}` 
                : 'Quotation Builder'}
          </h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0' }}>
            {editId
              ? (isApproved ? 'This invoice is approved by client and locked against direct edits.' : existingQuote?.status === 'DRAFT' ? 'Update items, dimensions, rates, and brand specs for this draft quotation.' : 'Update items, brands, and values for this existing invoice.')
              : reviseId
                ? 'Create a revised quotation version while preserving historical records.'
                : 'Calculate accurate, itemized interior quotation and generate PDF invoices.'}
          </p>
        </div>
        {(editId || reviseId) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/builder', { replace: true })}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RotateCcw size={14} /> Start New Blank Quote
          </button>
        )}
      </div>

      {/* Approved Lock Banner */}
      {editId && isApproved && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #ef4444',
          borderRadius: 8,
          padding: '14px 18px',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <div style={{ fontWeight: 800, color: '#b91c1c', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={17} /> Invoice #{existingQuote?.quotationNo} is APPROVED and Locked
            </div>
            <div style={{ fontSize: '0.82rem', color: '#7f1d1d', marginTop: 4 }}>
              Approved invoices cannot be edited directly. To make updates for this client, please create a new revision.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate(`/builder?revise=${editId}`, { replace: true })}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Copy size={14} /> Create New Revision Instead
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/builder', { replace: true })}
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Edit Mode Notification Banner for non-approved states */}
      {editId && !isApproved && (
        <div style={{
          background: existingQuote?.status === 'DRAFT' ? '#eff6ff' : 'var(--primary-light)',
          border: existingQuote?.status === 'DRAFT' ? '1px solid #3b82f6' : '1px solid var(--primary)',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Pencil size={16} /> {existingQuote?.status === 'DRAFT' ? `Currently Editing Draft Invoice #${existingQuote?.quotationNo || editId}` : `Currently Editing Invoice #${existingQuote?.quotationNo || editId}`}
              <span className={`badge ${existingQuote?.status === 'INVOICE CREATED' ? 'badge-primary' : 'badge-draft'}`} style={{ fontSize: '0.65rem' }}>
                {existingQuote?.status || 'DRAFT'}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              {existingQuote?.status === 'DRAFT'
                ? 'Modifications will update this existing draft invoice. You can save changes to keep it as a draft or click "Save as Invoice" to finalize it.'
                : 'Changes will update this existing quotation record directly.'}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/builder', { replace: true })}
          >
            Exit Edit Mode
          </button>
        </div>
      )}

      {/* Revision Mode Notification Banner */}
      {reviseId && (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #10b981',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <div>
            <div style={{ fontWeight: 700, color: '#047857', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Copy size={16} /> Creating New Revision of Invoice #{existingQuote?.quotationNo || reviseId}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#065f46', marginTop: 2 }}>
              Original invoice <strong>#{existingQuote?.quotationNo}</strong> remains safely preserved in history. Saving will issue a new quotation with revised project title <strong>"{projectTitle}"</strong>.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/builder', { replace: true })}
          >
            Cancel Revision
          </button>
        </div>
      )}

      {/* Client & Invoice Details Card */}
      <div className="card" style={{ padding: '18px 20px', marginBottom: 16, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid var(--border-light, #e2e8f0)', paddingBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Client &amp; Invoice Information</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            These details appear directly on Page 1 of the Quotation &amp; Invoice
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
          {/* Client Selection */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Select Existing Client</span>
              {clientId && clientId !== '__new__' && (
                <span style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 600 }}>Linked to Client DB</span>
              )}
            </label>
            <ClientPicker
              value={clientId === '__new__' ? '' : clientId}
              onChange={(selectedId) => handleClientChange(selectedId)}
              onAddNew={() => handleClientChange('__new__')}
              placeholder="-- Choose or Search Existing Client --"
            />
          </div>

          {/* Client Name Input */}
          <div className="form-group">
            <label className="form-label">Client Name *</label>
            <input
              className="form-input"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="e.g. Mr. Rahul Sharma"
              required
            />
          </div>

          {/* Client Contact Phone */}
          <div className="form-group">
            <label className="form-label">Client Contact / Phone</label>
            <input
              className="form-input"
              value={clientContact}
              onChange={e => setClientContact(e.target.value)}
              placeholder="e.g. +91 9876543210"
            />
          </div>

          {/* Quotation / Invoice No */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Quotation / Invoice No</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>Auto-Assigned</span>
            </label>
            <input
              className="form-input"
              value={displayQuoteNo}
              readOnly
              style={{ background: 'var(--bg, #f8fafc)', color: 'var(--text-muted)' }}
            />
          </div>

          {/* Project Title */}
          <div className="form-group">
            <label className="form-label">Project Title</label>
            <input
              className="form-input"
              value={projectTitle}
              onChange={e => setProjectTitle(e.target.value)}
              placeholder="e.g. 2 BHK INTERIOR DESIGN"
            />
          </div>

          {/* Billing / Site Address */}
          <div className="form-group">
            <label className="form-label">Billing / Site Address</label>
            <input
              className="form-input"
              value={clientAddress}
              onChange={e => setClientAddress(e.target.value)}
              placeholder="e.g. Hinjewadi Phase 1, Pune 411057"
            />
          </div>
        </div>

        {clientId && clientId !== '__new__' && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--primary-light)', borderRadius: 6, fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700 }}>● Active Client:</span> {clientName || getClient()?.name}
            {clientContact && <span>&bull; Contact: {clientContact}</span>}
            {clientAddress && <span>&bull; Address: {clientAddress}</span>}
          </div>
        )}
      </div>

      {/* Builder Navigation Tabs */}
      <div className="builder-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('scope')}
          className={`btn builder-tab-btn ${activeTab === 'scope' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Building size={16} /> Scope of Work ({rooms.length} Rooms, {totalItems} Items{totalSqft > 0 ? `, ${totalSqft.toLocaleString('en-IN')} SQFT` : ''})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('materials')}
          className={`btn builder-tab-btn ${activeTab === 'materials' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Layers size={16} /> Material Brands &amp; Specs ({quoteMaterialSpec.length} Categories)
        </button>
      </div>

      {/* Responsive layout: ONE DOM — two columns on desktop, stacked on mobile (CSS-driven) */}
      <div className="builder-layout">
        {activeTab === 'scope' ? (
          <BuilderLeft
            rooms={rooms} updateRoom={updateRoom} deleteRoom={deleteRoom} moveRoom={moveRoom}
            showRoomPicker={showRoomPicker} setShowRoomPicker={setShowRoomPicker}
            customRoom={customRoom} setCustomRoom={setCustomRoom} addRoom={addRoom}
          />
        ) : (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--secondary)' }}>
                  Material Specifications &amp; Brands
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  These brands will appear in the "2. MATERIAL SPECIFICATION" table on Page 2 of this invoice.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setActiveTab('scope');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{ gap: 6, fontSize: '0.8rem' }}
              >
                <Building size={14} /> Back to Scope of Work
              </button>
            </div>
            <MaterialSpecEditor
              spec={quoteMaterialSpec}
              onChange={setQuoteMaterialSpec}
              onReset={() => {
                if (window.confirm('Reset all brands to company standard defaults?')) {
                  setQuoteMaterialSpec(JSON.parse(JSON.stringify(materialSpec)));
                }
              }}
              onSaveAsDefault={async () => {
                if (window.confirm('Save these brands as company-wide default for all future quotes?')) {
                  updateMaterialSpec(quoteMaterialSpec);
                }
              }}
            />
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setActiveTab('scope');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{ gap: 8 }}
              >
                <Building size={16} /> Done / Back to Scope of Work
              </button>
            </div>
          </div>
        )}
        {activeTab === 'scope' && (
          <div className="mobile-only" style={{ margin: '20px 0 14px' }}>
            <button
              type="button"
              className="btn w-full"
              onClick={() => {
                setActiveTab('materials');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                padding: '13px 18px',
                borderRadius: 14,
                border: '1.5px solid var(--secondary, #17365d)',
                background: 'var(--surface)',
                color: 'var(--secondary, #17365d)',
                fontWeight: 700,
                fontSize: '0.9rem',
                boxShadow: '0 4px 16px rgba(23, 54, 93, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                cursor: 'pointer'
              }}
            >
              <Layers size={18} style={{ color: 'var(--primary)' }} />
              <span>Material Brands &amp; Specs ({quoteMaterialSpec.length} Categories)</span>
              <span style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>→</span>
            </button>
          </div>
        )}
        <BuilderRight
          subtotal={subtotal} gst={gst} total={total} totalItems={totalItems} totalSqft={totalSqft}
          includeGST={includeGST} setIncludeGST={setIncludeGST}
          showItemAmount={showItemAmount} setShowItemAmount={setShowItemAmount}
          onSaveInvoice={() => handleSave('INVOICE CREATED')}
          onSaveDraft={() => handleSave('DRAFT')}
          onPreview={() => setShowPreview(true)}
          saved={saved} savedMessage={savedMessage} clientId={clientId}
          saving={saving}
          isEditing={Boolean(editId)}
          isRevising={Boolean(reviseId)}
          existingQuote={existingQuote}
        />
      </div>

      {/* Global & Room-specific Datalists for Particulars */}
      <datalist id="particulars-list">
        <option value="Custom" />
        {ALL_PRESET_ITEMS.map((p, idx) => (
          <option key={idx} value={p} />
        ))}
      </datalist>
      
      {Object.entries(ROOM_PRESET_ITEMS).map(([roomName, items]) => (
        <datalist key={roomName} id={`datalist-${roomName.replace(/\s+/g, '-')}`}>
          <option value="Custom" />
          {items.map((p, idx) => <option key={idx} value={p} />)}
        </datalist>
      ))}

      {/* Mobile Sticky Summary Bar */}
      <div className="mobile-sticky-summary">
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total ({totalItems} items)</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
            ₹{formatIndianCurrency(total)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowPreview(true)}
            style={{ padding: '6px 10px', fontSize: '0.78rem', gap: 4 }}
          >
            <Eye size={13} /> Preview
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => handleSave('INVOICE CREATED')}
            disabled={!clientId || saving}
            style={{ padding: '6px 12px', fontSize: '0.78rem', gap: 4 }}
          >
            <FileCheck size={13} /> {saving ? 'Saving…' : 'Finalize'}
          </button>
        </div>
      </div>

      {/* Quotation Preview Modal */}
      {showPreview && (
        <QuotationPreview
          quotation={buildQuotation()}
          onClose={() => setShowPreview(false)}
          onUpdateShowItemAmount={setShowItemAmount}
          onUpdateMaterialSpec={setQuoteMaterialSpec}
        />
      )}
    </div>
  );
}
