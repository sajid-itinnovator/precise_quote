import React, { useState, useMemo, useEffect } from 'react';
import { Search, Trash2, Plus, X, User, ChevronDown, Check, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ClientPicker({
  value,
  onChange,
  onAddNew,
  placeholder = 'Select a client...',
  required = false
}) {
  const { clients = [], deleteClient } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Lock body scroll when picker is open on mobile; clear the search on close
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
      if (!isOpen) setSearch('');
    };
  }, [isOpen]);

  // 1) Sort Alphabetically A B C D
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => {
      const nameA = (a.name || '').trim();
      const nameB = (b.name || '').trim();
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });
  }, [clients]);

  // 2) Search Filter
  const filteredClients = useMemo(() => {
    if (!search.trim()) return sortedClients;
    const q = search.toLowerCase().trim();
    return sortedClients.filter(c => {
      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const contactMatch = (c.contact || '').toLowerCase().includes(q);
      const addressMatch = (c.address || '').toLowerCase().includes(q);
      return nameMatch || contactMatch || addressMatch;
    });
  }, [sortedClients, search]);

  // Group by Letter (A, B, C, D...) when not actively searching
  const groupedClients = useMemo(() => {
    if (search.trim()) return null; // Flat list when searching
    const map = {};
    for (const c of filteredClients) {
      const firstChar = (c.name || '').trim().charAt(0).toUpperCase() || '#';
      const key = /^[A-Z]$/.test(firstChar) ? firstChar : '#';
      if (!map[key]) map[key] = [];
      map[key].push(c);
    }
    return map;
  }, [filteredClients, search]);

  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === value);
  }, [clients, value]);

  // 3) Delete Client Option
  const handleDelete = async (e, client) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to delete client "${client.name}"?\n\nThis will remove this client from your client database.`
    );
    if (confirmed) {
      try {
        await deleteClient(client.id);
        if (value === client.id) {
          onChange('');
        }
      } catch (err) {
        console.error('Failed to delete client:', err);
        alert('Failed to delete client. Please try again.');
      }
    }
  };

  const handleSelect = (clientId) => {
    onChange(clientId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Field */}
      <div
        onClick={() => setIsOpen(true)}
        className="form-select"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '8px 12px',
          background: 'var(--surface)',
          borderRadius: 6,
          border: '1px solid var(--border)',
          userSelect: 'none',
          minHeight: 40
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <User size={15} style={{ color: selectedClient ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0 }} />
          {selectedClient ? (
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {selectedClient.name} {selectedClient.contact ? <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem' }}>({selectedClient.contact})</span> : ''}
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>
          )}
        </div>
        <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </div>

      {/* Hidden input for HTML form validation if required */}
      {required && (
        <input
          type="text"
          value={value || ''}
          onChange={() => {}}
          required
          style={{ opacity: 0, height: 0, width: 0, position: 'absolute', pointerEvents: 'none' }}
          tabIndex={-1}
        />
      )}

      {/* Mobile Bottom-Sheet & Desktop Modal Picker */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            animation: 'fadeIn 0.15s ease'
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 520,
              maxHeight: '85vh',
              background: 'var(--surface, #ffffff)',
              borderRadius: '20px 20px 0 0',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -8px 30px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              animation: 'slideUp 0.2s ease'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '16px 18px 12px',
              borderBottom: '1px solid var(--border-light, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--secondary, #0f172a)' }}>
                  Select Client
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {sortedClients.length} clients in database (A to Z)
                </div>
              </div>
              <button
                type="button"
                className="btn-icon btn-ghost"
                onClick={() => setIsOpen(false)}
                style={{ borderRadius: '50%', width: 34, height: 34 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input Box */}
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-light, #e2e8f0)', background: 'var(--surface-2, #f8fafc)' }}>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'var(--surface, #ffffff)',
                borderRadius: 8,
                border: '1.5px solid var(--border, #cbd5e1)',
                padding: '0 10px'
              }}>
                <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search client name or phone number..."
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    padding: '9px 8px',
                    fontSize: '0.9rem',
                    background: 'transparent'
                  }}
                  autoFocus
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Client List */}
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '6px 0' }}>
              {/* Empty state */}
              {filteredClients.length === 0 ? (
                <div style={{ padding: '36px 18px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <User size={36} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    No clients found
                  </div>
                  <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
                    {search ? `No client matching "${search}"` : 'Your client directory is currently empty.'}
                  </div>
                </div>
              ) : groupedClients ? (
                /* Alphabetical Grouped View (A, B, C, D...) */
                Object.keys(groupedClients).sort().map(letter => (
                  <div key={letter}>
                    <div style={{
                      padding: '4px 18px',
                      background: 'var(--surface-2, #f8fafc)',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: 'var(--primary, #1a56ff)',
                      letterSpacing: '0.05em',
                      borderTop: '1px solid var(--border-light, #e2e8f0)',
                      borderBottom: '1px solid var(--border-light, #e2e8f0)'
                    }}>
                      {letter}
                    </div>
                    {groupedClients[letter].map(c => (
                      <ClientListItem
                        key={c.id}
                        client={c}
                        isSelected={value === c.id}
                        onSelect={() => handleSelect(c.id)}
                        onDelete={(e) => handleDelete(e, c)}
                      />
                    ))}
                  </div>
                ))
              ) : (
                /* Flat Search Results */
                filteredClients.map(c => (
                  <ClientListItem
                    key={c.id}
                    client={c}
                    isSelected={value === c.id}
                    onSelect={() => handleSelect(c.id)}
                    onDelete={(e) => handleDelete(e, c)}
                  />
                ))
              )}
            </div>

            {/* Bottom Actions: Add New Client */}
            <div style={{
              padding: '12px 18px 18px',
              borderTop: '1px solid var(--border-light, #e2e8f0)',
              background: 'var(--surface, #ffffff)',
              display: 'flex',
              gap: 10
            }}>
              {onAddNew && (
                <button
                  type="button"
                  className="btn btn-secondary w-full"
                  onClick={() => {
                    setIsOpen(false);
                    onAddNew();
                  }}
                  style={{
                    padding: '11px 16px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    gap: 8,
                    borderColor: 'var(--primary)',
                    color: 'var(--primary)'
                  }}
                >
                  <Plus size={16} /> + Add New Client
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Individual Client Item Row with Delete Option
function ClientListItem({ client, isSelected, onSelect, onDelete }) {
  const initials = (client.name || 'C')
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '11px 18px',
        borderBottom: '1px solid var(--border-light, #f1f5f9)',
        cursor: 'pointer',
        background: isSelected ? 'var(--primary-light, #eff6ff)' : 'transparent',
        transition: 'background 0.1s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1, paddingRight: 10 }}>
        {/* Avatar badge */}
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: isSelected ? 'var(--primary)' : 'var(--secondary, #17365d)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.78rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {initials}
        </div>

        {/* Client details */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontWeight: isSelected ? 700 : 600,
            fontSize: '0.88rem',
            color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {client.name}
          </div>
          {client.contact && (
            <div style={{
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              marginTop: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <Phone size={10} /> {client.contact}
            </div>
          )}
          {client.address && (
            <div style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              opacity: 0.8
            }}>
              {client.address}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons: Selected Checkmark & Delete Icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {isSelected && (
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'var(--primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Check size={14} strokeWidth={3} />
          </div>
        )}

        {/* Delete option */}
        <button
          type="button"
          onClick={onDelete}
          className="btn-icon btn-ghost"
          style={{
            color: '#ef4444',
            padding: 6,
            borderRadius: 6,
            background: 'rgba(239, 68, 68, 0.08)',
            border: 'none',
            cursor: 'pointer'
          }}
          title={`Delete ${client.name}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
