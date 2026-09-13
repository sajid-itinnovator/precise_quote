import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Calculator, Eye, Home, ArrowRight, Building, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatIndianCurrency, numberToWords } from '../utils/helpers';
import QuotationPreview from '../components/QuotationPreview';
import MaterialSpecEditor from '../components/MaterialSpecEditor';

const GST_RATE = 0.18;

const ROOM_PRESET_ITEMS = {
  'ENTRANCE': [
    'Safety Door With CNC Jali Europa Lock', 'Shoe Rack With Seating', 'Entrance Panelling', 'Foyer Unit', 'Entrance Wall Designing'
  ],
  'LIVING ROOM': [
    'TV Unit', 'Designer Sofa', 'Sofa Back Wall Design', 'Centre Table', 'A/c Pelmet', 'Bar Counter', 'Mandir Unit', 'Partition Work', 'Curtains Full Height', 'Other Wall Design'
  ],
  'LIVING BALCONY': [
    'Living Balcony PVC Ceiling', 'Living Balcony Pipe Cover', 'Living Balcony Sitout', 'Living Balcony Vertical Garden', 'Invisible Grill', 'French Door', 'Extra Storage', 'Ceiling Cloth Handing Road'
  ],
  'DINING AREA': [
    'Dining Table Marble Top', 'Foldable Dining Table', 'Dining Back Wall Design', 'Crockery Unit', 'Mandir Unit', 'Partition Work', 'PVC Ceiling'
  ],
  'KITCHEN': [
    'Modular Kitchen With Tandem Box', 'Loft Unit', 'Crockery Unit With Profile Light', 'Pantry Unit With Automatic Feting', 'Pantry Unit With manual Feting', 'Tall Unit', 'Foldable Table', 'Wicker Basket', 'Breakfast Counter', 'Partition Work', 'Dry Balcony PCV Ceiling', 'Dry Balcony Storage', 'Dry Balcony Window', 'Chimney'
  ],
  'BATHROOM': [
    'Bathroom PVC Ceiling', 'Bathroom Vanity + Mirror', 'Bathroom Basin Storage', 'Bathroom Glass Partition'
  ],
  'MASTER BEDROOM': [
    'Bed With Hydraulic Storage With Bed Back Cushion', 'Bed Side Table', 'Bed Side Table + Dressing Unit', 'Bed Back Wall Design', 'Wardrobe', 'Loft Unit', 'Dressing Unit With Mirror', 'Work Station', 'Work Station Over Head Storage', 'Work Station Over Head Shelf', 'Window Sitout', 'A/C Pelmet', 'Curtains Full Height'
  ],
  'KIDS BEDROOM': [
    'Bed With Hydraulic Storage With Bed Back Cushion', 'Bunk Bed', 'Murphy Bed', 'Bed Side Table', 'Bed Side Table + Dressing Unit', 'Bed Back Wall Design', 'Wardrobe', 'Loft Unit', 'Dressing Unit With Mirror', 'Study Table', 'Study Table Over Head Storage', 'Study Table Over Head Shelf', 'Window Sitout', 'A/C Pelmet', 'Curtains Full Height'
  ],
  'PARENT BEDROOM': [
    'Bed With Hydraulic Storage With Bed Back Cushion', 'Bunk Bed', 'Murphy Bed', 'Bed Side Table', 'Bed Side Table + Dressing Unit', 'Bed Back Wall Design', 'Wardrobe', 'Loft Unit', 'Dressing Unit With Mirror', 'Study Table', 'Study Table Over Head Storage', 'Study Table Over Head Shelf', 'Window Sitout', 'A/C Pelmet', 'Curtains Full Height'
  ],
  'CIVIL': [
    'Wall Demolish', 'Kitchen Counter Demolish', 'Kitchen Counter Top Change', 'Kitchen Counter Top extend', 'Tile Change'
  ],
  'OTHER WORK': [
    'False Ceiling Work', 'Electrical Work', 'Painting Work'
  ]
};

