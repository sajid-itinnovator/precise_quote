import React, { useState } from 'react';
import { Plus, Trash2, RotateCcw, Save, ChevronDown, ChevronUp, Layers } from 'lucide-react';

const POPULAR_BRANDS = [
  'BWR ISI710 GRADE (18mm & 12mm)',
  'BWP ISI710 GRADE (18mm & 12mm)',
  'Century Ply 710 Club Prime',
  'Greenply Club Premier',
  'Kitply Gold BWR',
  'BLOCK BOARD (35mm)',
  'ONYX',
  'Hettich (Soft-Close)',
  'Hafele Premium',
  'Ebco Specialty Fittings',
  'Blum Tandembox',
  'Godrej Locks & Hardware',
  'ADVANCE / REAL TOUCH',
  'Merino Laminates (1mm)',
  'Century Laminates (1mm)',
  'Royale Touche Luxury',
  'GYPROC GYPSUM SHEET (Saint-Gobain)',
  'PVC BOARD Waterproof',
  'PDF / PVC Moldings',
  'WASHABLE PREMIUM Wallpaper',
  'POLYCAB WIRES (FR/FRLS)',
  'Finolex Flame Guard',
  'LEGRAND SWITCHES (As Per Design)',
  'Schneider Electric Vivace',
  'Anchor Roma Modular',
  'CROMPTON OR ORIENT (Panel + COB + Profile Light)',
  'Philips LED Architectural',
  'ASIAN (Luster with Wall Putty, Primer +2 Coat)',
  'Asian Paints Royale Luxury Emulsion',
  'Berger Silk Glamor High Sheen',
  'Nerolac Impressions Ultra'
];

const LAMINATE_PRESETS = [
  'ADVANCE / REAL TOUCH',
  'Merino 1mm (High Gloss / Suede)',
  'Century Laminates (1mm)',
  'Greenlam Designer Laminates (1mm)',
  'Royale Touche Luxury (1.25mm)',
  'Anti-Fingerprint Acrylic (1.5mm)'
];

const PAINTS_PRESETS = [
  'ASIAN\n(Luster with Wall Putty, Primer +2 Coat)',
  'Asian Paints Royale Luxury Emulsion\n(2 Coats Putty + 1 Primer + 2 Coats)',
  'Asian Paints Tractor Emulsion (Economy)',
  'Berger Silk Glamor High Sheen Luxury',
  'Nerolac Impressions Ultra HD',
  'Dulux Velvet Touch Pearl Glow'
];

