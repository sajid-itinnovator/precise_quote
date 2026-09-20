import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { RoomSection } from './ItemAndRoomEditors';
import { PRESET_ROOMS } from '../../constants/quoteCatalog';

// ─── Builder Left (Scope of Work) ─────────────────────────────────────────
export default function BuilderLeft({ rooms, updateRoom, deleteRoom, moveRoom, showRoomPicker, setShowRoomPicker, customRoom, setCustomRoom, addRoom }) {
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
