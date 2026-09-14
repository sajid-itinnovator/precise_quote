import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronDown, ChevronUp, Calculator, Eye, Home, ArrowRight, Building, Layers, FileCheck, Save, Copy, Pencil, RotateCcw, Check, Lock, Users, Phone, MapPin, Hash } from 'lucide-react';
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

// ─── Parse Item Quantity & Unit (Sq Ft, Per Point, Running Feet, Inches, Meters) ────────
export function parseItemQuantity(item) {
  if (!item || !item.size) return null;
  const sizeStr = String(item.size).trim();
  const unit = item.unit || (() => {
    const s = sizeStr.toLowerCase();
    if (s.includes('point') || s.includes(' pt')) return 'point';
    if (s.includes('rft') || s.includes('running')) return 'rft';
    if (s.includes('inch') || s.includes('in"') || s.includes('"')) return 'inch';
    if (s.includes('meter') || s.includes('mtr') || s.includes(' m')) return 'meter';
    return 'sqft';
  })();

  // 1. 3 dimensions: e.g. "1.5 X 2 X 2"
  const cleaned = sizeStr.replace(/['"“”]/g, '').replace(/\b(?:ft|feet)\b/gi, '').trim();
  const match3 = cleaned.match(/^([\d.]+)\s*[xX×*]\s*([\d.]+)\s*[xX×*]\s*([\d.]+)$/);
  if (match3) {
    const d1 = parseFloat(match3[1]) || 0;
    const d2 = parseFloat(match3[2]) || 0;
    const d3 = parseFloat(match3[3]) || 0;
    if (d1 > 0 && d2 > 0 && d3 > 0) {
      const total = Math.round(d1 * d2 * d3 * 100) / 100;
      return {
        qty: total,
        unit: 'cft',
        unitShort: 'cft',
        unitLabel: 'CFT',
        formatted: `${total} CFT`,
        formula: `${d1} × ${d2} × ${d3} = ${total} CFT`,
        is2D: false,
        is3D: true
      };
    }
  }

  // 2. 2 dimensions: e.g. "7 X 4.5"
  const match2 = cleaned.match(/^([\d.]+)\s*[xX×*]\s*([\d.]+)$/);
  if (match2) {
    const d1 = parseFloat(match2[1]) || 0;
    const d2 = parseFloat(match2[2]) || 0;
    if (d1 > 0 && d2 > 0) {
      const total = Math.round(d1 * d2 * 100) / 100;
      const unitLbl = unit === 'meter' ? 'Meter' : unit === 'inch' ? 'Inch' : 'Sq Ft';
      const unitSht = unit === 'meter' ? 'mtr' : unit === 'inch' ? 'inch' : 'sqft';
      return {
        qty: total,
        unit: unit === 'meter' ? 'meter' : unit === 'inch' ? 'inch' : 'sqft',
        unitShort: unitSht,
        unitLabel: unitLbl,
        formatted: `${total} ${unitLbl}`,
        formula: `${d1} × ${d2} = ${total} ${unitLbl}`,
        is2D: true
      };
    }
  }

  // 3. Single numeric quantity: e.g. "12", "12 Points", "25 Rft", "36 Inch", "3.5 Meter", "120 Sq Ft"
  const numMatch = sizeStr.match(/^([\d.]+)/);
  if (numMatch) {
    const qty = parseFloat(numMatch[1]) || 0;
    if (qty > 0) {
      if (unit === 'point') {
        return {
          qty,
          unit: 'point',
          unitShort: 'point',
          unitLabel: 'Per Point',
          formatted: `${qty} Points`,
          is2D: false
        };
      } else if (unit === 'rft') {
        return {
          qty,
          unit: 'rft',
          unitShort: 'rft',
          unitLabel: 'Running Feet',
          formatted: `${qty} Rft`,
          is2D: false
        };
      } else if (unit === 'inch') {
        return {
          qty,
          unit: 'inch',
          unitShort: 'inch',
          unitLabel: 'Inches',
          formatted: `${qty} Inch`,
          is2D: false
        };
      } else if (unit === 'meter') {
        return {
          qty,
          unit: 'meter',
          unitShort: 'meter',
          unitLabel: 'Meters',
          formatted: `${qty} Meter`,
          is2D: false
        };
      } else {
        return {
          qty,
          unit: 'sqft',
          unitShort: 'sqft',
          unitLabel: 'Sq Ft',
          formatted: `${qty} Sq Ft`,
          is2D: false
        };
      }
    }
  }

  return null;
}

// ─── Calculate SQFT / Units for an Item (Interior Designer Only) ────────
export function calculateItemSqft(item) {
  if (!item) return 0;
  const unit = item.unit || (() => {
    const s = (item.size || '').toLowerCase();
    if (s.includes('point') || s.includes(' pt')) return 'point';
    if (s.includes('rft') || s.includes('running')) return 'rft';
    if (s.includes('inch') || s.includes('in"') || s.includes('"')) return 'inch';
    if (s.includes('meter') || s.includes('mtr') || s.includes(' m')) return 'meter';
    return 'sqft';
  })();
  if (unit === 'point' || unit === 'rft' || unit === 'inch' || unit === 'meter') {
    return 0;
  }

  if (item.sqft && !isNaN(Number(item.sqft))) return Number(item.sqft);
  
  const dims = parseDimensions(item.size);
  if (dims && dims.total > 0) {
    return dims.total;
  }

  const sizeStr = (item.size || '').trim();
  const directMatch = sizeStr.match(/^([\d.]+)\s*(?:sq\.?\s*ft|sft)$/i);
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
function ItemRow({ item, index = 0, roomName, onUpdate, onDelete }) {
  const [manualOverride, setManualOverride] = useState(false);
  const rate = item._rate ?? '';

  const currentUnit = item.unit || (() => {
    const s = (item.size || '').toLowerCase();
    if (s.includes('point') || s.includes(' pt')) return 'point';
    if (s.includes('rft') || s.includes('running')) return 'rft';
    if (s.includes('inch') || s.includes('in"') || s.includes('"')) return 'inch';
    if (s.includes('meter') || s.includes('mtr') || s.includes(' m')) return 'meter';
    return 'sqft';
  })();

  const parsedQty = parseItemQuantity({ ...item, unit: currentUnit });
  const rateNum = parseFloat(rate) || 0;
  const isAutoCalc = parsedQty !== null && rateNum > 0;
  const autoAmount = isAutoCalc ? Math.round(parsedQty.qty * rateNum) : null;
  const itemSqft = calculateItemSqft({ ...item, unit: currentUnit });

  const normalizedRoom = (roomName || '').trim().toUpperCase();
  const roomKey = Object.keys(ROOM_PRESET_ITEMS).find(k => 
    k === normalizedRoom || normalizedRoom.includes(k) || k.includes(normalizedRoom)
  );
  const roomPresets = roomKey ? ROOM_PRESET_ITEMS[roomKey] : [];
  const otherPresets = ALL_PRESET_ITEMS.filter(p => !roomPresets.includes(p));

  // Determine if item is custom text (not matching standard room/preset list)
  const [isCustom, setIsCustom] = useState(() => {
    return Boolean(item.particular && !ALL_PRESET_ITEMS.includes(item.particular));
  });

  const updateSize = (val) => {
    const updatedItem = { ...item, size: val, unit: currentUnit };
    const parsed = parseItemQuantity(updatedItem);
    const r = parseFloat(rate) || 0;
    const newAmount = (!manualOverride && parsed && r > 0) ? Math.round(parsed.qty * r) : item.amount;
    onUpdate({ ...updatedItem, amount: newAmount });
  };

  const updateRate = (val) => {
    const updatedItem = { ...item, _rate: val, unit: currentUnit };
    const parsed = parseItemQuantity(updatedItem);
    const r = parseFloat(val) || 0;
    const newAmount = (!manualOverride && parsed && r > 0) ? Math.round(parsed.qty * r) : item.amount;
    onUpdate({ ...updatedItem, amount: newAmount });
  };

  const updateAmount = (val) => {
    setManualOverride(true);
    onUpdate({ ...item, amount: parseFloat(val) || 0 });
  };

  const handleUnitChange = (newUnit) => {
    let newSize = (item.size || '').trim();
    if (newSize) {
      const numOnly = newSize.match(/^([\d.]+)\s*(?:sq\.?\s*ft|sft|points?|pts?|rft|running\s*feet|r\.?\s*ft|inch(?:es)?|in|meters?|mtrs?|m)?$/i);
      if (numOnly) {
        const num = numOnly[1];
        if (newUnit === 'point') newSize = `${num} Points`;
        else if (newUnit === 'rft') newSize = `${num} Rft`;
        else if (newUnit === 'inch') newSize = `${num} Inch`;
        else if (newUnit === 'meter') newSize = `${num} Meter`;
        else if (newUnit === 'sqft') {
          if (!newSize.includes('X') && !newSize.includes('x') && !newSize.includes('*')) {
            newSize = `${num} Sq Ft`;
          }
        }
      }
    }
    const updatedItem = { ...item, unit: newUnit, size: newSize };
    const parsed = parseItemQuantity(updatedItem);
    const r = parseFloat(rate) || 0;
    const newAmount = (!manualOverride && parsed && r > 0) ? Math.round(parsed.qty * r) : item.amount;
    onUpdate({ ...updatedItem, amount: newAmount });
  };

  const handleSizeBlur = () => {
    const val = (item.size || '').trim();
    if (!val) return;
    const numOnly = val.match(/^([\d.]+)$/);
    if (numOnly) {
      const num = numOnly[1];
      let formattedSize = val;
      if (currentUnit === 'point') formattedSize = `${num} Points`;
      else if (currentUnit === 'rft') formattedSize = `${num} Rft`;
      else if (currentUnit === 'inch') formattedSize = `${num} Inch`;
      else if (currentUnit === 'meter') formattedSize = `${num} Meter`;
      if (formattedSize !== val) {
        updateSize(formattedSize);
      }
    }
  };

  return (
    <div className="room-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: '12px 14px' }}>

      {/* Row 1: Item Selection Header & Presets Toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              color: !isCustom ? 'var(--primary)' : 'var(--text-muted)'
            }}>
              <input
                type="radio"
                name={`item-mode-${roomName}-${index}`}
                checked={!isCustom}
                onChange={() => {
                  setIsCustom(false);
                  if (!item.particular && roomPresets.length > 0) {
                    onUpdate({ ...item, particular: roomPresets[0] });
                  }
                }}
                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span>Preset Item</span>
            </label>
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              color: isCustom ? 'var(--primary)' : 'var(--text-muted)'
            }}>
              <input
                type="radio"
                name={`item-mode-${roomName}-${index}`}
                checked={isCustom}
                onChange={() => setIsCustom(true)}
                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span>Custom Text</span>
            </label>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={onDelete}
            style={{ padding: '4px 8px', fontSize: '0.75rem', gap: 4 }}
            title="Delete this item"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>

        {/* Item Particular Input / Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isCustom ? (
            <select
              className="form-select"
              style={{
                flex: 1,
                fontSize: '0.88rem',
                padding: '8px 12px',
                fontWeight: 600,
                background: 'var(--surface-2, #f8fafc)',
                borderColor: 'var(--border, #cbd5e1)',
                cursor: 'pointer',
                borderRadius: 6
              }}
              value={item.particular || ''}
              onChange={e => {
                const val = e.target.value;
                if (val === '__custom__') {
                  setIsCustom(true);
                } else if (val) {
                  onUpdate({ ...item, particular: val });
                }
              }}
              title="Select preset item"
            >
              <option value="">-- Select Preset Item --</option>
              {roomPresets.length > 0 && (
                <optgroup label={`${roomKey} PRESETS`}>
                  {roomPresets.map((opt, idx) => (
                    <option key={`rp-${idx}`} value={opt}>{opt}</option>
                  ))}
                </optgroup>
              )}
              {otherPresets.length > 0 && (
                <optgroup label="OTHER ROOM ITEMS">
                  {otherPresets.map((opt, idx) => (
                    <option key={`op-${idx}`} value={opt}>{opt}</option>
                  ))}
                </optgroup>
              )}
              <option value="__custom__">✏️ Custom / Edit text...</option>
            </select>
          ) : (
            <input
              className="form-input"
              style={{ flex: 1, fontSize: '0.88rem', padding: '8px 12px' }}
              placeholder="Type custom item particular (e.g. Designer Crockery Unit)..."
              value={item.particular || ''}
              onChange={e => onUpdate({ ...item, particular: e.target.value })}
              autoFocus
            />
          )}
        </div>
      </div>

      {/* Row 2: Ergonomic 4-Column Baseline: Size | Unit | Rate | Amount */}
      <div className="item-row-grid">
        {/* Col 1: Size / Dimensions */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
            <label className="form-label" style={{ fontSize: '0.62rem', margin: 0, fontWeight: 700, color: 'var(--text-secondary)' }}>
              SIZE / DIMENSIONS
            </label>
            {parsedQty && (
              <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.62rem' }}>
                📐 {parsedQty.formatted}
              </span>
            )}
          </div>
          <input
            className="form-input"
            style={{ padding: '7px 10px', fontSize: '0.84rem' }}
            placeholder={
              currentUnit === 'point' ? 'e.g. 12 Points or 8' :
              currentUnit === 'rft' ? 'e.g. 25 Rft or 15' :
              currentUnit === 'inch' ? 'e.g. 36 Inch or 48' :
              currentUnit === 'meter' ? 'e.g. 3.5 Meter or 10' :
              'e.g. 7 X 4.5 or 120'
            }
            value={item.size || ''}
            onChange={e => updateSize(e.target.value)}
            onBlur={handleSizeBlur}
          />
        </div>

        {/* Col 2: Unit Dropdown */}
        <div>
          <label className="form-label" style={{ fontSize: '0.62rem', marginBottom: 3, display: 'block', fontWeight: 700, color: 'var(--text-secondary)' }}>
            UNIT
          </label>
          <select
            className="form-select"
            value={currentUnit}
            onChange={e => handleUnitChange(e.target.value)}
            style={{
              fontSize: '0.82rem',
              padding: '7px 10px',
              fontWeight: 600,
              color: 'var(--primary)',
              background: 'var(--surface-2, #f8fafc)',
              borderColor: 'var(--border, #cbd5e1)',
              borderRadius: 6,
              cursor: 'pointer',
              width: '100%'
            }}
            title="Select measurement unit"
          >
            <option value="sqft">Sq Ft</option>
            <option value="point">Per Point</option>
            <option value="rft">Running Feet</option>
            <option value="inch">Inches</option>
            <option value="meter">Meters</option>
          </select>
        </div>

        {/* Col 3: Rate */}
        <div>
          <label className="form-label" style={{ fontSize: '0.62rem', marginBottom: 3, display: 'block', fontWeight: 700, color: 'var(--text-secondary)' }}>
            RATE (₹/{parsedQty?.unitShort || currentUnit})&nbsp;
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>opt</span>
          </label>
          <input
            className="form-input"
            type="number"
            min="0"
            style={{ padding: '7px 10px', fontSize: '0.84rem' }}
            placeholder="0"
            value={rate}
            onChange={e => updateRate(e.target.value)}
          />
        </div>

        {/* Col 4: Amount */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            <label className="form-label" style={{ fontSize: '0.62rem', margin: 0, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: 'var(--text-secondary)' }}>
              AMOUNT (₹)
              {isAutoCalc && !manualOverride && (
                <span style={{
                  fontSize: '0.5rem', background: 'var(--primary)', color: '#fff',
                  padding: '1px 5px', borderRadius: 99, fontWeight: 700,
                }}>AUTO</span>
              )}
            </label>
            {isAutoCalc && (
              <button
                type="button"
                onClick={() => {
                  if (manualOverride) {
                    setManualOverride(false);
                    onUpdate({ ...item, amount: autoAmount });
                  } else {
                    setManualOverride(true);
                  }
                }}
                className="btn-ghost"
                style={{ fontSize: '0.62rem', color: 'var(--primary)', cursor: 'pointer', padding: '0 2px', border: 'none', background: 'none' }}
                title={manualOverride ? 'Re-sync to auto calculation' : 'Override amount manually'}
              >
                {manualOverride ? '🔄 Sync Auto' : '✏️ Custom'}
              </button>
            )}
          </div>
          <input
            className="form-input"
            type="number"
            min="0"
            style={{
              padding: '7px 10px', fontSize: '0.84rem',
              background: isAutoCalc && !manualOverride ? 'var(--primary-light)' : undefined,
              color: isAutoCalc && !manualOverride ? 'var(--primary)' : undefined,
              fontWeight: isAutoCalc && !manualOverride ? 700 : undefined,
            }}
            placeholder="0"
            value={item.amount || ''}
            onChange={e => updateAmount(e.target.value)}
            readOnly={isAutoCalc && !manualOverride}
          />
        </div>
      </div>

      {/* Auto-calc subtle breakdown helper */}
      {isAutoCalc && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--surface-2, #f1f5f9)',
          border: '1px solid var(--border-light, #e2e8f0)',
          borderRadius: 6, padding: '3px 10px', alignSelf: 'flex-start',
          fontSize: '0.72rem', color: 'var(--text-secondary, #475569)', fontWeight: 600
        }}>
          <Calculator size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span>
            {parsedQty.formula || parsedQty.formatted} × ₹{rate}/{parsedQty.unitShort} = <strong style={{ color: 'var(--primary)' }}>₹{formatIndianCurrency(autoAmount)}</strong>
            {manualOverride && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>(Manual override: ₹{formatIndianCurrency(item.amount || 0)})</span>}
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
            <ItemRow key={i} item={item} index={i} roomName={room.name} onUpdate={data => updateItem(i, data)} onDelete={() => deleteItem(i)} />
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
  const { clients, projects, updateProject, updateClient, addClient, quotations, addQuotation, updateQuotation, materialSpec, updateMaterialSpec, ROOMS_DEFAULT, nextQuoteNo, calculateNextQuoteNo } = useApp();
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
      if (targetQuote.clientName) setClientName(targetQuote.clientName);
      if (targetQuote.clientContact) setClientContact(targetQuote.clientContact);
      if (targetQuote.clientAddress) setClientAddress(targetQuote.clientAddress);

      if (reviseId) {
        setProjectTitle(getNextRevisionTitle(targetQuote.projectTitle));
        const nextNum = calculateNextQuoteNo ? calculateNextQuoteNo(quotations, nextQuoteNo) : (nextQuoteNo || 1290);
        setQuotationNo(String(nextNum));
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

  // Auto-assign next quotation number for new quotations
  useEffect(() => {
    if (!editId && !reviseId) {
      const computed = calculateNextQuoteNo ? calculateNextQuoteNo(quotations, nextQuoteNo) : (nextQuoteNo || 1290);
      setQuotationNo(prev => prev ? prev : String(computed));
    }
  }, [nextQuoteNo, quotations, editId, reviseId, calculateNextQuoteNo]);

  // Pre-fill client if passed in query param
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

  // Pre-fill project title if passed in query param
  useEffect(() => {
    if (preProjectTitle && !editId && !reviseId) {
      try {
        setProjectTitle(decodeURIComponent(preProjectTitle));
      } catch {
        setProjectTitle(preProjectTitle);
      }
    }
  }, [preProjectTitle, editId, reviseId]);

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

  const isApproved = existingQuote?.status === 'APPROVED';

  const handleSave = async (saveStatus = 'DRAFT') => {
    try {
      if (editId && isApproved) {
        alert("This quotation is APPROVED and locked against direct edits. Please use 'Create Revision' to make changes.");
        return;
      }

      const client = getClient();
      const resolvedName = clientName.trim() || client?.name || 'Client';
      const resolvedContact = clientContact.trim() || client?.contact || '';
      const resolvedAddress = clientAddress.trim() || client?.address || '';
      const fallbackNo = calculateNextQuoteNo ? calculateNextQuoteNo(quotations, nextQuoteNo) : (nextQuoteNo || 1290);
      const resolvedQuoteNo = editId 
        ? (existingQuote?.quotationNo || quotationNo || String(fallbackNo))
        : (quotationNo.trim() || String(fallbackNo));

      let effectiveClientId = clientId === '__new__' ? '' : clientId;

      // Auto-create client record if user entered a custom client name and no client was selected
      if (!effectiveClientId && resolvedName && resolvedName !== 'Client' && addClient) {
        try {
          const newCId = await addClient({
            name: resolvedName,
            contact: resolvedContact,
            address: resolvedAddress,
            email: ''
          });
          if (newCId) {
            effectiveClientId = newCId;
            setClientId(newCId);
          }
        } catch (cErr) {
          console.warn("Could not auto-create client record:", cErr);
        }
      } else if (effectiveClientId && updateClient) {
        // If client already exists, sync back any updated contact or address
        try {
          const currentC = getClient();
          if (currentC && ((resolvedContact && currentC.contact !== resolvedContact) || (resolvedAddress && currentC.address !== resolvedAddress))) {
            await updateClient(effectiveClientId, {
              contact: resolvedContact || currentC.contact || '',
              address: resolvedAddress || currentC.address || ''
            });
          }
        } catch (syncErr) {
          console.warn("Could not sync client details:", syncErr);
        }
      }

      const quoteData = {
        quotationNo: resolvedQuoteNo,
        clientId: effectiveClientId || '',
        clientName: resolvedName,
        clientContact: resolvedContact,
        clientAddress: resolvedAddress,
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

      // Keep project.amount in sync with the latest invoice total if a matching project exists
      if (effectiveClientId && projects && projects.length > 0 && updateProject) {
        const matchingProj = projects.find(p => p.clientId === effectiveClientId);
        if (matchingProj) {
          try {
            await updateProject(matchingProj.id, { amount: total, status: saveStatus });
          } catch (projErr) {
            console.warn("Could not sync project amount:", projErr);
          }
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
    const resolvedName = clientName.trim() || client?.name || 'Client';
    const resolvedContact = clientContact.trim() || client?.contact || '';
    const resolvedAddress = clientAddress.trim() || client?.address || '';
    const fallbackNo = calculateNextQuoteNo ? calculateNextQuoteNo(quotations, nextQuoteNo) : (nextQuoteNo || 1290);
    const resolvedQuoteNo = quotationNo.trim() || existingQuote?.quotationNo || String(fallbackNo);

    return {
      id: editId || undefined,
      quotationNo: resolvedQuoteNo,
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

  const totalItems = rooms.reduce((s, r) => s + (r.items || []).length, 0);

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
            <select
              className="form-select"
              value={clientId}
              onChange={e => handleClientChange(e.target.value)}
            >
              <option value="">-- Choose Existing Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.contact ? `(${c.contact})` : ''}
                </option>
              ))}
              <option value="__new__">➕ + Add New Client / Customer</option>
            </select>
          </div>

          {/* Client Name Input */}
          <div className="form-group">
            <label className="form-label">Client Name *</label>
            <input
              className="form-input"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="e.g. Mr. Himakshi Vyas Sir"
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
              placeholder="e.g. +91 8619465377"
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
              value={quotationNo}
              onChange={e => setQuotationNo(e.target.value)}
              placeholder="e.g. 1294"
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
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: 24 }} className="desktop-only">
        {activeTab === 'scope' ? (
          <BuilderLeft
            rooms={rooms} updateRoom={updateRoom} deleteRoom={deleteRoom} moveRoom={moveRoom}
            showRoomPicker={showRoomPicker} setShowRoomPicker={setShowRoomPicker}
            customRoom={customRoom} setCustomRoom={setCustomRoom} addRoom={addRoom}
            PRESET_ROOMS={PRESET_ROOMS}
            onOpenMaterials={() => {
              setActiveTab('materials');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
                  alert('Saved as company default brands!');
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
            onOpenMaterials={() => {
              setActiveTab('materials');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : (
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700 }}>
                  Material Specifications &amp; Brands
                </h2>
                <p style={{ margin: '0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Brands for Page 2 of this invoice.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setActiveTab('scope');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{ gap: 6, fontSize: '0.75rem' }}
              >
                <Building size={13} /> Back
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
                  alert('Saved as company default brands!');
                }
              }}
            />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm w-full"
                onClick={() => {
                  setActiveTab('scope');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{ gap: 8 }}
              >
                <Building size={15} /> Done / Back to Scope of Work
              </button>
            </div>
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
            disabled={!clientId}
            style={{ padding: '6px 12px', fontSize: '0.78rem', gap: 4 }}
          >
            <FileCheck size={13} /> Finalize
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

// ─── Builder Left (Scope of Work) ─────────────────────────────────────────
function BuilderLeft({ rooms, updateRoom, deleteRoom, moveRoom, showRoomPicker, setShowRoomPicker, customRoom, setCustomRoom, addRoom, PRESET_ROOMS, onOpenMaterials }) {
  const [activePickerIndex, setActivePickerIndex] = useState(null);
  const [inlineCustomRoom, setInlineCustomRoom] = useState('');

  return (
    <div>
      <div className="section-header" style={{ marginBottom: 12 }}>
        <div className="section-title">Scope of Work</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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

          {/* Add Room and Material Brands & Specs buttons after each room */}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '8px 0 16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 20, height: 1, background: 'var(--border-light)' }} />
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
                <div style={{ flex: 1, minWidth: 20, height: 1, background: 'var(--border-light)' }} />
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
              <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700 }}>
                {totalSqft.toLocaleString('en-IN')} SQFT
              </span>
            )}
            <span className="badge badge-info">{totalItems} Items</span>
          </div>
        </div>
        <div className="summary-panel-light">
          {/* Total SQFT Card for Interior Designers */}
          <div style={{
            background: 'var(--surface-2, #f8fafc)',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 14,
            border: '1px solid var(--border-light, #e2e8f0)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                  📐 Total Interior Area
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Designer metric (hidden in invoice)
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--secondary)' }}>
                  {totalSqft.toLocaleString('en-IN')} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>SQFT</span>
                </div>
                {totalSqft > 0 && subtotal > 0 ? (
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    avg ₹{Math.round(subtotal / totalSqft).toLocaleString('en-IN')}/sqft
                  </div>
                ) : (
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    from Sq Ft items
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{formatIndianCurrency(subtotal)}</span>
          </div>
          <div className="summary-row" style={{ alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>GST (18%)</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={includeGST} onChange={e => setIncludeGST(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Include</span>
              </label>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{formatIndianCurrency(gst)}</span>
          </div>

          {/* Option to show or hide item-level amounts */}
          <div className="summary-row" style={{ alignItems: 'center', padding: '6px 0', borderTop: '1px dashed var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.85rem' }}>Item Amounts</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showItemAmount}
                  onChange={e => setShowItemAmount(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {showItemAmount ? 'Show in PDF' : 'Hide in PDF'}
                </span>
              </label>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: showItemAmount ? 'var(--primary)' : 'var(--text-muted)' }}>
              {showItemAmount ? 'Detailed' : 'Lump Sum'}
            </span>
          </div>
          <hr className="summary-divider" />
          
          <div className="summary-total-box">
            <div className="summary-total-label">Final Total Amount</div>
            <div className="summary-total-value">₹{formatIndianCurrency(total)}</div>
            {total > 0 && (
              <div style={{ marginTop: 4, fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {numberToWords(total)} Only
              </div>
            )}
          </div>

          {/* Action Button Hierarchy inside Summary Card */}
          {isEditing && existingQuote?.status === 'APPROVED' ? (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #ef4444',
              borderRadius: 8,
              padding: '12px 14px',
              marginTop: 14,
              textAlign: 'center'
            }}>
              <div style={{ fontWeight: 700, color: '#b91c1c', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Lock size={15} /> Invoice Approved &amp; Locked
              </div>
              <div style={{ fontSize: '0.75rem', color: '#7f1d1d', marginTop: 4, marginBottom: 8 }}>
                Direct edits are disabled for approved invoices.
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm w-full"
                onClick={() => window.location.href = `#/builder?revise=${existingQuote.id}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.8rem' }}
              >
                <Copy size={13} /> Create Revision Instead
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {/* Primary CTA */}
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

              {/* Secondary CTA */}
              <button
                type="button"
                className="btn btn-secondary w-full"
                style={{
                  borderColor: 'var(--primary)',
                  color: 'var(--primary)',
                  background: 'var(--surface)',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 14px'
                }}
                onClick={onPreview}
              >
                <Eye size={16} /> Preview &amp; Print Quotation
              </button>

              {/* Tertiary CTA */}
              <button
                type="button"
                className="btn btn-ghost w-full"
                onClick={onSaveDraft}
                disabled={!clientId}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.82rem'
                }}
              >
                <Save size={14} />
                {saved && savedMessage && savedMessage.includes('Draft')
                  ? savedMessage
                  : isEditing
                    ? (existingQuote?.status === 'DRAFT' ? 'Save Changes to Draft' : 'Save Changes as Draft')
                    : 'Save as Draft'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Note */}
      <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 12px', fontSize: '0.75rem', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
        <strong>NOTE:</strong> Prices are subject to final material verification. This quotation is valid for 15 days from the date of generation. Final measurements will be conducted on-site by a Vistara specialist.
      </div>
    </div>
  );
}