const PRESET_ROOMS = [
  'ENTRANCE', 'LIVING ROOM', 'LIVING BALCONY', 'DINING AREA', 'KITCHEN',
  'BATHROOM', 'MASTER BEDROOM', 'KIDS BEDROOM', 'PARENT BEDROOM', 'CIVIL', 'OTHER WORK'
];

const ALL_PRESET_ITEMS = Array.from(new Set(Object.values(ROOM_PRESET_ITEMS).flat()));


// ─── Parse "L X W" string → { l, w } or null ─────────────────────────────
function parseLW(sizeStr) {
  const match = (sizeStr || '').trim().match(/^([\d.]+)\s*[xX×]\s*([\d.]+)$/);
  if (!match) return null;
  return { l: parseFloat(match[1]), w: parseFloat(match[2]) };
}

// ─── Item Row ─────────────────────────────────────────────────────────────
function ItemRow({ item, roomName, onUpdate, onDelete }) {
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
          list={roomName ? `datalist-${roomName.replace(/\s+/g, '-')}` : "particulars-list"}
        />
        <button className="btn btn-sm btn-danger" onClick={onDelete} style={{ padding: '7px 10px', flexShrink: 0 }}>
          <Trash2 size={14} />
        </button>
      </div>

      {/* Row 2: Size | Rate | Amount */}
      <div className="item-row-grid">

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
            <ItemRow key={i} item={item} roomName={room.name} onUpdate={data => updateItem(i, data)} onDelete={() => deleteItem(i)} />
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
  const { clients, addQuotation, materialSpec, updateMaterialSpec, ROOMS_DEFAULT } = useApp();
  const [clientId, setClientId] = useState('');
  const [projectTitle, setProjectTitle] = useState('2 BHK INTERIOR DESIGN');
  const [rooms, setRooms] = useState([]);
  const [customRoom, setCustomRoom] = useState('');
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [includeGST, setIncludeGST] = useState(true);
  const [showItemAmount, setShowItemAmount] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Material & Brand customization state for this quotation
  const [quoteMaterialSpec, setQuoteMaterialSpec] = useState(() =>
    materialSpec && materialSpec.length > 0 ? JSON.parse(JSON.stringify(materialSpec)) : []
  );
  const [activeTab, setActiveTab] = useState('scope'); // 'scope' | 'materials'

  useEffect(() => {
    if (materialSpec && materialSpec.length > 0 && quoteMaterialSpec.length === 0) {
      setQuoteMaterialSpec(JSON.parse(JSON.stringify(materialSpec)));
    }
  }, [materialSpec]);

  const subtotal = rooms.reduce((s, r) => s + (r.items || []).reduce((ss, item) => ss + (Number(item.amount) || 0), 0), 0);
  const gst = includeGST ? Math.round(subtotal * GST_RATE) : 0;
  const total = subtotal + gst;

  const addRoom = (name) => {
    if (!name.trim()) return;
    const roomName = name.trim().toUpperCase();
    
    setRooms(prev => [...prev, { name: roomName, items: [] }]);
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

  const handleSave = async () => {
    try {
      const client = getClient();
      await addQuotation({
        clientId,
        clientName: client?.name || 'Client',
        clientContact: client?.contact || '',
        clientAddress: client?.address || '',
        projectTitle,
        rooms,
        total,
        materialSpec: quoteMaterialSpec,
        showItemAmount,
        status: 'DRAFT',
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      if (err.message === 'SUBSCRIPTION_LIMIT_REACHED') {
        alert("Subscription Limit Reached! You have reached the maximum number of quotes allowed on your current plan. Please upgrade your plan to generate more.");
      } else {
        console.error(err);
        alert("An error occurred while saving the quotation.");
      }
    }
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
      materialSpec: quoteMaterialSpec,
      showItemAmount,
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

      {/* Builder Navigation Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setActiveTab('scope')}
          className={`btn ${activeTab === 'scope' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: 8, padding: '9px 18px', fontWeight: 600, fontSize: '0.875rem' }}
        >
          <Building size={16} /> 1. Scope of Work ({rooms.length} Rooms, {totalItems} Items)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('materials')}
          className={`btn ${activeTab === 'materials' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: 8, padding: '9px 18px', fontWeight: 600, fontSize: '0.875rem' }}
        >
          <Layers size={16} /> 2. Material Brands &amp; Specs ({quoteMaterialSpec.length} Categories)
        </button>
      </div>

      {/* Desktop layout: 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }} className="desktop-only">
        {activeTab === 'scope' ? (
          <BuilderLeft
            rooms={rooms} updateRoom={updateRoom} deleteRoom={deleteRoom} moveRoom={moveRoom}
            showRoomPicker={showRoomPicker} setShowRoomPicker={setShowRoomPicker}
            customRoom={customRoom} setCustomRoom={setCustomRoom} addRoom={addRoom}
            PRESET_ROOMS={PRESET_ROOMS}
          />
        ) : (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--secondary)' }}>
                  Material Specifications &amp; Brands
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  These brands will appear in the "2. MATERIAL SPECIFICATION" table on Page 2 of this invoice.
                </p>
              </div>
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
                  alert('Saved as company default brands!');
                }
              }}
            />
          </div>
        )}
        <BuilderRight
          subtotal={subtotal} gst={gst} total={total} totalItems={totalItems}
          includeGST={includeGST} setIncludeGST={setIncludeGST}
          showItemAmount={showItemAmount} setShowItemAmount={setShowItemAmount}
          onSave={handleSave} onPreview={() => setShowPreview(true)}
          saved={saved} clientId={clientId}
        />
      </div>

      {/* Mobile layout: stacked */}
      <div className="mobile-only">
        {activeTab === 'scope' ? (
          <BuilderLeft
            rooms={rooms} updateRoom={updateRoom} deleteRoom={deleteRoom} moveRoom={moveRoom}
            showRoomPicker={showRoomPicker} setShowRoomPicker={setShowRoomPicker}
            customRoom={customRoom} setCustomRoom={setCustomRoom} addRoom={addRoom}
            PRESET_ROOMS={PRESET_ROOMS}
          />
        ) : (
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700 }}>
              Material Specifications &amp; Brands
            </h2>
            <p style={{ margin: '0 0 14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Brands for Page 2 of this invoice.
            </p>
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
                  alert('Saved as company default brands!');
                }
              }}
            />
          </div>
        )}
        <BuilderRight
          subtotal={subtotal} gst={gst} total={total} totalItems={totalItems}
          includeGST={includeGST} setIncludeGST={setIncludeGST}
          showItemAmount={showItemAmount} setShowItemAmount={setShowItemAmount}
          onSave={handleSave} onPreview={() => setShowPreview(true)}
          saved={saved} clientId={clientId}
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
function BuilderRight({ subtotal, gst, total, totalItems, includeGST, setIncludeGST, showItemAmount, setShowItemAmount, onSave, onPreview, saved, clientId }) {
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

          {/* Option to show or hide item-level amounts */}
          <div className="summary-row" style={{ alignItems: 'center', padding: '6px 0', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ opacity: 0.85, fontSize: '0.85rem' }}>Item Amounts</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showItemAmount}
                  onChange={e => setShowItemAmount(e.target.checked)}
                  style={{ accentColor: '#1a56ff' }}
                />
                <span style={{ fontSize: '0.7rem', opacity: 0.75 }}>
                  {showItemAmount ? 'Show in PDF' : 'Hide in PDF'}
                </span>
              </label>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: showItemAmount ? '#60a5fa' : '#94a3b8' }}>
              {showItemAmount ? 'Detailed' : 'Lump Sum'}
            </span>
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