export default function MaterialSpecEditor({ spec = [], onChange, onReset, onSaveAsDefault }) {
  const [collapsed, setCollapsed] = useState({});
  const [newCatName, setNewCatName] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);

  const toggleCategory = (idx) => {
    setCollapsed(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleUpdateItem = (catIdx, itemIdx, field, val) => {
    const updated = spec.map((cat, ci) => {
      if (ci !== catIdx) return cat;
      const items = cat.items.map((item, ii) => {
        if (ii !== itemIdx) return item;
        return { ...item, [field]: val };
      });
      return { ...cat, items };
    });
    onChange(updated);
  };

  const [scrollTargetItem, setScrollTargetItem] = useState(null);

  const handleAddItem = (catIdx) => {
    setCollapsedCats(prev => ({ ...prev, [catIdx]: false }));
    const targetIdx = (spec[catIdx]?.items || []).length;
    const updated = spec.map((cat, ci) => {
      if (ci !== catIdx) return cat;
      return {
        ...cat,
        items: [...(cat.items || []), { material: 'New Material', brand: 'Specify Brand' }]
      };
    });
    onChange(updated);
    setScrollTargetItem({ catIdx, itemIdx: targetIdx });
  };

  useEffect(() => {
    if (scrollTargetItem) {
      const timer = setTimeout(() => {
        const el = document.querySelector(`[data-spec-row="${scrollTargetItem.catIdx}-${scrollTargetItem.itemIdx}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const input = el.querySelector('input');
          if (input) input.focus();
        }
      }, 60);
      setScrollTargetItem(null);
      return () => clearTimeout(timer);
    }
  }, [spec, scrollTargetItem]);

  const handleDeleteItem = (catIdx, itemIdx) => {
    const updated = spec.map((cat, ci) => {
      if (ci !== catIdx) return cat;
      return {
        ...cat,
        items: cat.items.filter((_, ii) => ii !== itemIdx)
      };
    });
    onChange(updated);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const updated = [
      ...spec,
      {
        category: newCatName.trim().toUpperCase(),
        items: [{ material: 'Specification', brand: 'Brand Name' }]
      }
    ];
    onChange(updated);
    setNewCatName('');
    setShowAddCat(false);
  };

  const handleDeleteCategory = (catIdx) => {
    if (window.confirm('Remove this category from this invoice?')) {
      onChange(spec.filter((_, ci) => ci !== catIdx));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Customize the exact brands & material specifications displayed on <strong>Page 2</strong> of the invoice PDF.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onReset && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ gap: 6, fontSize: '0.78rem' }}
              onClick={onReset}
              title="Reset to company standard defaults"
            >
              <RotateCcw size={13} /> Reset Defaults
            </button>
          )}
          {onSaveAsDefault && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ gap: 6, fontSize: '0.78rem', color: 'var(--primary)' }}
              onClick={onSaveAsDefault}
              title="Save current brands as company-wide default for future quotes"
            >
              <Save size={13} /> Save as Company Default
            </button>
          )}
        </div>
      </div>

      {/* Brand Suggestions datalist */}
      <datalist id="brand-suggestions">
        {POPULAR_BRANDS.map((b, i) => (
          <option key={i} value={b} />
        ))}
      </datalist>

      {/* Categories Accordion */}
      {spec.map((cat, ci) => {
        const isCollapsed = !!collapsed[ci];
        return (
          <div
            key={ci}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden'
            }}
          >
            {/* Category header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'var(--surface-2)',
                borderBottom: isCollapsed ? 'none' : '1px solid var(--border)',
                cursor: 'pointer'
              }}
              onClick={() => toggleCategory(ci)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={15} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.04em' }}>
                  {cat.category}
                </span>
                <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                  {(cat.items || []).length} items
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--primary)' }}
                  onClick={() => handleAddItem(ci)}
                  title="Add item to category"
                >
                  <Plus size={13} /> Add Item
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '4px 8px', color: 'var(--danger)' }}
                  onClick={() => handleDeleteCategory(ci)}
                  title="Delete category"
                >
                  <Trash2 size={13} />
                </button>
                <button
                  type="button"
                  className="btn-icon btn-ghost"
                  style={{ padding: 4 }}
                  onClick={() => toggleCategory(ci)}
                >
                  {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </div>
            </div>

            {/* Category Items */}
            {!isCollapsed && (
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(cat.items || []).map((item, ii) => {
                  const isLaminate = (cat.category || '').toUpperCase().includes('LAMINATE');
                  const isPaints = (cat.category || '').toUpperCase().includes('PAINT');
                  const isFreeText = isLaminate || isPaints || (item.brand && item.brand.includes('\n'));

                  return (
                    <div
                      key={ii}
                      data-spec-row={`${ci}-${ii}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        background: isFreeText ? 'var(--surface-2)' : 'transparent',
                        padding: isFreeText ? '10px 12px' : '2px 0',
                        borderRadius: 6,
                        border: isFreeText ? '1px solid var(--border)' : 'none'
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1.4fr 36px',
                          gap: 10,
                          alignItems: isFreeText ? 'flex-start' : 'center'
                        }}
                      >
                        <div>
                          {isFreeText && (
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                              Material Particular
                            </label>
                          )}
                          <input
                            className="form-input"
                            style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                            value={item.material || ''}
                            onChange={e => handleUpdateItem(ci, ii, 'material', e.target.value)}
                            placeholder="Material (e.g. Furniture: Gurjan)"
                          />
                        </div>

                        <div>
                          {isFreeText ? (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                <label style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700 }}>
                                  {isPaints ? '🎨 Paint Brand & Specifications (Free Text)' : isLaminate ? '🏷️ Laminate Brand & Finish (Free Text)' : 'Brand / Specification (Free Text)'}
                                </label>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  Multi-line supported
                                </span>
                              </div>
                              <textarea
                                className="form-input"
                                rows={isPaints || (item.brand && item.brand.includes('\n')) ? 3 : 2}
                                style={{
                                  fontSize: '0.82rem', padding: '6px 10px', fontWeight: 600,
                                  color: 'var(--primary)', resize: 'vertical', fontFamily: 'inherit',
                                  lineHeight: 1.4
                                }}
                                value={item.brand || ''}
                                onChange={e => handleUpdateItem(ci, ii, 'brand', e.target.value)}
                                placeholder={isPaints ? "Type any custom paint brand, coat specs, sheen...\n(e.g. ASIAN PAINTS ROYALE - 2 coats with primer & putty)" : "Type any custom laminate brand, thickness, code...\n(e.g. ADVANCE / REAL TOUCH 1mm High Gloss)"}
                              />
                            </div>
                          ) : (
                            <input
                              className="form-input"
                              style={{ fontSize: '0.82rem', padding: '6px 10px', fontWeight: 600, color: 'var(--primary)' }}
                              list="brand-suggestions"
                              value={item.brand || ''}
                              onChange={e => handleUpdateItem(ci, ii, 'brand', e.target.value)}
                              placeholder="Brand / Spec (e.g. BWR ISI710, ONYX)"
                            />
                          )}
                        </div>

                        <div style={{ paddingTop: isFreeText ? 20 : 0 }}>
                          <button
                            type="button"
                            className="btn-icon btn-ghost"
                            style={{ color: 'var(--danger)', padding: 6 }}
                            onClick={() => handleDeleteItem(ci, ii)}
                            title="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Quick Preset Chips for Laminate & Paints */}
                      {isFreeText && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Presets:</span>
                          {(isPaints ? PAINTS_PRESETS : LAMINATE_PRESETS).map((preset, pi) => (
                            <button
                              key={pi}
                              type="button"
                              className="tag"
                              style={{
                                cursor: 'pointer', fontSize: '0.68rem', padding: '3px 8px',
                                background: item.brand === preset ? 'var(--primary-light)' : 'var(--surface)',
                                color: item.brand === preset ? 'var(--primary)' : 'var(--text-secondary)',
                                border: '1px solid var(--border)', fontWeight: item.brand === preset ? 700 : 500
                              }}
                              onClick={() => handleUpdateItem(ci, ii, 'brand', preset)}
                              title="Click to insert this preset"
                            >
                              {preset.split('\n')[0]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {(cat.items || []).length === 0 && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                    No materials in this category. Click "+ Add Item" above.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add New Category button */}
      {!showAddCat ? (
        <button
          type="button"
          className="btn btn-secondary w-full"
          style={{ gap: 8, padding: '10px', fontSize: '0.85rem' }}
          onClick={() => setShowAddCat(true)}
        >
          <Plus size={15} /> Add New Material Category
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 8, background: 'var(--surface-2)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
          <input
            className="form-input"
            style={{ flex: 1, fontSize: '0.85rem' }}
            placeholder="Category Name (e.g. CIVIL WORK, SANITARY, VENEER)"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            autoFocus
          />
          <button type="button" className="btn btn-primary btn-sm" onClick={handleAddCategory}>
            Add
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddCat(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
