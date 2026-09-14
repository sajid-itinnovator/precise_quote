import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronDown, ChevronUp, Calculator, Eye, Home, ArrowRight, Building, Layers, FileCheck, Save, Copy, Pencil, RotateCcw, Check } from 'lucide-react';
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


// ─── Parse dimensions: 2D ("L X W") or 3D ("L X W X H") → object or null ─
export function parseDimensions(sizeStr) {
  if (!sizeStr) return null;
  // Strip feet/inch symbols and trim
  const cleaned = sizeStr.replace(/['"“”]/g, '').replace(/\b(?:ft|feet)\b/gi, '').trim();

  // 3 dimensions: e.g. "1.5 X 2 X 2", "6 x 3 x 1.5", "2*2*2"
  const match3 = cleaned.match(/^([\d.]+)\s*[xX×*]\s*([\d.]+)\s*[xX×*]\s*([\d.]+)$/);
  if (match3) {
    const d1 = parseFloat(match3[1]) || 0;
    const d2 = parseFloat(match3[2]) || 0;
    const d3 = parseFloat(match3[3]) || 0;
    if (d1 > 0 && d2 > 0 && d3 > 0) {
      const total = Math.round(d1 * d2 * d3 * 100) / 100;
      return {
        count: 3,
        d1, d2, d3,
        l: d1, w: d2, h: d3,
        total,
        unit: 'cft',
        formatted: `${d1} × ${d2} × ${d3}`,
      };
    }
  }

  // 2 dimensions: e.g. "7 X 4.5", "2 x 2", "10*7"
  const match2 = cleaned.match(/^([\d.]+)\s*[xX×*]\s*([\d.]+)$/);
  if (match2) {
    const d1 = parseFloat(match2[1]) || 0;
    const d2 = parseFloat(match2[2]) || 0;
    if (d1 > 0 && d2 > 0) {
      const total = Math.round(d1 * d2 * 100) / 100;
      return {
        count: 2,
        d1, d2,
        l: d1, w: d2,
        total,
        unit: 'sqft',
        formatted: `${d1} × ${d2}`,
      };
    }
  }

  return null;
}

function parseLW(sizeStr) {
  return parseDimensions(sizeStr);
}

// ─── Calculate SQFT / Units for an Item (Interior Designer Only) ────────
export function calculateItemSqft(item) {
  if (!item) return 0;
  if (item.sqft && !isNaN(Number(item.sqft))) return Number(item.sqft);
  
  const dims = parseDimensions(item.size);
  if (dims && dims.total > 0) {
    return dims.total;
  }

  const sizeStr = (item.size || '').trim();
  const directMatch = sizeStr.match(/^([\d.]+)\s*(?:sq\.?\s*ft|sft|cft)$/i);
  if (directMatch) {
    return parseFloat(directMatch[1]) || 0;
  }

  const rateNum = parseFloat(item._rate) || 0;
  const amtNum = parseFloat(item.amount) || 0;
  if (rateNum > 0 && amtNum > 0) {
    return Math.round((amtNum / rateNum) * 100) / 100;
  }

  return 0;
}

// ─── Item Row ─────────────────────────────────────────────────────────────
function ItemRow({ item, roomName, onUpdate, onDelete }) {
  const rate = item._rate ?? '';
  const dims = parseDimensions(item.size);
  const rateNum = parseFloat(rate) || 0;
  const isAutoCalc = dims !== null && rateNum > 0;
  const autoAmount = isAutoCalc ? Math.round(dims.total * rateNum) : null;
  const itemSqft = calculateItemSqft(item);

  const updateSize = (val) => {
    const parsed = parseDimensions(val);
    const r = parseFloat(rate) || 0;
    const newAmount = parsed && r > 0 ? Math.round(parsed.total * r) : item.amount;
    onUpdate({ ...item, size: val, amount: newAmount });
  };

  const updateRate = (val) => {
    const parsed = parseDimensions(item.size);
    const r = parseFloat(val) || 0;
    const newAmount = parsed && r > 0 ? Math.round(parsed.total * r) : item.amount;
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
          <label className="form-label" style={{ fontSize: '0.6rem', marginBottom: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>SIZE / DESCRIPTION</span>
            {itemSqft > 0 && (
              <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.62rem' }}>
                📐 {itemSqft} {dims?.unit || 'sqft'}
              </span>
            )}
          </label>
          <input
            className="form-input"
            style={{ padding: '6px 8px', fontSize: '0.82rem' }}
            placeholder="e.g. 7 X 4.5 or 1.5 X 2 X 2"
            value={item.size || ''}
            onChange={e => updateSize(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label" style={{ fontSize: '0.6rem', marginBottom: 3, display: 'block' }}>
            RATE (₹/{dims?.unit || 'sqft'})&nbsp;
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
            {dims.formatted} = {dims.total} {dims.unit} × ₹{rate}/{dims.unit} = ₹{formatIndianCurrency(autoAmount)}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Room Section ─────────────────────────────────────────────────────────
function RoomSection({ room, index, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [collapsed, setCollapsed] = useState(false);
  const sectionRef = React.useRef(null);
  const [shouldScrollNewItem, setShouldScrollNewItem] = useState(false);

  const addItem = () => {
    setCollapsed(false);
    onUpdate({ ...room, items: [...(room.items || []), { particular: '', size: '', amount: 0 }] });
    setShouldScrollNewItem(true);
  };

  React.useEffect(() => {
    if (shouldScrollNewItem && sectionRef.current) {
      const timer = setTimeout(() => {
        const items = sectionRef.current?.querySelectorAll('.room-item');
        if (items && items.length > 0) {
          const lastItem = items[items.length - 1];
          lastItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const input = lastItem.querySelector('input');
          if (input) input.focus();
        }
      }, 60);
      setShouldScrollNewItem(false);
      return () => clearTimeout(timer);
    }
  }, [room.items, shouldScrollNewItem]);

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
  const roomSqft = Math.round((room.items || []).reduce((s, item) => s + calculateItemSqft(item), 0) * 100) / 100;

  return (
    <div className="room-group" ref={sectionRef}>
      <div className="room-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700 }}>{room.name}</span>
          {roomSqft > 0 && (
            <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.22)', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
              📐 {roomSqft.toLocaleString('en-IN')} SQFT
            </span>
          )}
          {roomTotal > 0 && (
            <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 99 }}>
              ₹{formatIndianCurrency(roomTotal)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {!isFirst && <button type="button" style={{ color: '#fff', opacity: 0.7 }} className="btn-icon" onClick={onMoveUp}>↑</button>}
          {!isLast && <button type="button" style={{ color: '#fff', opacity: 0.7 }} className="btn-icon" onClick={onMoveDown}>↓</button>}
          <button type="button" style={{ color: '#fff', opacity: 0.7 }} className="btn-icon" onClick={onDelete}>✕</button>
          <button type="button" style={{ color: '#fff' }} className="btn-icon" onClick={() => setCollapsed(c => !c)}>
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
            <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>
              <Plus size={14} /> Add Item
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Next revision title helper ──────────────────────────────────────────
export function getNextRevisionTitle(originalTitle) {
  if (!originalTitle) return '2 BHK INTERIOR DESIGN (Rev 1)';
  const match = originalTitle.match(/\(Rev\s*(\d+)\)$/i);
  if (match) {
    const revNum = parseInt(match[1], 10) + 1;
    return originalTitle.replace(/\(Rev\s*(\d+)\)$/i, `(Rev ${revNum})`);
  }
  return `${originalTitle.trim()} (Rev 1)`;
}

// ─── Main Builder Page ────────────────────────────────────────────────────
export default function Builder() {
  const { clients, quotations, addQuotation, updateQuotation, materialSpec, updateMaterialSpec, ROOMS_DEFAULT } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const editId = searchParams.get('edit');
  const reviseId = searchParams.get('revise');
  const preClientId = searchParams.get('clientId');

  const [clientId, setClientId] = useState('');
  const [projectTitle, setProjectTitle] = useState('2 BHK INTERIOR DESIGN');
  const [rooms, setRooms] = useState([]);
  const [customRoom, setCustomRoom] = useState('');
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [includeGST, setIncludeGST] = useState(true);
  const [showItemAmount, setShowItemAmount] = useState(true);
  const [saved, setSaved] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Material & Brand customization state for this quotation
  const [quoteMaterialSpec, setQuoteMaterialSpec] = useState(() =>
    materialSpec && materialSpec.length > 0 ? JSON.parse(JSON.stringify(materialSpec)) : []
  );
  const [activeTab, setActiveTab] = useState('scope'); // 'scope' | 'materials'

  const loadedQuoteRef = useRef(null);

  useEffect(() => {
    if (materialSpec && materialSpec.length > 0 && quoteMaterialSpec.length === 0) {
      setQuoteMaterialSpec(JSON.parse(JSON.stringify(materialSpec)));
    }
  }, [materialSpec]);

  // Load quote for edit or revision
  useEffect(() => {
    const targetId = editId || reviseId;
    if (!targetId || !quotations || quotations.length === 0) return;
    if (loadedQuoteRef.current === targetId) return;

    const targetQuote = quotations.find(q => q.id === targetId);
    if (targetQuote) {
      loadedQuoteRef.current = targetId;
      if (targetQuote.clientId) setClientId(targetQuote.clientId);
      if (reviseId) {
        setProjectTitle(getNextRevisionTitle(targetQuote.projectTitle));
      } else {
        setProjectTitle(targetQuote.projectTitle || '2 BHK INTERIOR DESIGN');
      }
      setRooms(targetQuote.rooms ? JSON.parse(JSON.stringify(targetQuote.rooms)) : []);
      if (targetQuote.showItemAmount !== undefined) {
        setShowItemAmount(targetQuote.showItemAmount);
      }
      if (targetQuote.materialSpec && targetQuote.materialSpec.length > 0) {
        setQuoteMaterialSpec(JSON.parse(JSON.stringify(targetQuote.materialSpec)));
      }
    }
  }, [editId, reviseId, quotations]);

  useEffect(() => {
    if (preClientId && !editId && !reviseId) {
      setClientId(preClientId);
    }
  }, [preClientId, editId, reviseId]);

  const existingQuote = (editId || reviseId) ? quotations.find(q => q.id === (editId || reviseId)) : null;

  const subtotal = rooms.reduce((s, r) => s + (r.items || []).reduce((ss, item) => ss + (Number(item.amount) || 0), 0), 0);
  const gst = includeGST ? Math.round(subtotal * GST_RATE) : 0;
  const total = subtotal + gst;
  const totalSqft = Math.round(
    rooms.reduce((s, r) => s + (r.items || []).reduce((ss, item) => ss + calculateItemSqft(item), 0), 0) * 100
  ) / 100;

  const [scrollTargetRoomIndex, setScrollTargetRoomIndex] = useState(null);

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

  const getClient = () => clients.find(c => c.id === clientId);

  const handleSave = async (saveStatus = 'DRAFT') => {
    try {
      const client = getClient();
      const quoteData = {
        clientId,
        clientName: client?.name || 'Client',
        clientContact: client?.contact || '',
        clientAddress: client?.address || '',
        projectTitle,
        rooms,
        total,
        totalSqft,
        materialSpec: quoteMaterialSpec,
        showItemAmount,
        status: saveStatus,
      };

      if (editId) {
        await updateQuotation(editId, quoteData);
        setSavedMessage(saveStatus === 'INVOICE CREATED' ? '✓ Invoice Updated & Finalized!' : '✓ Draft Updated Successfully!');
        setSaved(true);
        setTimeout(() => setSaved(false), 3500);
      } else {
        const newId = await addQuotation(quoteData);
        setSavedMessage(saveStatus === 'INVOICE CREATED' ? '✓ Invoice Created Successfully!' : '✓ Saved as Draft!');
        setSaved(true);
        setTimeout(() => setSaved(false), 3500);
        if (reviseId) {
          setTimeout(() => {
            navigate('/history');
          }, 1500);
        } else if (newId && saveStatus === 'DRAFT') {
          // Immediately enter edit mode for this draft so subsequent edits update it directly
          navigate(`/builder?edit=${newId}`, { replace: true });
        }
      }
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
      id: editId || undefined,
      quotationNo: existingQuote?.quotationNo || `1290`,
      date: existingQuote?.date || new Date().toISOString().slice(0, 10),
      createdAt: existingQuote?.createdAt || new Date().toISOString(),
      clientName: client?.name || 'Client',
      clientContact: client?.contact || '',
      clientAddress: client?.address || '',
      projectTitle,
      rooms,
      total,
      materialSpec: quoteMaterialSpec,
      showItemAmount,
      status: editId ? (existingQuote?.status || 'INVOICE CREATED') : 'DRAFT',
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
        <span>{editId ? (existingQuote?.status === 'DRAFT' ? 'Edit Draft Invoice' : 'Edit Invoice') : reviseId ? 'Create Revision' : 'New Quote'}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {editId 
              ? (existingQuote?.status === 'DRAFT' ? `Edit Draft Invoice #${existingQuote?.quotationNo || ''}` : `Edit Invoice #${existingQuote?.quotationNo || ''}`)
              : reviseId 
                ? `Revise Invoice #${existingQuote?.quotationNo || ''}` 
                : 'Quotation Builder'}
          </h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0' }}>
            {editId
              ? (existingQuote?.status === 'DRAFT' ? 'Update items, dimensions, rates, and brand specs for this draft quotation.' : 'Update items, brands, and values for this existing invoice.')
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

      {/* Edit Mode Notification Banner */}
      {editId && (
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
      <div className="builder-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('scope')}
          className={`btn builder-tab-btn ${activeTab === 'scope' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Building size={16} /> 1. Scope of Work ({rooms.length} Rooms, {totalItems} Items{totalSqft > 0 ? `, ${totalSqft.toLocaleString('en-IN')} SQFT` : ''})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('materials')}
          className={`btn builder-tab-btn ${activeTab === 'materials' ? 'btn-primary' : 'btn-secondary'}`}
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
          subtotal={subtotal} gst={gst} total={total} totalItems={totalItems} totalSqft={totalSqft}
          includeGST={includeGST} setIncludeGST={setIncludeGST}
          showItemAmount={showItemAmount} setShowItemAmount={setShowItemAmount}
          onSaveInvoice={() => handleSave('INVOICE CREATED')}
          onSaveDraft={() => handleSave('DRAFT')}
          onPreview={() => setShowPreview(true)}
          saved={saved} savedMessage={savedMessage} clientId={clientId}
          isEditing={Boolean(editId)}
          isRevising={Boolean(reviseId)}
          existingQuote={existingQuote}
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
          subtotal={subtotal} gst={gst} total={total} totalItems={totalItems} totalSqft={totalSqft}
          includeGST={includeGST} setIncludeGST={setIncludeGST}
          showItemAmount={showItemAmount} setShowItemAmount={setShowItemAmount}
          onSaveInvoice={() => handleSave('INVOICE CREATED')}
          onSaveDraft={() => handleSave('DRAFT')}
          onPreview={() => setShowPreview(true)}
          saved={saved} savedMessage={savedMessage} clientId={clientId}
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
  const [activePickerIndex, setActivePickerIndex] = useState(null);
  const [inlineCustomRoom, setInlineCustomRoom] = useState('');

  return (
    <div>
      <div className="section-header" style={{ marginBottom: 12 }}>
        <div className="section-title">Scope of Work</div>
        <button 
          type="button" 
          className="btn btn-secondary btn-sm" 
          onClick={() => {
            setShowRoomPicker(p => !p);
            setActivePickerIndex(null);
          }}
        >
          <Plus size={14} /> Add Room
        </button>
      </div>

      {showRoomPicker && (
        <div className="card" style={{ padding: 14, marginBottom: 12, border: '1.5px solid var(--primary)', background: 'var(--surface)' }}>
          <div className="form-label" style={{ marginBottom: 8, color: 'var(--primary)', fontWeight: 700 }}>Select Preset Room</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {PRESET_ROOMS.map(r => (
              <button 
                key={r} 
                type="button" 
                className="tag" 
                style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '5px 12px', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600 }} 
                onClick={() => addRoom(r)}
              >
                + {r}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input 
              className="form-input" 
              placeholder="Custom room name..." 
              value={customRoom} 
              onChange={e => setCustomRoom(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && customRoom.trim()) {
                  addRoom(customRoom);
                }
              }} 
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={() => addRoom(customRoom)}>Add</button>
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
        <React.Fragment key={i}>
          <RoomSection
            room={room}
            index={i}
            onUpdate={data => updateRoom(i, data)}
            onDelete={() => deleteRoom(i)}
            onMoveUp={() => moveRoom(i, -1)}
            onMoveDown={() => moveRoom(i, 1)}
            isFirst={i === 0}
            isLast={i === rooms.length - 1}
          />

          {/* Add Room button after each room */}
          <div style={{ margin: '14px 0 20px' }}>
            {activePickerIndex === i ? (
              <div className="card" style={{ padding: 14, border: '1.5px solid var(--primary)', background: 'var(--surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div className="form-label" style={{ margin: 0, fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem' }}>
                    + Add Room After {room.name}
                  </div>
                  <button
                    type="button"
                    className="btn-icon"
                    style={{ padding: '2px 6px', color: 'var(--text-muted)' }}
                    onClick={() => setActivePickerIndex(null)}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {PRESET_ROOMS.map(r => (
                    <button
                      key={r}
                      type="button"
                      className="tag"
                      style={{
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        padding: '5px 12px',
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        fontWeight: 600,
                        border: '1px solid rgba(26, 86, 255, 0.2)'
                      }}
                      onClick={() => {
                        addRoom(r, i);
                        setActivePickerIndex(null);
                      }}
                    >
                      + {r}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="form-input"
                    placeholder="Or enter custom room name..."
                    value={inlineCustomRoom}
                    onChange={e => setInlineCustomRoom(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && inlineCustomRoom.trim()) {
                        addRoom(inlineCustomRoom, i);
                        setInlineCustomRoom('');
                        setActivePickerIndex(null);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      if (inlineCustomRoom.trim()) {
                        addRoom(inlineCustomRoom, i);
                        setInlineCustomRoom('');
                        setActivePickerIndex(null);
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 16px' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    borderColor: 'var(--primary)',
                    color: 'var(--primary)',
                    background: 'var(--surface)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    padding: '6px 16px',
                    borderRadius: 20,
                    boxShadow: 'var(--shadow-xs)',
                    gap: 6
                  }}
                  onClick={() => {
                    setActivePickerIndex(i);
                    setShowRoomPicker(false);
                  }}
                >
                  <Plus size={14} /> Add Room
                </button>
                <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
              </div>
            )}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Builder Right (Summary Panel) ───────────────────────────────────────
function BuilderRight({
  subtotal, gst, total, totalItems, totalSqft = 0,
  includeGST, setIncludeGST, showItemAmount, setShowItemAmount,
  onSaveInvoice, onSaveDraft, onPreview,
  saved, savedMessage, clientId, isEditing, isRevising, existingQuote
}) {
  return (
    <div>
      {/* Summary */}
      <div style={{ marginBottom: 16 }}>
        <div className="section-header" style={{ marginBottom: 10 }}>
          <div className="section-title">Summary</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {totalSqft > 0 && (
              <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }}>
                {totalSqft.toLocaleString('en-IN')} SQFT
              </span>
            )}
            <span className="badge badge-info">{totalItems} Items</span>
          </div>
        </div>
        <div className="summary-panel">
          {/* Total SQFT Card for Interior Designers */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(4px)',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 12,
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
                  📐 Total Interior Area
                </div>
                <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: 2 }}>
                  Designer metric (hidden in invoice)
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  {totalSqft.toLocaleString('en-IN')} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>SQFT</span>
                </div>
                {totalSqft > 0 && subtotal > 0 && (
                  <div style={{ fontSize: '0.68rem', opacity: 0.8, marginTop: 2 }}>
                    avg ₹{Math.round(subtotal / totalSqft).toLocaleString('en-IN')}/sqft
                  </div>
                )}
              </div>
            </div>
          </div>

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

      {/* Save as Invoice & Save as Draft Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={onSaveInvoice}
          disabled={!clientId}
          style={{
            padding: '11px 16px',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 6px rgba(26, 86, 255, 0.25)'
          }}
        >
          <FileCheck size={17} />
          {saved && savedMessage && savedMessage.includes('Invoice')
            ? savedMessage
            : isEditing
              ? (existingQuote?.status === 'DRAFT' ? 'Finalize & Save as Invoice' : 'Update & Finalize Invoice')
              : isRevising
                ? 'Save Revision as Invoice'
                : 'Save as Invoice (Invoice Created)'}
        </button>

        <button
          type="button"
          className="btn btn-secondary w-full"
          onClick={onSaveDraft}
          disabled={!clientId}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '9px 14px' }}
        >
          <Save size={15} />
          {saved && savedMessage && savedMessage.includes('Draft')
            ? savedMessage
            : isEditing
              ? (existingQuote?.status === 'DRAFT' ? 'Save Changes to Draft' : 'Save Changes as Draft')
              : 'Save as Draft'}
        </button>
      </div>

      {/* Note */}
      <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 12px', fontSize: '0.75rem', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
        <strong>NOTE:</strong> Prices are subject to final material verification. This quotation is valid for 15 days from the date of generation. Final measurements will be conducted on-site by a Vistara specialist.
      </div>
    </div>
  );
}
