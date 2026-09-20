import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { formatIndianCurrency } from '../../utils/helpers';
import { parseItemQuantity, calculateItemSqft, detectUnit } from '../../utils/dimensions';
import { ROOM_PRESET_ITEMS, ALL_PRESET_ITEMS } from '../../constants/quoteCatalog';

// ─── Item Row ─────────────────────────────────────────────────────────────
function ItemRow({ item, index = 0, roomName, onUpdate, onDelete }) {
  const [manualOverride, setManualOverride] = useState(false);
  const rate = item._rate ?? '';

  const currentUnit = item.unit || detectUnit(item.size);

  const parsedQty = parseItemQuantity({ ...item, unit: currentUnit });
  const rateNum = parseFloat(rate) || 0;
  const isAutoCalc = parsedQty !== null && rateNum > 0;
  const autoAmount = isAutoCalc ? Math.round(parsedQty.qty * rateNum) : null;

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
export function RoomSection({ room, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
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
