import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Calculator, Eye, Home, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatIndianCurrency, numberToWords } from '../utils/helpers';
import QuotationPreview from '../components/QuotationPreview';

const GST_RATE = 0.18;

const PRESET_ROOMS = [
  'ENTRANCE', 'LIVING ROOM', 'DINING AREA', 'KITCHEN',
  'MASTER BEDROOM', 'KIDS BEDROOM', 'STUDY ROOM', 'BATHROOM', 'OTHER WORK'
];

// ─── Parse "L X W" string → { l, w } or null ─────────────────────────────
function parseLW(sizeStr) {
  const match = (sizeStr || '').trim().match(/^([\d.]+)\s*[xX×]\s*([\d.]+)$/);
  if (!match) return null;
  return { l: parseFloat(match[1]), w: parseFloat(match[2]) };
}

// ─── Item Row ─────────────────────────────────────────────────────────────
function ItemRow({ item, onUpdate, onDelete }) {
  const rate = item._rate ?? '';
  const lw = parseLW(item.size);
  const rateNum = parseFloat(rate) || 0;
  const isAutoCalc = lw !== null && rateNum > 0;
  const autoAmount = isAutoCalc ? Math.round(lw.l * lw.w * rateNum) : null;

  const updateSize = (val) => {
    const parsed = parseLW(val);
    const r = parseFloat(rate) || 0;
    const newAmount = parsed && r > 0 ? Math.round(parsed.l * parsed.w * r) : item.amount;
    onUpdate({ ...item, size: val, amount: newAmount });
  };

  const updateRate = (val) => {
    const parsed = parseLW(item.size);
    const r = parseFloat(val) || 0;
    const newAmount = parsed && r > 0 ? Math.round(parsed.l * parsed.w * r) : item.amount;
    onUpdate({ ...item, _rate: val, amount: newAmount });
  };

  const updateAmount = (val) => {
    onUpdate({ ...item, amount: parseFloat(val) || 0 });
  };

  return (
    <div className="room-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>

      {/* Row 1: Particular + Delete */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          className="form-input"
          style={{ flex: 1, fontSize: '0.85rem', padding: '7px 10px' }}
          placeholder="Particular (e.g. Safety Door With CNC Jali)"
          value={item.particular || ''}
          onChange={e => onUpdate({ ...item, particular: e.target.value })}
        />
        <button className="btn btn-sm btn-danger" onClick={onDelete} style={{ padding: '7px 10px', flexShrink: 0 }}>
          <Trash2 size={14} />
        </button>
      </div>

      {/* Row 2: Size | Rate | Amount */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>

        <div>
          <label className="form-label" style={{ fontSize: '0.6rem', marginBottom: 3, display: 'block' }}>
            SIZE / DESCRIPTION
          </label>
          <input
            className="form-input"
            style={{ padding: '6px 8px', fontSize: '0.82rem' }}
            placeholder="e.g. 7 X 4.5 or Entire Flat"
            value={item.size || ''}
            onChange={e => updateSize(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label" style={{ fontSize: '0.6rem', marginBottom: 3, display: 'block' }}>
            RATE (₹/sqft)&nbsp;
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.55rem' }}>optional</span>
          </label>
          <input
            className="form-input"
            type="number"
            min="0"
            style={{ padding: '6px 8px', fontSize: '0.82rem' }}
            placeholder="0"
            value={rate}
            onChange={e => updateRate(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label" style={{ fontSize: '0.6rem', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
            AMOUNT (₹)
            {isAutoCalc && (
              <span style={{
                fontSize: '0.5rem', background: 'var(--primary)', color: '#fff',
                padding: '1px 5px', borderRadius: 99, fontWeight: 700,
              }}>AUTO</span>
            )}
          </label>
          <input
            className="form-input"
            type="number"
            min="0"
            style={{
              padding: '6px 8px', fontSize: '0.82rem',
              background: isAutoCalc ? 'var(--primary-light)' : undefined,
              color: isAutoCalc ? 'var(--primary)' : undefined,
              fontWeight: isAutoCalc ? 700 : undefined,
            }}
            placeholder="0"
            value={item.amount || ''}
            onChange={e => updateAmount(e.target.value)}
            readOnly={isAutoCalc}
          />
        </div>
      </div>

      {/* Auto-calc breakdown */}
      {isAutoCalc && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--primary-light)', borderRadius: 6, padding: '5px 10px',
        }}>
          <Calculator size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
            {lw.l} × {lw.w} sqft × ₹{rate}/sqft = ₹{formatIndianCurrency(autoAmount)}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Room Section ─────────────────────────────────────────────────────────
function RoomSection({ room, index, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [collapsed, setCollapsed] = useState(false);

  const addItem = () => {
    onUpdate({ ...room, items: [...(room.items || []), { particular: '', size: '', amount: 0 }] });
  };

  const updateItem = (i, data) => {
    const items = [...(room.items || [])];
    items[i] = data;
    onUpdate({ ...room, items });
  };

  const deleteItem = (i) => {
    const items = (room.items || []).filter((_, idx) => idx !== i);
    onUpdate({ ...room, items });
  };

  const roomTotal = (room.items || []).reduce((s, item) => s + (Number(item.amount) || 0), 0);

  return (
    <div className="room-group">
      <div className="room-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <span>{room.name}</span>
          {roomTotal > 0 && (
            <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 99 }}>
              ₹{formatIndianCurrency(roomTotal)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {!isFirst && <button style={{ color: '#fff', opacity: 0.7 }} className="btn-icon" onClick={onMoveUp}>↑</button>}
          {!isLast && <button style={{ color: '#fff', opacity: 0.7 }} className="btn-icon" onClick={onMoveDown}>↓</button>}
          <button style={{ color: '#fff', opacity: 0.7 }} className="btn-icon" onClick={onDelete}>✕</button>
          <button style={{ color: '#fff' }} className="btn-icon" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>
      {!collapsed && (
        <>
          {(room.items || []).map((item, i) => (
            <ItemRow key={i} item={item} onUpdate={data => updateItem(i, data)} onDelete={() => deleteItem(i)} />
          ))}
          <div style={{ padding: '8px 16px' }}>
            <button className="btn btn-ghost btn-sm" onClick={addItem}>
              <Plus size={14} /> Add Item
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Builder Page ────────────────────────────────────────────────────
export default function Builder() {
  const { clients, addQuotation, materialSpec, ROOMS_DEFAULT } = useApp();
  const [clientId, setClientId] = useState('');
  const [projectTitle, setProjectTitle] = useState('2 BHK INTERIOR DESIGN');
  const [rooms, setRooms] = useState(() =>
    ROOMS_DEFAULT.map(name => ({ name, items: [] }))
  );
  const [customRoom, setCustomRoom] = useState('');
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [includeGST, setIncludeGST] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const subtotal = rooms.reduce((s, r) => s + (r.items || []).reduce((ss, item) => ss + (Number(item.amount) || 0), 0), 0);
  const gst = includeGST ? Math.round(subtotal * GST_RATE) : 0;
  const total = subtotal + gst;

  const addRoom = (name) => {
    if (!name.trim()) return;
    setRooms(prev => [...prev, { name: name.trim().toUpperCase(), items: [] }]);
    setCustomRoom('');
    setShowRoomPicker(false);
  };

  const updateRoom = (i, data) => setRooms(prev => prev.map((r, idx) => idx === i ? data : r));
  const deleteRoom = (i) => setRooms(prev => prev.filter((_, idx) => idx !== i));
  const moveRoom = (i, dir) => {
    const arr = [...rooms];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setRooms(arr);
  };

  const getClient = () => clients.find(c => c.id === clientId);

  const handleSave = () => {
    const client = getClient();
    addQuotation({
      clientId,
      clientName: client?.name || 'Client',
      clientContact: client?.contact || '',
      clientAddress: client?.address || '',
      projectTitle,
      rooms,
      total,
      materialSpec,
      status: 'DRAFT',
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Build the quotation object for preview
  const buildQuotation = () => {
    const client = getClient();
    return {
      quotationNo: `1290`,
      date: new Date().toISOString().slice(0, 10),
      clientName: client?.name || 'Client',
      clientContact: client?.contact || '',
      clientAddress: client?.address || '',
      projectTitle,
      rooms,
      total,
      materialSpec,
    };
  };

  const totalItems = rooms.reduce((s, r) => s + (r.items || []).length, 0);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Home size={13} />
        <span>Quotation</span>
        <ArrowRight size={13} />
        <span>New Quote</span>
      </div>
      <h1 className="page-title">Quotation Builder</h1>

      {/* Client + Project */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Client</label>
            <select className="form-select" value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">Select client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Project Title</label>
            <input className="form-input" value={projectTitle} onChange={e => setProjectTitle(e.target.value)} placeholder="e.g. 2 BHK INTERIOR DESIGN" />
          </div>
        </div>
        {clientId && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--primary-light)', borderRadius: 6, fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: 600 }}>
            ● Client: {getClient()?.name} — {getClient()?.contact}
          </div>
        )}
      </div>

      {/* Desktop layout: 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }} className="desktop-only">
        <BuilderLeft
          rooms={rooms} updateRoom={updateRoom} deleteRoom={deleteRoom} moveRoom={moveRoom}
          showRoomPicker={showRoomPicker} setShowRoomPicker={setShowRoomPicker}
          customRoom={customRoom} setCustomRoom={setCustomRoom} addRoom={addRoom}
          PRESET_ROOMS={PRESET_ROOMS}
        />
        <BuilderRight
          subtotal={subtotal} gst={gst} total={total} totalItems={totalItems}
          includeGST={includeGST} setIncludeGST={setIncludeGST}
          onSave={handleSave} onPreview={() => setShowPreview(true)}
          saved={saved} clientId={clientId}
        />
      </div>

      {/* Mobile layout: stacked */}
      <div className="mobile-only">
        <BuilderLeft
          rooms={rooms} updateRoom={updateRoom} deleteRoom={deleteRoom} moveRoom={moveRoom}
          showRoomPicker={showRoomPicker} setShowRoomPicker={setShowRoomPicker}
          customRoom={customRoom} setCustomRoom={setCustomRoom} addRoom={addRoom}
          PRESET_ROOMS={PRESET_ROOMS}
        />
        <BuilderRight
          subtotal={subtotal} gst={gst} total={total} totalItems={totalItems}
          includeGST={includeGST} setIncludeGST={setIncludeGST}
          onSave={handleSave} onPreview={() => setShowPreview(true)}
          saved={saved} clientId={clientId}
        />
      </div>

      {/* Quotation Preview Modal */}
      {showPreview && (
        <QuotationPreview quotation={buildQuotation()} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

// ─── Builder Left (Scope of Work) ─────────────────────────────────────────
function BuilderLeft({ rooms, updateRoom, deleteRoom, moveRoom, showRoomPicker, setShowRoomPicker, customRoom, setCustomRoom, addRoom, PRESET_ROOMS }) {
  return (
    <div>
      <div className="section-header" style={{ marginBottom: 12 }}>
        <div className="section-title">Scope of Work</div>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowRoomPicker(p => !p)}>
          <Plus size={14} /> Add Room
        </button>
      </div>

      {showRoomPicker && (
        <div className="card" style={{ padding: 14, marginBottom: 12 }}>
          <div className="form-label" style={{ marginBottom: 8 }}>Select Preset Room</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {PRESET_ROOMS.map(r => (
              <button key={r} className="tag" style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '5px 12px' }} onClick={() => addRoom(r)}>
                {r}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="form-input" placeholder="Custom room name..." value={customRoom} onChange={e => setCustomRoom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRoom(customRoom)} />
            <button className="btn btn-primary btn-sm" onClick={() => addRoom(customRoom)}>Add</button>
          </div>
        </div>
      )}

      {rooms.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🏠</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No rooms added yet</div>
          <div className="text-sm">Click "+ Add Room" to start building your scope of work</div>
        </div>
      )}

      {rooms.map((room, i) => (
        <RoomSection
          key={i}
          room={room}
          index={i}
          onUpdate={data => updateRoom(i, data)}
          onDelete={() => deleteRoom(i)}
          onMoveUp={() => moveRoom(i, -1)}
          onMoveDown={() => moveRoom(i, 1)}
          isFirst={i === 0}
          isLast={i === rooms.length - 1}
        />
      ))}
    </div>
  );
}

// ─── Builder Right (Summary Panel) ───────────────────────────────────────
function BuilderRight({ subtotal, gst, total, totalItems, includeGST, setIncludeGST, onSave, onPreview, saved, clientId }) {
  return (
    <div>
      {/* Summary */}
      <div style={{ marginBottom: 16 }}>
        <div className="section-header" style={{ marginBottom: 10 }}>
          <div className="section-title">Summary</div>
          <span className="badge badge-info">{totalItems} Items</span>
        </div>
        <div className="summary-panel">
          <div className="summary-row">
            <span style={{ opacity: 0.8 }}>Subtotal</span>
            <span style={{ fontWeight: 600 }}>₹{formatIndianCurrency(subtotal)}</span>
          </div>
          <div className="summary-row" style={{ alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ opacity: 0.8 }}>GST (18%)</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={includeGST} onChange={e => setIncludeGST(e.target.checked)} style={{ accentColor: '#1a56ff' }} />
                <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Include</span>
              </label>
            </div>
            <span style={{ fontWeight: 600 }}>₹{formatIndianCurrency(gst)}</span>
          </div>
          <hr className="summary-divider" />
          <div className="summary-total-label">Final Total Amount</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <div className="summary-total-value">₹{formatIndianCurrency(total)}</div>
          </div>
          {total > 0 && (
            <div style={{ marginTop: 8, fontSize: '0.72rem', opacity: 0.65, fontStyle: 'italic' }}>
              {numberToWords(total)} Only
            </div>
          )}

          {/* Preview button */}
          <button
            className="btn"
            style={{ background: '#fff', color: 'var(--primary)', fontWeight: 700, width: '100%', marginTop: 14, gap: 8 }}
            onClick={onPreview}
          >
            <Eye size={16} /> Preview &amp; Print Quotation
          </button>
        </div>
      </div>

      {/* Save draft */}
      <button
        className="btn btn-secondary w-full"
        onClick={onSave}
        disabled={!clientId}
        style={{ marginBottom: 8 }}
      >
        {saved ? '✓ Saved to History' : 'Save as Draft'}
      </button>

      {/* Note */}
      <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 12px', fontSize: '0.75rem', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
        <strong>NOTE:</strong> Prices are subject to final material verification. This quotation is valid for 15 days from the date of generation. Final measurements will be conducted on-site by a Vistara specialist.
      </div>
    </div>
  );
}
